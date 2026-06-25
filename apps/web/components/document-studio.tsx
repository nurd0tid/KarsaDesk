"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { renderAsync } from "docx-preview";
import {
  BookOpenCheck,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Presentation,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import type { Project, Task } from "@vk/contracts";
import type { ApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type DocumentKind = "word" | "powerpoint" | "spreadsheet";
type Intent =
  | "understand"
  | "references"
  | "generate"
  | "edit"
  | "paper"
  | "slides"
  | "calculate";

type WordSection = { heading: string; body: string };
type SlideDraft = { title: string; bullets: string[]; notes: string };
type SheetDraft = { name: string; rows: string[][] };

type StudioDraft = {
  title: string;
  kind: DocumentKind;
  sourceName: string;
  sourceMode: "prompt" | "file";
  sourcePath?: string;
  sourceBuffer?: ArrayBuffer;
  sections: WordSection[];
  slides: SlideDraft[];
  sheets: SheetDraft[];
};

type LocalDocumentPayload = {
  name: string;
  size: number;
  base64: string;
};

const field =
  "w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15";

const kindMeta = {
  word: {
    label: "Word / Paper",
    icon: FileText,
    accept: ".docx,.md,.txt",
    helper: "Paper, makalah, teori, laporan, tugas kuliah",
  },
  powerpoint: {
    label: "PowerPoint",
    icon: Presentation,
    accept: ".pptx",
    helper: "Slide, speaker notes, struktur presentasi",
  },
  spreadsheet: {
    label: "Excel / Sheet",
    icon: FileSpreadsheet,
    accept: ".xlsx,.csv,.tsv",
    helper: "Tabel, formula, hitungan, template kalkulasi",
  },
} satisfies Record<
  DocumentKind,
  { label: string; icon: typeof FileText; accept: string; helper: string }
>;

const allAcceptedDocuments = ".docx,.pptx,.xlsx,.csv,.tsv,.md,.txt";

function detectKindFromName(name: string): DocumentKind {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pptx")) return "powerpoint";
  if (
    lower.endsWith(".xlsx") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".tsv")
  )
    return "spreadsheet";
  return "word";
}

function fileFromBase64(payload: LocalDocumentPayload) {
  const binary = atob(payload.base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new File([bytes], payload.name);
}

function textFromXml(xml: string, tagNames: string[]) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return tagNames.flatMap((tagName) =>
    Array.from(doc.getElementsByTagName(tagName))
      .map((node) => node.textContent?.trim() || "")
      .filter(Boolean),
  );
}

function paragraphsFromDocxXml(xml: string) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const paragraphs = Array.from(doc.getElementsByTagName("w:p"))
    .map((paragraph) =>
      Array.from(paragraph.getElementsByTagName("w:t"))
        .map((node) => node.textContent || "")
        .join("")
        .trim(),
    )
    .filter(Boolean);
  return paragraphs.length ? paragraphs : textFromXml(xml, ["w:t"]);
}

