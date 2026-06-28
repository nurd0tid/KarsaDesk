"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Palette,
  PlugZap,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import type {
  ConnectedAccountPublic,
  ConnectedFile,
  Project,
  Provider,
  Task,
} from "@vk/contracts";
import type { ApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { WorkspaceAiPanel } from "@/components/workspace-ai-panel";

type AccountPayload = {
  google: ConnectedAccountPublic;
  figma: ConnectedAccountPublic;
};

const field =
  "w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60";

function figmaFileKey(value: string) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const index = parts.findIndex((part) =>
      ["file", "design", "proto", "board"].includes(part),
    );
    return index >= 0 ? parts[index + 1] || "" : "";
  } catch {
    return "";
  }
}

function figmaEmbedUrl(value: string) {
  return value
    ? `https://www.figma.com/embed?embed_host=karsadesk&url=${encodeURIComponent(value)}`
    : "";
}

export function FigmaLiveModal({
  open,
  onOpenChange,
  api,
  project,
  providers,
  initialProviderId,
  initialModelId,
  onTaskCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  api: ApiClient | null;
  project: Project | null;
  providers: Provider[];
  initialProviderId: string;
  initialModelId: string;
  onTaskCreated: (task: Task) => void;
}) {
  const [accounts, setAccounts] = useState<AccountPayload | null>(null);
  const [pat, setPat] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [previewRevision, setPreviewRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [providerId, setProviderId] = useState(initialProviderId);
  const [modelId, setModelId] = useState(initialModelId);
  const fileKey = useMemo(() => figmaFileKey(fileUrl), [fileUrl]);
  const embedUrl = useMemo(() => figmaEmbedUrl(fileUrl), [fileUrl]);
  const figma = accounts?.figma;
  const selectedProvider =
    providers.find((provider) => provider.id === providerId) ||
    providers[0] ||
    null;

  async function loadStatus() {
    if (!api) return;
    try {
      setAccounts(await api.get<AccountPayload>("/api/connect/status"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }

  useEffect(() => {
    if (open) void loadStatus();
  }, [open, api]);

  useEffect(() => {
    if (selectedProvider && !providerId) setProviderId(selectedProvider.id);
    if (
      selectedProvider &&
      !selectedProvider.models.some((model) => model.id === modelId)
    )
      setModelId(selectedProvider.models[0]?.id || "");
  }, [modelId, providerId, selectedProvider]);

  useEffect(() => {
    function refreshFromProviderEvent(value?: string | null) {
      if (!value) return;
      try {
        const payload = JSON.parse(value) as {
          provider?: string;
          status?: string;
        };
        if (payload.provider && payload.provider !== "figma") return;
        toast[payload.status === "error" ? "error" : "success"](
          payload.status === "error"
            ? "Figma connection failed"
            : "Figma connected. Refreshing status...",
        );
        void loadStatus();
      } catch {
        // Ignore unrelated storage values.
      }
    }
    function onMessage(event: MessageEvent) {
      if (
        event.data?.source === "karsadesk" &&
        event.data?.type === "provider-connected" &&
        (!event.data.provider || event.data.provider === "figma")
      ) {
        toast[event.data.status === "error" ? "error" : "success"](
          event.data.status === "error"
            ? "Figma connection failed"
            : "Figma connected. Refreshing status...",
        );
        void loadStatus();
      }
    }
    function onStorage(event: StorageEvent) {
      if (event.key === "karsadesk-provider-connected")
        refreshFromProviderEvent(event.newValue);
    }
    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
    };
  }, [api]);

  async function connectOAuth() {
    if (!api) return;
    setBusy(true);
    try {
      const payload = await api.post<{
        configured: boolean;
        url: string | null;
        message: string;
      }>("/api/connect/figma/start");
      if (!payload.configured || !payload.url) {
        toast.error(payload.message);
        return;
      }
      window.open(payload.url, "_blank", "popup,width=980,height=760");
      toast.info("Complete Figma login, then return to KarsaDesk.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function connectPat() {
    if (!api) return;
    setBusy(true);
    try {
      setAccounts(
        await api.post<AccountPayload>(
          "/api/connect/figma/pat",
          pat.trim() ? { token: pat.trim() } : {},
        ),
      );
      setPat("");
      toast.success("Figma connected locally");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function copyKey() {
    if (!fileKey) return;
    await navigator.clipboard.writeText(fileKey);
    toast.success("Figma file key copied");
  }

  async function createTaskFromConversation(prompt: string, answer: string) {
    if (!api || !project || !fileKey) return;
    try {
      const task = await api.post<Task>(`/api/projects/${project.uid}/tasks`, {
        title: `Figma: ${prompt.trim().slice(0, 72)}`,
        roughPrompt: prompt,
        refinedPrompt: [
          "# Figma workspace task",
          "",
          `File: ${fileUrl}`,
          "",
          "User request:",
          prompt,
          "",
          "AI conversation result:",
          answer,
        ].join("\n"),
        mode: "build",
        priority: "medium",
        acceptanceCriteria: [
          "New screens remain visually consistent with the selected Figma file.",
          "The AI proposal identifies frames, components, states, and responsive behavior.",
        ],
        verification: [
          "Review the embedded Figma canvas and the generated design specification.",
        ],
        dependencyUids: [],
        source: "manual",
      });
      await api.post<ConnectedFile>(
        `/api/tasks/${task.uid}/connected-files/from-provider`,
        {
          provider: "figma",
          externalFileId: fileKey,
          externalFileUrl: fileUrl || `https://www.figma.com/file/${fileKey}`,
          fileType: "figma",
          fileName: "Figma file",
        },
      );
      onTaskCreated(task);
      toast.success(`Figma task KD-${task.number} created explicitly`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-background">
      <header className="flex min-h-16 shrink-0 flex-wrap items-center gap-3 border-b border-border bg-panel px-3 py-2 sm:px-5">
        <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
          <ArrowLeft className="size-4" /> Back to kanban
        </Button>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-sm font-semibold">
            <Palette className="size-4 text-accent" /> Figma Workspace
          </h1>
          <p className="hidden text-[11px] text-muted sm:block">
            Buka canvas, pilih model, lalu jelaskan screen atau flow baru.
          </p>
        </div>
        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
          <select
            className="h-9 max-w-44 rounded-lg border border-border bg-elevated px-2 text-xs outline-none"
            value={selectedProvider?.id || ""}
            onChange={(event) => setProviderId(event.target.value)}
            title="AI provider"
          >
            {!providers.length && <option value="">No AI provider</option>}
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          <select
            className="h-9 max-w-52 rounded-lg border border-border bg-elevated px-2 text-xs outline-none"
            value={modelId}
            onChange={(event) => setModelId(event.target.value)}
            disabled={!selectedProvider}
            title="AI model"
          >
            {!selectedProvider && <option value="">No model</option>}
            {selectedProvider?.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void loadStatus()}
            disabled={!api || busy}
          >
            <RefreshCw className="size-3.5" /> Refresh connection
          </Button>
        </div>
      </header>

      <main className="scrollbar-thin min-h-0 flex-1 overflow-auto p-3 sm:p-4">
        <div className="grid min-h-full gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="space-y-4 rounded-2xl border border-border bg-elevated p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Project context
                </label>
                <input
                  className={field}
                  disabled
                  value={project?.name || "No project selected"}
                  readOnly
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Figma auth status
                </label>
                <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-panel px-3 text-sm">
                  {figma?.connected ? (
                    <CheckCircle2 className="size-4 text-success" />
                  ) : (
                    <ShieldCheck className="size-4 text-warning" />
                  )}
                  <span className="capitalize">
                    {figma?.status?.replaceAll("_", " ") || "checking"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Figma OAuth
                </label>
                <p className="text-xs leading-5 text-muted">
                  Requires `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET`, and
                  redirect URI in `.env.local`.
                </p>
              </div>
              <Button
                disabled={busy || !api}
                onClick={() => void connectOAuth()}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PlugZap className="size-4" />
                )}
                Connect OAuth
              </Button>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Development PAT
              </label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  className={field}
                  type="password"
                  value={pat}
                  onChange={(event) => setPat(event.target.value)}
                  placeholder="Paste Figma personal access token, or leave empty to use FIGMA_PERSONAL_ACCESS_TOKEN"
                />
                <Button
                  variant="secondary"
                  disabled={busy || !api}
                  onClick={() => void connectPat()}
                >
                  Connect PAT
                </Button>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                Token is sent only to the local orchestrator and stored in local
                SQLite. It is not exposed to the browser bundle or NocoDB.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Figma file URL
              </label>
              <input
                className={field}
                value={fileUrl}
                onChange={(event) => setFileUrl(event.target.value)}
                placeholder="https://www.figma.com/design/<fileKey>/..."
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="rounded bg-panel-strong px-2 py-1 font-mono">
                  {fileKey ? `file key: ${fileKey}` : "Paste a Figma URL"}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!fileKey}
                  onClick={() => void copyKey()}
                >
                  <Copy className="size-3.5" /> Copy key
                </Button>
                <Button
                  size="sm"
                  disabled={!fileUrl}
                  onClick={() =>
                    window.open(fileUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink className="size-3.5" /> Open Figma
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!embedUrl}
                  onClick={() => setPreviewRevision((value) => value + 1)}
                >
                  <RefreshCw className="size-3.5" /> Refresh preview
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-background">
              <div className="flex min-h-11 items-center justify-between gap-2 border-b border-border bg-panel px-3 py-2">
                <div>
                  <p className="text-xs font-semibold">Figma canvas preview</p>
                  <p className="text-[10px] text-muted">
                    Canvas asli; login Figma di embed jika diminta
                  </p>
                </div>
                {fileKey && (
                  <span className="max-w-44 truncate rounded bg-panel-strong px-2 py-1 font-mono text-[9px] text-muted">
                    {fileKey}
                  </span>
                )}
              </div>
              {embedUrl && fileKey ? (
                <iframe
                  key={`${fileKey}:${previewRevision}`}
                  title="Figma canvas preview"
                  src={embedUrl}
                  className="h-[min(640px,64vh)] min-h-[440px] w-full bg-[#1e1e1e]"
                  allow="clipboard-read; clipboard-write; fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <div className="grid min-h-[440px] place-items-center p-8 text-center text-sm text-muted">
                  Paste URL file Figma untuk membuka canvas langsung di sini.
                </div>
              )}
            </div>
          </section>

          <div className="min-w-0 space-y-3">
            <WorkspaceAiPanel
              api={api}
              project={project}
              workspace="figma"
              file={
                fileKey
                  ? {
                      externalFileId: fileKey,
                      externalFileUrl: fileUrl,
                      fileType: "figma",
                      fileName: "Selected Figma canvas",
                    }
                  : null
              }
              providerId={selectedProvider?.id || ""}
              modelId={modelId}
              suggestions={[
                {
                  label: "Understand canvas",
                  value:
                    "Jelaskan file Figma ini berisi halaman dan flow apa saja. Sebutkan frame, komponen, state, dan pola visual yang ditemukan. Jangan buat task atau mengklaim sudah mengubah canvas.",
                },
                {
                  label: "Register",
                  value:
                    "Pelajari login screen ini. Usulkan halaman register yang konsisten: field, validation, loading, error, success, social signup, desktop dan mobile.",
                },
                {
                  label: "OTP",
                  value:
                    "Pelajari login screen ini. Usulkan flow OTP verification lengkap: 6 digit, resend countdown, invalid/expired code, loading, success, desktop dan mobile.",
                },
                {
                  label: "Complete auth flow",
                  value:
                    "Gunakan login screen sebagai visual source. Usulkan register, OTP, forgot/reset password, success/error/loading states, component reuse, responsive layout, dan prototype connections.",
                },
              ]}
              onCreateTask={createTaskFromConversation}
            />
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-[11px] leading-5 text-warning">
              Percakapan tidak mengubah canvas. Setelah hasilnya benar, tekan
              Create task. Pembuatan node/frame otomatis tetap membutuhkan Figma
              Plugin bridge karena REST API hanya membaca metadata/tree.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
