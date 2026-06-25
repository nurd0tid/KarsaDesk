"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  FileText,
  Figma,
  Loader2,
  Paperclip,
  Presentation,
  Sheet,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import type { AiFileAction, ConnectedFile, Task } from "@vk/contracts";
import type { ApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Payload = { files: ConnectedFile[]; actions: AiFileAction[] };

const field =
  "w-full rounded-lg border border-border bg-panel px-3 py-2 text-xs outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15";

function fileIcon(file: ConnectedFile) {
  if (file.provider === "figma") return Figma;
  if (file.fileType === "sheets") return Sheet;
  if (file.fileType === "slides") return Presentation;
  return FileText;
}

function detectProviderLabel(file: ConnectedFile) {
  return file.provider === "figma"
    ? "Figma"
    : file.fileType === "sheets"
      ? "Google Sheets"
      : file.fileType === "slides"
        ? "Google Slides"
        : "Google Docs";
}

export function ConnectedFilesPanel({
  api,
  task,
}: {
  api: ApiClient | null;
  task: Task;
}) {
  const [files, setFiles] = useState<ConnectedFile[]>([]);
  const [actions, setActions] = useState<AiFileAction[]>([]);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedFileUid, setSelectedFileUid] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedFile = useMemo(
    () =>
      files.find((file) => file.uid === selectedFileUid) || files[0] || null,
    [files, selectedFileUid],
  );

  async function load() {
    if (!api) return;
    try {
      const payload = await api.get<Payload>(
        `/api/tasks/${task.uid}/connected-files`,
      );
      setFiles(payload.files);
      setActions(payload.actions);
      setSelectedFileUid((current) =>
        current && payload.files.some((file) => file.uid === current)
          ? current
          : payload.files[0]?.uid || "",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }

  useEffect(() => {
    void load();
  }, [task.uid, api]);

  async function attach() {
    if (!api || !url.trim()) return;
    setBusy(true);
    try {
      const file = await api.post<ConnectedFile>(
        `/api/tasks/${task.uid}/connected-files`,
        {
          externalFileUrl: url.trim(),
          fileName: name.trim() || undefined,
        },
      );
      setFiles((items) => [file, ...items]);
      setSelectedFileUid(file.uid);
      setUrl("");
      setName("");
      toast.success("File connected to this task");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function detach(file: ConnectedFile) {
    if (!api) return;
    setBusy(true);
    try {
      await api.delete(`/api/connected-files/${file.uid}`);
      setFiles((items) => items.filter((item) => item.uid !== file.uid));
      toast.success("File detached");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function askAi() {
    if (!api || !selectedFile || !prompt.trim()) return;
    setBusy(true);
    try {
      const action = await api.post<AiFileAction>(
        `/api/tasks/${task.uid}/ai-file-actions`,
        {
          connectedFileUid: selectedFile.uid,
          prompt: prompt.trim(),
          actionType: "plan",
        },
      );
      setActions((items) => [action, ...items]);
      setPrompt("");
      toast.success("AI file action recorded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-panel p-3">
      <div>
        <h3 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
          <Paperclip className="size-3.5" /> Connected Files
        </h3>
        <p className="mt-1 text-[11px] leading-4 text-muted">
          Attach file asli Google/Figma. KarsaDesk menyimpan koneksi, metadata,
          tombol open, dan riwayat AI — bukan editor dokumen/desain buatan
          sendiri.
        </p>
      </div>

      <div className="space-y-2">
        <input
          className={field}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Paste Google Docs/Sheets/Slides or Figma URL"
        />
        <input
          className={field}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Optional display name"
        />
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          disabled={!url.trim() || busy}
          onClick={() => void attach()}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Paperclip className="size-3.5" />
          )}
          Attach original file
        </Button>
      </div>

      <div className="space-y-2">
        {!files.length && (
          <div className="rounded-lg border border-dashed border-border p-3 text-[11px] leading-5 text-muted">
            Belum ada file. Untuk MVP, paste URL dulu. OAuth Google Picker dan
            Figma metadata API disiapkan sebagai layer berikutnya.
          </div>
        )}
        {files.map((file) => {
          const Icon = fileIcon(file);
          const selected = selectedFile?.uid === file.uid;
          return (
            <div
              key={file.uid}
              className={cn(
                "rounded-lg border bg-elevated p-3",
                selected ? "border-accent" : "border-border",
              )}
            >
              <button
                className="flex w-full items-start gap-2 text-left"
                onClick={() => setSelectedFileUid(file.uid)}
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-accent" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">
                    {file.fileName}
                  </span>
                  <span className="mt-1 block text-[10px] text-muted">
                    {detectProviderLabel(file)} · {file.status}
                  </span>
                </span>
              </button>
              <div className="mt-2 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(file.externalFileUrl, "_blank")}
                >
                  <ExternalLink className="size-3.5" /> Open
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFileUid(file.uid)}
                >
                  <Wand2 className="size-3.5" /> Ask AI
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void detach(file)}
                  disabled={busy}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-background p-3">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted">
          AI Assistant for selected file
        </label>
        <textarea
          className={`${field} min-h-20 resize-y`}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={
            selectedFile
              ? "Contoh: rapikan jadi bahasa akademik, buat ringkasan, buat slicing plan..."
              : "Attach/select a file first"
          }
        />
        <Button
          size="sm"
          className="mt-2 w-full"
          disabled={!selectedFile || !prompt.trim() || busy}
          onClick={() => void askAi()}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Wand2 className="size-3.5" />
          )}
          Ask AI
        </Button>
      </div>

      {!!actions.length && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            AI action history
          </h4>
          {actions.slice(0, 4).map((action) => (
            <div
              key={action.uid}
              className="rounded-lg border border-border bg-background p-2 text-[11px] leading-4"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-medium">{action.status}</span>
                <span className="text-[10px] text-muted">
                  {new Date(action.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-muted">{action.prompt}</p>
              <pre className="mt-2 whitespace-pre-wrap rounded bg-panel p-2 font-sans text-[10px] text-muted">
                {action.resultSummary}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