function splitPrompt(prompt: string) {
  return prompt
    .split(/\r?\n|(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 18);
}

function makeDraft(kind: DocumentKind, prompt: string): StudioDraft {
  const title = prompt.trim().split(/\r?\n/)[0]?.slice(0, 80) || "Untitled";
  const ideas = splitPrompt(prompt);
  if (kind === "powerpoint") {
    const bullets = ideas.length
      ? ideas
      : ["Main goal", "Key points", "Next steps"];
    return {
      title,
      kind,
      sourceMode: "prompt",
      sourceName: "Prompt draft",
      sections: [],
      sheets: [],
      slides: [
        {
          title,
          bullets: bullets.slice(0, 3),
          notes: "Open with the assignment context and why it matters.",
        },
        {
          title: "Problem / background",
          bullets: bullets.slice(3, 6),
          notes: "Explain the context in simple terms.",
        },
        {
          title: "Core explanation",
          bullets: bullets.slice(6, 10),
          notes: "Use practical examples, not only theory.",
        },
        {
          title: "Implementation / example",
          bullets: bullets.slice(10, 14),
          notes: "Show how the idea works in real life.",
        },
        {
          title: "Conclusion",
          bullets: bullets.slice(14, 18).length
            ? bullets.slice(14, 18)
            : ["Summary", "Recommendation", "Q&A"],
          notes: "Close with a clear takeaway.",
        },
      ],
    };
  }
  if (kind === "spreadsheet") {
    const rows = [
      ["Category", "Item", "Value", "Formula / Notes"],
      ["Input", title, "", "Describe what should be calculated"],
      ["Assumption", ideas[0] || "Assumption 1", "", ""],
      ["Result", "Total", "0", "=SUM(C2:C3)"],
    ];
    return {
      title,
      kind,
      sourceMode: "prompt",
      sourceName: "Prompt draft",
      sections: [],
      slides: [],
      sheets: [{ name: "Draft", rows }],
    };
  }
  return {
    title,
    kind,
    sourceMode: "prompt",
    sourceName: "Prompt draft",
    slides: [],
    sheets: [],
    sections: [
      { heading: "Tujuan", body: ideas[0] || prompt },
      {
        heading: "Latar Belakang",
        body:
          ideas.slice(1, 4).join("\n") ||
          "Tuliskan konteks dan alasan topik ini penting.",
      },
      {
        heading: "Pembahasan Teori",
        body:
          ideas.slice(4, 10).join("\n") ||
          "Kembangkan teori dengan bahasa yang mudah dipahami.",
      },
      {
        heading: "Contoh Praktis",
        body:
          ideas.slice(10, 14).join("\n") ||
          "Tambahkan contoh praktik supaya tidak hanya abstrak.",
      },
      {
        heading: "Kesimpulan",
        body:
          ideas.slice(14).join("\n") || "Ringkas poin penting dan next steps.",
      },
    ],
  };
}

async function loadWord(file: File): Promise<StudioDraft> {
  const lower = file.name.toLowerCase();
  let sourceBuffer: ArrayBuffer | undefined;
  let text: string[];
  if (lower.endsWith(".docx")) {
    sourceBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(sourceBuffer);
    const documentXml = await zip.file("word/document.xml")?.async("string");
    text = documentXml ? paragraphsFromDocxXml(documentXml) : [];
  } else {
    text = (await file.text()).split(/\r?\n/).filter(Boolean);
  }
  const sections = text.length
    ? text.map((paragraph, index) => ({
        heading: index === 0 ? "Title / Opening" : `Paragraph ${index + 1}`,
        body: paragraph,
      }))
    : [{ heading: "Empty document", body: "" }];
  return {
    title: file.name.replace(/\.[^.]+$/, ""),
    kind: "word",
    sourceMode: "file",
    sourceName: file.name,
    sourceBuffer,
    sections,
    slides: [],
    sheets: [],
  };
}

async function loadPowerPoint(file: File): Promise<StudioDraft> {
  const zip = await JSZip.loadAsync(file);
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const left = Number(a.match(/slide(\d+)\.xml$/)?.[1] || 0);
      const right = Number(b.match(/slide(\d+)\.xml$/)?.[1] || 0);
      return left - right;
    });
  const slides = await Promise.all(
    slideNames.map(async (name, index) => {
      const xml = await zip.file(name)?.async("string");
      const chunks = xml ? textFromXml(xml, ["a:t"]) : [];
      return {
        title: chunks[0] || `Slide ${index + 1}`,
        bullets: chunks.slice(1, 7),
        notes: chunks.slice(7).join("\n"),
      };
    }),
  );
  return {
    title: file.name.replace(/\.[^.]+$/, ""),
    kind: "powerpoint",
    sourceMode: "file",
    sourceName: file.name,
    sections: [],
    slides: slides.length
      ? slides
      : [{ title: "Empty deck", bullets: [], notes: "" }],
    sheets: [],
  };
}

async function loadSpreadsheet(file: File): Promise<StudioDraft> {
  const lower = file.name.toLowerCase();
  const workbook =
    lower.endsWith(".csv") || lower.endsWith(".tsv")
      ? XLSX.read(await file.text(), { type: "string" })
      : XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheets = workbook.SheetNames.map((name) => {
    const rows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[name], {
      header: 1,
      blankrows: false,
    });
    return {
      name,
      rows: rows
        .slice(0, 50)
        .map((row) =>
          Array.from({ length: Math.max(4, row.length) }, (_, index) =>
            String(row[index] ?? ""),
          ),
        ),
    };
  });
  return {
    title: file.name.replace(/\.[^.]+$/, ""),
    kind: "spreadsheet",
    sourceMode: "file",
    sourceName: file.name,
    sections: [],
    slides: [],
    sheets: sheets.length ? sheets : [{ name: "Sheet1", rows: [[""]] }],
  };
}

async function loadDraftFromFile(file: File) {
  const detected = detectKindFromName(file.name);
  if (detected === "word") return loadWord(file);
  if (detected === "powerpoint") return loadPowerPoint(file);
  return loadSpreadsheet(file);
}

