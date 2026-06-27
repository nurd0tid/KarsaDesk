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
  AiFileAction,
  ConnectedAccountPublic,
  ConnectedFile,
  Project,
  Provider,
  Task,
} from "@vk/contracts";
import type { ApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "@/components/markdown-viewer";

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
  tasks,
  selectedTask,
  providers,
  initialProviderId,
  initialModelId,
  onSelectTask,
  onTaskCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  api: ApiClient | null;
  project: Project | null;
  tasks: Task[];
  selectedTask: Task | null;
  providers: Provider[];
  initialProviderId: string;
  initialModelId: string;
  onSelectTask: (task: Task | null) => void;
  onTaskCreated: (task: Task) => void;
}) {
  const [accounts, setAccounts] = useState<AccountPayload | null>(null);
  const [pat, setPat] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [actionResult, setActionResult] = useState("");
  const [previewRevision, setPreviewRevision] = useState(0);
  const [actionStage, setActionStage] = useState<
    "idle" | "reading" | "thinking" | "ready" | "failed"
  >("idle");
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

  async function ensureTargetTask() {
    if (selectedTask) return selectedTask;
    if (!api || !project || !fileKey || !prompt.trim()) return null;
    const task = await api.post<Task>(`/api/projects/${project.uid}/tasks`, {
      title: `Figma: ${prompt.trim().slice(0, 72)}`,
      roughPrompt: prompt.trim(),
      refinedPrompt: [
        "# Figma workspace task",
        "",
        `File: ${fileUrl}`,
        "",
        prompt.trim(),
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
    onTaskCreated(task);
    return task;
  }

  async function attachAndAskFigma() {
    if (!api || !fileKey) return;
    if (!prompt.trim()) {
      toast.error("Tulis dulu screen atau flow yang ingin dibuat.");
      return;
    }
    setBusy(true);
    setActionStage("reading");
    setActionResult("");
    try {
      const targetTask = await ensureTargetTask();
      if (!targetTask)
        throw new Error(
          "Pilih project atau task terlebih dahulu agar pekerjaan bisa dilacak.",
        );
      const connected = await api.post<ConnectedFile>(
        `/api/tasks/${targetTask.uid}/connected-files/from-provider`,
        {
          provider: "figma",
          externalFileId: fileKey,
          externalFileUrl: fileUrl || `https://www.figma.com/file/${fileKey}`,
          fileType: "figma",
          fileName: "Figma file",
        },
      );
      if (prompt.trim()) {
        setActionStage("thinking");
        const action = await api.post<AiFileAction>(
          `/api/tasks/${targetTask.uid}/ai-file-actions`,
          {
            connectedFileUid: connected.uid,
            prompt: prompt.trim(),
            actionType: "plan",
            applyMode: "preview",
            providerId: selectedProvider?.id,
            modelId: modelId || undefined,
          },
        );
        setActionResult(action.resultSummary || action.errorMessage || "");
        setActionStage(action.status === "failed" ? "failed" : "ready");
      } else {
        setActionResult(
          "Figma berhasil di-attach. Tulis instruksi agar AI membaca tree desain dan menyiapkan perubahan untuk direview.",
        );
      }
      if (!prompt.trim()) setActionStage("ready");
      setPreviewRevision((value) => value + 1);
      toast.success(`Figma design brief prepared in KD-${targetTask.number}`);
    } catch (error) {
      setActionStage("failed");
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
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
        <div className="grid min-h-full gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
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

            <div className="rounded-xl border border-border bg-panel p-3">
              <p className="text-xs font-semibold">Design with AI</p>
              <p className="mt-1 text-[11px] leading-5 text-muted">
                Jelaskan screen/flow baru. KarsaDesk membaca canvas saat ini
                agar hasilnya konsisten dengan desain login yang sudah ada.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  {
                    label: "Register",
                    value:
                      "Pelajari halaman login yang tampil. Buat spesifikasi halaman register yang konsisten: nama, email, password, konfirmasi password, social signup, validation, loading, success, dan responsive mobile.",
                  },
                  {
                    label: "OTP verification",
                    value:
                      "Pelajari halaman login yang tampil. Buat flow OTP verification yang konsisten: input 6 digit, countdown resend, error, expired code, success, loading, dan responsive mobile.",
                  },
                  {
                    label: "Forgot password",
                    value:
                      "Pelajari halaman login yang tampil. Buat flow forgot password, email sent, reset password, success, error, dan semua state responsive dengan design system yang sama.",
                  },
                  {
                    label: "Complete auth flow",
                    value:
                      "Gunakan login screen ini sebagai sumber visual. Rancang flow lengkap register, OTP verification, forgot password, reset password, success/error/loading states, desktop dan mobile. Jelaskan frame, component reuse, spacing, typography, dan prototype connections.",
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="rounded-full border border-border bg-elevated px-2.5 py-1 text-[10px] text-muted transition hover:border-accent hover:text-accent"
                    onClick={() => setPrompt(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <select
                className={`${field} mt-3 text-xs`}
                value={selectedTask?.uid || ""}
                onChange={(event) =>
                  onSelectTask(
                    tasks.find((task) => task.uid === event.target.value) ||
                      null,
                  )
                }
              >
                <option value="">Auto-create task dari prompt ini</option>
                {tasks.map((task) => (
                  <option key={task.uid} value={task.uid}>
                    KD-{task.number} · {task.title}
                  </option>
                ))}
              </select>
              <textarea
                className={`${field} mt-3 min-h-24 text-xs`}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Contoh: gunakan login ini sebagai acuan, lalu buat halaman register dan OTP lengkap dengan semua state desktop/mobile..."
              />
              <div
                className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-border bg-elevated p-1 text-center text-[9px] uppercase tracking-wide"
                aria-live="polite"
              >
                {[
                  ["reading", "Read tree"],
                  ["thinking", "AI review"],
                  ["ready", "Result"],
                ].map(([stage, label]) => {
                  const order = ["idle", "reading", "thinking", "ready"];
                  const active =
                    actionStage !== "failed" &&
                    order.indexOf(actionStage) >= order.indexOf(stage);
                  return (
                    <span
                      key={stage}
                      className={
                        active
                          ? "rounded bg-accent/10 px-1 py-1.5 text-accent"
                          : actionStage === "failed" && stage === "reading"
                            ? "rounded bg-danger/10 px-1 py-1.5 text-danger"
                            : "rounded px-1 py-1.5 text-muted"
                      }
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
              <Button
                className="mt-3 w-full"
                disabled={
                  !fileKey ||
                  !prompt.trim() ||
                  !selectedProvider ||
                  !modelId ||
                  busy
                }
                onClick={() => void attachAndAskFigma()}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PlugZap className="size-4" />
                )}
                {actionStage === "reading"
                  ? "Reading Figma tree..."
                  : actionStage === "thinking"
                    ? "AI reviewing design..."
                    : "Generate design specification"}
              </Button>
              {actionResult && (
                <MarkdownViewer
                  dense
                  className="scrollbar-thin mt-3 max-h-40 overflow-auto"
                >
                  {actionResult}
                </MarkdownViewer>
              )}
            </div>
          </section>

          <aside className="space-y-3 rounded-2xl border border-border bg-panel p-4 text-sm leading-6 text-muted">
            <p className="font-medium text-foreground">Live workflow</p>
            <ol className="list-decimal space-y-1 pl-4 text-xs">
              <li>Connect OAuth/PAT sampai status connected.</li>
              <li>Paste URL Figma file yang mau dibantu.</li>
              <li>Pilih contoh prompt Register/OTP atau tulis sendiri.</li>
              <li>
                Pilih task existing, atau biarkan KarsaDesk membuat task baru
                otomatis.
              </li>
              <li>
                AI membaca metadata/tree Figma dan membuat preview rencana
                perubahan untuk task itu.
              </li>
            </ol>
            <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-xs text-success">
              Canvas preview aktif di KarsaDesk. Figma REST membaca file/tree;
              perubahan canvas tetap memerlukan review dan Figma Plugin bridge
              sebelum bisa diterapkan otomatis.
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => void loadStatus()}
              disabled={!api || busy}
            >
              Refresh status
            </Button>
          </aside>
        </div>
      </main>
    </div>
  );
}
