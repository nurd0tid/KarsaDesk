"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Project } from "@vk/contracts";
import type { ApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { cn } from "@/lib/utils";

type WorkspaceFile = {
  externalFileId: string;
  externalFileUrl?: string;
  fileType: "docs" | "sheets" | "slides" | "figma";
  fileName: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
};

type RunEvent = {
  id: string;
  label: string;
  detail: string;
  status: "pending" | "running" | "done" | "error";
};

type ChatResponse = {
  message: string;
  error: string | null;
  fallback: boolean;
  contextLoaded: boolean;
  contextCharacters: number;
};

const field =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15";

export function WorkspaceAiPanel({
  api,
  project,
  workspace,
  file,
  providerId,
  modelId,
  suggestions = [],
  onCreateTask,
}: {
  api: ApiClient | null;
  project: Project | null;
  workspace: "google" | "figma";
  file: WorkspaceFile | null;
  providerId: string;
  modelId: string;
  suggestions?: Array<{ label: string; value: string }>;
  onCreateTask: (prompt: string, answer: string) => Promise<void>;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([]);
    setEvents([]);
    setInput("");
    setLastPrompt("");
  }, [file?.externalFileId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, events]);

  useEffect(() => {
    if (!startedAt || !busy) return;
    const timer = window.setInterval(
      () => setElapsed(Date.now() - startedAt),
      500,
    );
    return () => window.clearInterval(timer);
  }, [busy, startedAt]);

  async function send(value = input) {
    const prompt = value.trim();
    if (!api || !project || !file || !prompt || busy) return;
    if (!providerId || !modelId) {
      toast.error("Pilih provider dan model AI di header workspace.");
      return;
    }
    const now = Date.now();
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    };
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((items) => [...items, userMessage]);
    setLastPrompt(prompt);
    setInput("");
    setBusy(true);
    setStartedAt(now);
    setElapsed(0);
    setEvents([
      {
        id: "context",
        label: "Reading provider context",
        detail: `${file.fileName} · ${file.fileType}`,
        status: "running",
      },
      {
        id: "provider",
        label: "Calling selected AI",
        detail: `${providerId} / ${modelId}`,
        status: "pending",
      },
      {
        id: "answer",
        label: "Preparing answer",
        detail: "No task or external-file change will be created",
        status: "pending",
      },
    ]);
    try {
      const result = await api.post<ChatResponse>(
        `/api/projects/${project.uid}/workspace-chat`,
        {
          workspace,
          externalFileId: file.externalFileId,
          externalFileUrl: file.externalFileUrl,
          fileType: file.fileType,
          fileName: file.fileName,
          message: prompt,
          providerId,
          modelId,
          history,
        },
      );
      setEvents([
        {
          id: "context",
          label: result.contextLoaded
            ? "Provider context loaded"
            : "Provider context failed",
          detail: result.contextLoaded
            ? `${result.contextCharacters.toLocaleString()} characters read locally`
            : "The selected file could not be read",
          status: result.contextLoaded ? "done" : "error",
        },
        {
          id: "provider",
          label: result.error ? "AI provider failed" : "AI response received",
          detail: result.error || `${providerId} / ${modelId}`,
          status: result.error ? "error" : "done",
        },
        {
          id: "answer",
          label: result.error ? "Action required" : "Answer ready",
          detail: result.error
            ? "Change provider/model or fix its API key/billing, then retry"
            : "Conversation only · no task created",
          status: result.error ? "error" : "done",
        },
      ]);
      setMessages((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.message,
          error: Boolean(result.error),
        },
      ]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setEvents((items) =>
        items.map((item) => ({
          ...item,
          status: item.id === "context" ? item.status : "error",
          detail: item.id === "provider" ? detail : item.detail,
        })),
      );
      setMessages((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Request gagal: ${detail}`,
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
      setStartedAt(null);
    }
  }

  const lastAnswer = [...messages]
    .reverse()
    .find((message) => message.role === "assistant" && !message.error);
  const seconds = Math.floor(elapsed / 1000);

  return (
    <aside className="flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-panel">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold">
            <MessageSquare className="size-3.5 text-accent" /> AI conversation
          </p>
          <p className="mt-0.5 truncate text-[10px] text-muted">
            {file?.fileName || "Select a file/canvas first"}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          disabled={!messages.length || busy}
          onClick={() => {
            setMessages([]);
            setEvents([]);
            setLastPrompt("");
          }}
          title="Clear conversation"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto p-3"
      >
        {!messages.length && (
          <div className="rounded-xl border border-dashed border-border p-4 text-xs leading-5 text-muted">
            <Bot className="mb-2 size-5 text-accent" />
            <p className="font-medium text-foreground">
              Tanya dulu, tanpa task.
            </p>
            <p className="mt-1">
              Contoh: “File ini tentang apa?”, “Flow login ini sudah punya state
              apa saja?”, atau “Kalau ditambah OTP, frame apa yang dibutuhkan?”
            </p>
          </div>
        )}

        {messages.map((message) => (
          <article
            key={message.id}
            className={cn(
              "rounded-xl border p-3 text-xs",
              message.role === "user"
                ? "ml-6 border-accent/30 bg-accent/10"
                : message.error
                  ? "mr-3 border-danger/30 bg-danger/5"
                  : "mr-3 border-border bg-elevated",
            )}
          >
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              {message.role === "user" ? (
                "You"
              ) : message.error ? (
                <>
                  <AlertTriangle className="size-3 text-danger" /> Provider
                  error
                </>
              ) : (
                <>
                  <Bot className="size-3 text-accent" /> KarsaDesk AI
                </>
              )}
            </p>
            {message.role === "assistant" ? (
              <MarkdownViewer dense className="border-0 bg-transparent p-0">
                {message.content}
              </MarkdownViewer>
            ) : (
              <p className="whitespace-pre-wrap leading-5">{message.content}</p>
            )}
          </article>
        ))}

        {!!events.length && (
          <section className="overflow-hidden rounded-xl border border-border bg-[#080b10] text-slate-300">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[10px]">
              <span className="font-semibold text-slate-100">Run details</span>
              <span className="font-mono text-slate-500">
                {busy ? `${seconds}s · running` : `${seconds}s · finished`}
              </span>
            </div>
            <div className="space-y-1 p-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="grid grid-cols-[16px_minmax(0,1fr)] gap-2 rounded-lg px-2 py-1.5 text-[10px]"
                >
                  {event.status === "running" ? (
                    <Loader2 className="mt-0.5 size-3 animate-spin text-accent" />
                  ) : event.status === "done" ? (
                    <CheckCircle2 className="mt-0.5 size-3 text-success" />
                  ) : event.status === "error" ? (
                    <AlertTriangle className="mt-0.5 size-3 text-danger" />
                  ) : (
                    <Clock3 className="mt-0.5 size-3 text-slate-600" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-slate-200">{event.label}</p>
                    <p className="break-words text-slate-500">{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {lastAnswer && lastPrompt && (
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={() => void onCreateTask(lastPrompt, lastAnswer.content)}
          >
            <Plus className="size-3.5" /> Create task from this answer
          </Button>
        )}
      </div>

      <div className="space-y-2 border-t border-border p-3">
        {!!suggestions.length && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((item) => (
              <button
                key={item.label}
                type="button"
                className="rounded-full border border-border bg-elevated px-2.5 py-1 text-[10px] text-muted transition hover:border-accent hover:text-accent"
                onClick={() => setInput(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
        <textarea
          className={`${field} min-h-28 resize-y text-xs`}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              void send();
            }
          }}
          disabled={!file || busy}
          placeholder={
            file
              ? "Tanya isi file/canvas atau diskusikan perubahan… Ctrl+Enter untuk kirim"
              : "Pilih file/canvas terlebih dahulu"
          }
        />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button
            disabled={!file || !input.trim() || !providerId || !modelId || busy}
            onClick={() => void send()}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {busy ? "Working…" : "Ask AI"}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            disabled={!lastPrompt || busy}
            onClick={() => void send(lastPrompt)}
            title="Retry last prompt"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
        <p className="text-[10px] leading-4 text-muted">
          Ask AI tidak membuat task dan tidak mengubah file. Task hanya dibuat
          setelah Anda menekan tombol Create task.
        </p>
      </div>
    </aside>
  );
}