function serializeDraft(draft: StudioDraft) {
  if (draft.kind === "word") {
    return draft.sections
      .map((section) => `## ${section.heading}\n${section.body}`)
      .join("\n\n");
  }
  if (draft.kind === "powerpoint") {
    return draft.slides
      .map(
        (slide, index) =>
          `## Slide ${index + 1}: ${slide.title}\n${slide.bullets.map((bullet) => `- ${bullet}`).join("\n")}\n\nNotes:\n${slide.notes || "-"}`,
      )
      .join("\n\n");
  }
  return draft.sheets
    .map(
      (sheet) =>
        `## ${sheet.name}\n${sheet.rows.map((row) => row.join("\t")).join("\n")}`,
    )
    .join("\n\n");
}

function appendPromptEdit(
  draft: StudioDraft,
  instruction: string,
): StudioDraft {
  if (!instruction.trim()) return draft;
  if (draft.kind === "word") {
    return {
      ...draft,
      sections: [
        ...draft.sections,
        { heading: "AI edit request", body: instruction.trim() },
      ],
    };
  }
  if (draft.kind === "powerpoint") {
    return {
      ...draft,
      slides: [
        ...draft.slides,
        {
          title: "Revision request",
          bullets: instruction
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 6),
          notes: "Use this prompt as the next AI revision instruction.",
        },
      ],
    };
  }
  return {
    ...draft,
    sheets: draft.sheets.map((sheet, index) =>
      index === 0
        ? {
            ...sheet,
            rows: [
              ...sheet.rows,
              ["AI edit request", instruction.trim(), "", ""],
            ],
          }
        : sheet,
    ),
  };
}

export function DocumentStudioModal({
  open,
  onOpenChange,
  api,
  project,
  onTaskCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  api: ApiClient | null;
  project: Project | null;
  onTaskCreated: (task: Task) => void;
}) {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [kind, setKind] = useState<DocumentKind>("word");
  const [prompt, setPrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [draft, setDraft] = useState<StudioDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const meta = kindMeta[kind];
  const Icon = meta.icon;

  const draftText = useMemo(
    () => (draft ? serializeDraft(draft) : ""),
    [draft],
  );

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const next = await loadDraftFromFile(file);
      setKind(next.kind);
      setDraft(next);
      setPrompt(`Improve or continue from ${file.name}`);
      toast.success(`${file.name} loaded into Document Studio`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function openLocalPath() {
    if (!api || !localPath.trim()) {
      toast.error("Paste a local document path first");
      return;
    }
    setBusy(true);
    try {
      const payload = await api.post<LocalDocumentPayload>(
        "/api/documents/read",
        {
          path: localPath.trim(),
        },
      );
      const file = fileFromBase64(payload);
      const next = await loadDraftFromFile(file);
      setKind(next.kind);
      setDraft({ ...next, sourcePath: localPath.trim() });
      setPrompt(`Improve or continue from ${payload.name}`);
      toast.success(`${payload.name} opened from local path`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  function generateFromPrompt() {
    if (prompt.trim().length < 4) {
      toast.error("Write a prompt first");
      return;
    }
    setDraft(makeDraft(kind, prompt));
  }

  function applyEditPrompt() {
    if (!draft) return toast.error("Create or load a draft first");
    setDraft(appendPromptEdit(draft, editPrompt));
    setEditPrompt("");
    toast.success("Edit prompt added to the editable draft");
  }

  async function createAiTask(intent: Intent) {
    if (!api || !project || !draft) {
      toast.error("Select a project and create/load a draft first");
      return;
    }
    const goals: Record<Intent, string> = {
      understand:
        "understand this document first, explain it simply, identify weak/unclear parts, and propose next tasks",
      references:
        "add credible reference ideas, citation placeholders, and sections that need sources; never invent exact sources as verified",
      slides: "turn this into a polished PowerPoint deck",
      paper: "turn this into a clear academic paper/theory draft",
      calculate: "build or fix spreadsheet calculations and explain formulas",
      edit: "edit the current document using the follow-up prompt",
      generate: "generate the requested document",
    };
    const goal = goals[intent];
    setBusy(true);
    try {
      const task = await api.post<Task>(`/api/projects/${project.uid}/tasks`, {
        title: `${meta.label}: ${draft.title}`,
        roughPrompt: prompt || editPrompt || `Work on ${draft.title}`,
        refinedPrompt: `You are helping inside KarsaDesk Document Studio.

Goal: ${goal}
Document kind: ${draft.kind}
Source: ${draft.sourceMode} (${draft.sourceName})

Original prompt:
${prompt || "-"}

Follow-up edit prompt:
${editPrompt || "-"}

Current editable draft:
${draftText}

Return practical, reviewable output. For PPT, give slide-by-slide title, bullets, visual direction, and speaker notes. For Word/paper, produce a structured draft with theory, examples, and citations-to-find placeholders. For Excel, explain sheet structure, formulas, assumptions, and verification checks.`,
        mode: "plan",
        priority: "medium",
        acceptanceCriteria: [
          "Output can be reviewed and edited manually in Document Studio.",
          "The result is beginner-friendly and practical, not only theoretical.",
          "Any citation or data assumption is clearly marked for user verification.",
        ],
        verification: [
          "Review generated content against the source prompt/file.",
          "For spreadsheets, manually check formulas and totals.",
        ],
        dependencyUids: [],
        source: "manual",
      });
      onTaskCreated(task);
      toast.success(`Document task KD-${task.number} created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  function downloadText() {
    if (!draft) return;
    const extension = draft.kind === "spreadsheet" ? "tsv" : "md";
    const blob = new Blob([draftText], {
      type:
        draft.kind === "spreadsheet"
          ? "text/tab-separated-values"
          : "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${draft.title || "document-studio"}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(1180px,calc(100vw-24px))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5 text-accent" /> Document Studio
          </DialogTitle>
          <DialogDescription>
            Start from a prompt or upload Word, PowerPoint, or Excel. Preview
            and edit directly in the browser, then send a precise AI task to the
            kanban flow.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-[650px] gap-4 lg:grid-cols-[310px_1fr]">
          <aside className="space-y-4 rounded-2xl border border-border bg-panel p-4">
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-elevated p-1">
              {(Object.keys(kindMeta) as DocumentKind[]).map((item) => {
                const ItemIcon = kindMeta[item].icon;
                return (
                  <button
                    key={item}
                    onClick={() => setKind(item)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] text-muted transition hover:bg-panel-strong",
                      kind === item && "bg-accent/10 text-accent",
                    )}
                  >
                    <ItemIcon className="size-4" />
                    {kindMeta[item].label.split(" ")[0]}
                  </button>
                );
              })}
            </div>

            <input
              ref={fileInput}
              className="hidden"
              type="file"
              accept={allAcceptedDocuments}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
                event.currentTarget.value = "";
              }}
            />
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Icon className="size-4" />
              )}
              Open Word/PPT/Excel file
            </Button>

            <div className="rounded-xl border border-border bg-elevated p-3">
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Or open local path
              </label>
              <input
                className={`${field} font-mono text-[11px]`}
                value={localPath}
                onChange={(event) => setLocalPath(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void openLocalPath();
                }}
                placeholder="C:\Users\mnur2\Documents\kuliah\file.docx"
              />
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 w-full"
                disabled={busy || !localPath.trim()}
                onClick={() => void openLocalPath()}
              >
                {busy ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FileText className="size-3.5" />
                )}
                Preview local file
              </Button>
              <p className="mt-2 text-[10px] leading-4 text-muted">
                File dibaca oleh local orchestrator di komputer ini. Tidak
                dikirim ke NocoDB.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Prompt awal
              </label>
              <textarea
                className={`${field} min-h-28 resize-y text-xs`}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={
                  kind === "powerpoint"
                    ? "Contoh: buat PPT 10 slide tentang..."
                    : kind === "spreadsheet"
                      ? "Contoh: buat template hitung biaya..."
                      : "Contoh: buat teori paper kuliah tentang..."
                }
              />
              <Button
                variant="secondary"
                className="mt-2 w-full"
                disabled={busy}
                onClick={generateFromPrompt}
              >
                <Sparkles className="size-4" /> Generate draft preview
              </Button>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Edit by prompt
              </label>
              <textarea
                className={`${field} min-h-24 resize-y text-xs`}
                value={editPrompt}
                onChange={(event) => setEditPrompt(event.target.value)}
                placeholder="Contoh: bikin lebih akademis, tambah contoh, hitung total, jadikan 12 slide..."
              />
              <Button
                variant="secondary"
                className="mt-2 w-full"
                disabled={!draft || busy}
                onClick={applyEditPrompt}
              >
                <Wand2 className="size-4" /> Apply to draft
              </Button>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-elevated p-3">
              <p className="text-xs font-medium text-foreground">
                Send document task
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full justify-start"
                disabled={!draft || busy}
                onClick={() => void createAiTask("understand")}
              >
                <BookOpenCheck className="size-3.5" /> Pahami dulu
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="w-full justify-start"
                disabled={!draft || busy}
                onClick={() => void createAiTask("references")}
              >
                <ClipboardList className="size-3.5" /> Tambah referensi
              </Button>
              <Button
                size="sm"
                className="w-full justify-start"
                disabled={!draft || busy}
                onClick={() =>
                  void createAiTask(
                    kind === "powerpoint"
                      ? "slides"
                      : kind === "spreadsheet"
                        ? "calculate"
                        : "paper",
                  )
                }
              >
                <Sparkles className="size-3.5" /> Kerjakan output dokumen
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start"
                disabled={!draft || busy}
                onClick={() => void createAiTask("edit")}
              >
                <Wand2 className="size-3.5" /> Edit/refine by prompt
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start"
                disabled={!draft}
                onClick={downloadText}
              >
                <Download className="size-3.5" /> Export preview text
              </Button>
            </div>
          </aside>

          <section className="min-h-0 rounded-2xl border border-border bg-elevated p-4">
            {!draft ? (
              <div className="grid h-full place-items-center text-center">
                <div className="max-w-md">
                  <Icon className="mx-auto mb-4 size-12 text-accent" />
                  <h3 className="text-lg font-semibold">
                    Start with prompt or file
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Cocok buat kamu yang kuat di praktik tapi butuh bantuan
                    menyusun paper, slide, atau hitungan spreadsheet. Draft-nya
                    akan muncul di sini dan bisa diedit langsung.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-0 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2 text-xs">
                  <Icon className="size-4 text-accent" />
                  <span className="font-medium text-foreground">
                    {draft.sourceName}
                  </span>
                  <span className="rounded bg-panel-strong px-2 py-1 capitalize text-muted">
                    {draft.kind}
                  </span>
                  <span className="rounded bg-panel-strong px-2 py-1 text-muted">
                    {draft.sourceMode === "file"
                      ? "Opened from file"
                      : "Generated from prompt"}
                  </span>
                  {draft.sourcePath && (
                    <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted">
                      {draft.sourcePath}
                    </span>
                  )}
                </div>
                <div className="min-h-0 flex-1">
                  {draft.kind === "word" ? (
                    <WordPreview draft={draft} onChange={setDraft} />
                  ) : draft.kind === "powerpoint" ? (
                    <InteractivePowerPointPreview
                      draft={draft}
                      onChange={setDraft}
                    />
                  ) : (
                    <InteractiveSpreadsheetPreview
                      draft={draft}
                      onChange={setDraft}
                    />
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WordPreview({
  draft,
  onChange,
}: {
  draft: StudioDraft;
  onChange: (draft: StudioDraft) => void;
}) {
  const renderHostRef = useRef<HTMLDivElement | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    const host = renderHostRef.current;
    if (!host || !draft.sourceBuffer) return;
    host.replaceChildren();
    setRenderError(null);
    void renderAsync(draft.sourceBuffer.slice(0), host, host, {
      breakPages: true,
      className: "vk-docx-page",
      experimental: true,
      ignoreLastRenderedPageBreak: false,
      inWrapper: true,
      renderChanges: true,
      renderComments: true,
      renderFooters: true,
      renderFootnotes: true,
      renderHeaders: true,
    }).catch((error) => {
      setRenderError(error instanceof Error ? error.message : String(error));
    });
  }, [draft.sourceBuffer]);

  return (
    <div className="scrollbar-thin h-full overflow-auto pr-2">
      {draft.sourceBuffer && (
        <section className="mb-5 rounded-[22px] border border-border bg-panel p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Rendered Word preview</h3>
              <p className="text-xs text-muted">
                Tampilan ini mencoba mengikuti bentuk DOCX asli. Editor teks di
                bawahnya dipakai untuk task AI dan revisi cepat.
              </p>
            </div>
          </div>
          {renderError ? (
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
              Word renderer fallback: {renderError}
            </div>
          ) : (
            <div
              ref={renderHostRef}
              className="max-h-[560px] overflow-auto rounded-xl bg-white p-4 text-black"
            />
          )}
        </section>
      )}
      <div className="mx-auto max-w-[820px] space-y-5 rounded-[22px] border border-border bg-background px-10 py-8 shadow-sm">
        <input
          className="w-full border-0 bg-transparent text-center text-3xl font-semibold outline-none"
          value={draft.title}
          onChange={(event) =>
            onChange({ ...draft, title: event.target.value })
          }
        />
        {draft.sections.map((section, index) => (
          <article
            key={index}
            className="group rounded-xl border border-transparent p-2 hover:border-border hover:bg-panel/60"
          >
            <input
              className="mb-2 w-full border-0 bg-transparent text-base font-semibold outline-none"
              value={section.heading}
              onChange={(event) =>
                onChange({
                  ...draft,
                  sections: draft.sections.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, heading: event.target.value }
                      : item,
                  ),
                })
              }
            />
            <textarea
              className="min-h-28 w-full resize-y rounded-lg border border-transparent bg-transparent p-2 text-sm leading-7 outline-none focus:border-border focus:bg-panel"
              value={section.body}
              onChange={(event) =>
                onChange({
                  ...draft,
                  sections: draft.sections.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, body: event.target.value }
                      : item,
                  ),
                })
              }
            />
          </article>
        ))}
        <Button
          variant="secondary"
          onClick={() =>
            onChange({
              ...draft,
              sections: [
                ...draft.sections,
                { heading: "New section", body: "" },
              ],
            })
          }
        >
          Add section
        </Button>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PowerPointPreview({
  draft,
  onChange,
}: {
  draft: StudioDraft;
  onChange: (draft: StudioDraft) => void;
}) {
  return (
    <div className="scrollbar-thin grid h-full gap-4 overflow-auto pr-2 md:grid-cols-2">
      {draft.slides.map((slide, index) => (
        <article
          key={index}
          className="aspect-video rounded-2xl border border-border bg-background p-5 shadow-sm"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded bg-accent/10 px-2 py-1 font-mono text-[10px] text-accent">
              {index + 1}
            </span>
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-lg font-semibold outline-none"
              value={slide.title}
              onChange={(event) =>
                onChange({
                  ...draft,
                  slides: draft.slides.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, title: event.target.value }
                      : item,
                  ),
                })
              }
            />
          </div>
          <textarea
            className={`${field} min-h-24 resize-none text-xs`}
            value={slide.bullets.join("\n")}
            onChange={(event) =>
              onChange({
                ...draft,
                slides: draft.slides.map((item, itemIndex) =>
                  itemIndex === index
                    ? {
                        ...item,
                        bullets: event.target.value
                          .split(/\r?\n/)
                          .map((line) => line.replace(/^[-•]\s*/, "").trim())
                          .filter(Boolean),
                      }
                    : item,
                ),
              })
            }
          />
          <textarea
            className={`${field} mt-3 min-h-16 resize-none text-[11px]`}
            value={slide.notes}
            placeholder="Speaker notes / visual direction"
            onChange={(event) =>
              onChange({
                ...draft,
                slides: draft.slides.map((item, itemIndex) =>
                  itemIndex === index
                    ? { ...item, notes: event.target.value }
                    : item,
                ),
              })
            }
          />
        </article>
      ))}
      <button
        className="grid aspect-video place-items-center rounded-2xl border border-dashed border-border text-sm text-muted hover:border-accent hover:text-accent"
        onClick={() =>
          onChange({
            ...draft,
            slides: [
              ...draft.slides,
              { title: "New slide", bullets: [], notes: "" },
            ],
          })
        }
      >
        Add slide
      </button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SpreadsheetPreview({
  draft,
  onChange,
}: {
  draft: StudioDraft;
  onChange: (draft: StudioDraft) => void;
}) {
  const [sheetIndex, setSheetIndex] = useState(0);
  const activeSheetIndex = Math.min(
    sheetIndex,
    Math.max(0, draft.sheets.length - 1),
  );
  const sheet = draft.sheets[activeSheetIndex] || {
    name: "Sheet1",
    rows: [[""]],
  };
  const columnCount = Math.max(4, ...sheet.rows.map((row) => row.length));
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {draft.sheets.map((item, index) => (
          <button
            key={`${item.name}-${index}`}
            onClick={() => setSheetIndex(index)}
            className={cn(
              "rounded-lg border border-border px-3 py-2 text-xs text-muted hover:bg-panel",
              activeSheetIndex === index &&
                "border-accent bg-accent/10 text-accent",
            )}
          >
            {item.name || `Sheet ${index + 1}`}
          </button>
        ))}
        <input
          className="rounded-lg border border-border bg-panel px-3 py-2 text-sm font-semibold outline-none"
          value={sheet.name}
          onChange={(event) =>
            onChange({
              ...draft,
              sheets: draft.sheets.map((item, index) =>
                index === activeSheetIndex
                  ? { ...item, name: event.target.value }
                  : item,
              ),
            })
          }
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            onChange({
              ...draft,
              sheets: draft.sheets.map((item, index) =>
                index === activeSheetIndex
                  ? {
                      ...sheet,
                      rows: [
                        ...sheet.rows,
                        Array.from({ length: columnCount }, () => ""),
                      ],
                    }
                  : item,
              ),
            })
          }
        >
          Add row
        </Button>
      </div>
      <div className="scrollbar-thin min-h-0 overflow-auto rounded-xl border border-border">
        <table className="min-w-full border-collapse text-xs">
          <tbody>
            {sheet.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columnCount }, (_, columnIndex) => (
                  <td
                    key={columnIndex}
                    className="border border-border bg-panel p-0"
                  >
                    <input
                      className={cn(
                        "h-9 min-w-32 border-0 bg-transparent px-2 outline-none focus:bg-elevated",
                        rowIndex === 0 && "font-semibold text-accent",
                      )}
                      value={row[columnIndex] || ""}
                      onChange={(event) =>
                        onChange({
                          ...draft,
                          sheets: draft.sheets.map((item, sheetIndex) => {
                            if (sheetIndex !== activeSheetIndex) return item;
                            return {
                              ...item,
                              rows: item.rows.map(
                                (currentRow, currentRowIndex) => {
                                  if (currentRowIndex !== rowIndex)
                                    return currentRow;
                                  const next = [...currentRow];
                                  next[columnIndex] = event.target.value;
                                  return next;
                                },
                              ),
                            };
                          }),
                        })
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function columnName(index: number) {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const modulo = (value - 1) % 26;
    name = String.fromCharCode(65 + modulo) + name;
    value = Math.floor((value - modulo) / 26);
  }
  return name;
}

function InteractivePowerPointPreview({
  draft,
  onChange,
}: {
  draft: StudioDraft;
  onChange: (draft: StudioDraft) => void;
}) {
  const [selected, setSelected] = useState(0);
  const selectedIndex = Math.min(
    selected,
    Math.max(0, draft.slides.length - 1),
  );
  const slide = draft.slides[selectedIndex] || {
    title: "New slide",
    bullets: [],
    notes: "",
  };

  function updateSlide(values: Partial<SlideDraft>) {
    onChange({
      ...draft,
      slides: draft.slides.map((item, index) =>
        index === selectedIndex ? { ...item, ...values } : item,
      ),
    });
  }

  function addSlide() {
    onChange({
      ...draft,
      slides: [
        ...draft.slides,
        { title: "New slide", bullets: ["Key point"], notes: "" },
      ],
    });
    setSelected(draft.slides.length);
  }

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[180px_1fr]">
      <aside className="scrollbar-thin min-h-0 space-y-2 overflow-auto rounded-xl border border-border bg-panel p-2">
        {draft.slides.map((item, index) => (
          <button
            key={index}
            onClick={() => setSelected(index)}
            className={cn(
              "w-full rounded-xl border p-2 text-left transition",
              selectedIndex === index
                ? "border-accent bg-accent/10"
                : "border-border bg-elevated hover:border-accent/50",
            )}
          >
            <div className="aspect-video rounded-lg bg-background p-2 shadow-sm">
              <p className="line-clamp-2 text-[10px] font-semibold">
                {item.title}
              </p>
              <div className="mt-2 space-y-1">
                {item.bullets.slice(0, 3).map((bullet, bulletIndex) => (
                  <div
                    key={bulletIndex}
                    className="h-1 rounded bg-accent/40"
                    style={{
                      width: `${Math.max(28, Math.min(92, bullet.length * 5))}%`,
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="mt-1 font-mono text-[10px] text-muted">
              Slide {index + 1}
            </p>
          </button>
        ))}
        <button
          className="grid w-full place-items-center rounded-xl border border-dashed border-border px-3 py-4 text-xs text-muted hover:border-accent hover:text-accent"
          onClick={addSlide}
        >
          Add slide
        </button>
      </aside>

      <section className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2 text-xs">
          <span className="rounded bg-accent/10 px-2 py-1 font-mono text-accent">
            Slide {selectedIndex + 1} / {draft.slides.length}
          </span>
          <span className="text-muted">PowerPoint-like editor</span>
        </div>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-auto rounded-2xl border border-border bg-panel-strong p-4">
          <article className="mx-auto aspect-video max-h-[520px] max-w-[920px] rounded-[26px] border border-border bg-background p-10 shadow-xl">
            <input
              className="w-full border-0 bg-transparent text-3xl font-bold tracking-tight outline-none"
              value={slide.title}
              onChange={(event) => updateSlide({ title: event.target.value })}
            />
            <textarea
              className="mt-8 h-[48%] w-full resize-none border-0 bg-transparent text-xl leading-9 outline-none"
              value={slide.bullets.map((bullet) => `• ${bullet}`).join("\n")}
              onChange={(event) =>
                updateSlide({
                  bullets: event.target.value
                    .split(/\r?\n/)
                    .map((line) => line.replace(/^[-•]\s*/, "").trim())
                    .filter(Boolean),
                })
              }
              placeholder="• Key point"
            />
            <div className="mt-auto flex justify-end text-[11px] text-muted">
              KarsaDesk slide canvas
            </div>
          </article>
        </div>

        <div className="rounded-xl border border-border bg-panel p-3">
          <label className="mb-1.5 block text-xs font-medium text-muted">
            Speaker notes / visual direction
          </label>
          <textarea
            className={`${field} min-h-20 resize-y text-xs`}
            value={slide.notes}
            onChange={(event) => updateSlide({ notes: event.target.value })}
            placeholder="Catatan pembicara, ide visual, chart/gambar yang perlu dibuat..."
          />
        </div>
      </section>
    </div>
  );
}

function InteractiveSpreadsheetPreview({
  draft,
  onChange,
}: {
  draft: StudioDraft;
  onChange: (draft: StudioDraft) => void;
}) {
  const [sheetIndex, setSheetIndex] = useState(0);
  const [selectedCell, setSelectedCell] = useState({ row: 0, column: 0 });
  const activeSheetIndex = Math.min(
    sheetIndex,
    Math.max(0, draft.sheets.length - 1),
  );
  const sheet = draft.sheets[activeSheetIndex] || {
    name: "Sheet1",
    rows: [[""]],
  };
  const columnCount = Math.max(4, ...sheet.rows.map((row) => row.length));
  const selectedValue =
    sheet.rows[selectedCell.row]?.[selectedCell.column] || "";

  function updateCell(rowIndex: number, columnIndex: number, value: string) {
    onChange({
      ...draft,
      sheets: draft.sheets.map((item, currentSheetIndex) => {
        if (currentSheetIndex !== activeSheetIndex) return item;
        return {
          ...item,
          rows: item.rows.map((currentRow, currentRowIndex) => {
            if (currentRowIndex !== rowIndex) return currentRow;
            const next = Array.from(
              { length: Math.max(columnCount, columnIndex + 1) },
              (_, index) => currentRow[index] || "",
            );
            next[columnIndex] = value;
            return next;
          }),
        };
      }),
    });
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {draft.sheets.map((item, index) => (
          <button
            key={`${item.name}-${index}`}
            onClick={() => setSheetIndex(index)}
            className={cn(
              "rounded-lg border border-border px-3 py-2 text-xs text-muted hover:bg-panel",
              activeSheetIndex === index &&
                "border-accent bg-accent/10 text-accent",
            )}
          >
            {item.name || `Sheet ${index + 1}`}
          </button>
        ))}
        <input
          className="rounded-lg border border-border bg-panel px-3 py-2 text-sm font-semibold outline-none"
          value={sheet.name}
          onChange={(event) =>
            onChange({
              ...draft,
              sheets: draft.sheets.map((item, index) =>
                index === activeSheetIndex
                  ? { ...item, name: event.target.value }
                  : item,
              ),
            })
          }
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            onChange({
              ...draft,
              sheets: draft.sheets.map((item, index) =>
                index === activeSheetIndex
                  ? {
                      ...sheet,
                      rows: [
                        ...sheet.rows,
                        Array.from({ length: columnCount }, () => ""),
                      ],
                    }
                  : item,
              ),
            })
          }
        >
          Add row
        </Button>
      </div>

      <div className="grid grid-cols-[80px_1fr] gap-2 rounded-xl border border-border bg-panel p-2">
        <div className="rounded-lg bg-panel-strong px-3 py-2 font-mono text-xs text-muted">
          {columnName(selectedCell.column)}
          {selectedCell.row + 1}
        </div>
        <input
          className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-accent"
          value={selectedValue}
          onChange={(event) =>
            updateCell(
              selectedCell.row,
              selectedCell.column,
              event.target.value,
            )
          }
          placeholder="Formula / value"
        />
      </div>

      <div className="scrollbar-thin min-h-0 overflow-auto rounded-xl border border-border">
        <table className="min-w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="sticky left-0 z-20 h-8 min-w-12 border border-border bg-panel-strong" />
              {Array.from({ length: columnCount }, (_, columnIndex) => (
                <th
                  key={columnIndex}
                  className="h-8 min-w-32 border border-border bg-panel-strong px-2 font-mono text-[10px] text-muted"
                >
                  {columnName(columnIndex)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th className="sticky left-0 z-10 h-9 border border-border bg-panel-strong px-2 font-mono text-[10px] text-muted">
                  {rowIndex + 1}
                </th>
                {Array.from({ length: columnCount }, (_, columnIndex) => (
                  <td
                    key={columnIndex}
                    className="border border-border bg-panel p-0"
                  >
                    <input
                      className={cn(
                        "h-9 min-w-32 border-0 bg-transparent px-2 outline-none focus:bg-elevated",
                        rowIndex === 0 && "font-semibold text-accent",
                        selectedCell.row === rowIndex &&
                          selectedCell.column === columnIndex &&
                          "ring-2 ring-inset ring-accent",
                      )}
                      value={row[columnIndex] || ""}
                      onFocus={() =>
                        setSelectedCell({ row: rowIndex, column: columnIndex })
                      }
                      onChange={(event) =>
                        updateCell(rowIndex, columnIndex, event.target.value)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
