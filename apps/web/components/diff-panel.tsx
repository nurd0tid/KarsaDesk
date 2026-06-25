"use client";

import { useMemo, useState } from "react";
import { Columns2, FileCode2, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DiffData = { diff: string; files: Array<{ path: string; added: number; deleted: number; binary: boolean }>; hash: string; page: number; pageSize: number; totalLines: number; hasMore: boolean; selectedFile: string | null };

function Unified({ diff }: { diff: string }) {
  return <pre className="scrollbar-thin min-w-max p-3 font-mono text-[11px] leading-5">{diff.split("\n").map((line, index) => <div key={index} className={cn("px-2", line.startsWith("+") && !line.startsWith("+++") && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", line.startsWith("-") && !line.startsWith("---") && "bg-rose-500/10 text-rose-700 dark:text-rose-300", line.startsWith("@@") && "bg-blue-500/10 text-blue-600 dark:text-blue-300", (line.startsWith("diff ") || line.startsWith("---") || line.startsWith("+++")) && "font-semibold text-muted")}>{line || " "}</div>)}</pre>;
}

function SideBySide({ diff }: { diff: string }) {
  const rows = useMemo(() => {
    const result: Array<{ left: string; right: string; kind: string }> = [];
    const lines = diff.split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (line.startsWith("-") && !line.startsWith("---")) {
        const next = lines[index + 1];
        if (next?.startsWith("+") && !next.startsWith("+++")) { result.push({ left: line, right: next, kind: "change" }); index += 1; }
        else result.push({ left: line, right: "", kind: "delete" });
      } else if (line.startsWith("+") && !line.startsWith("+++")) result.push({ left: "", right: line, kind: "add" });
      else result.push({ left: line, right: line, kind: "context" });
    }
    return result;
  }, [diff]);
  return <div className="min-w-[900px] font-mono text-[10px] leading-5">{rows.map((row, index) => <div key={index} className="grid grid-cols-2 border-b border-border/40"><pre className={cn("overflow-hidden px-3", ["delete", "change"].includes(row.kind) && "bg-rose-500/10 text-rose-700 dark:text-rose-300")}>{row.left || " "}</pre><pre className={cn("overflow-hidden border-l border-border px-3", ["add", "change"].includes(row.kind) && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300")}>{row.right || " "}</pre></div>)}</div>;
}

export function DiffPanel({ data, onLoadMore }: { data: DiffData; onLoadMore?: () => void }) {
  const [view, setView] = useState<"unified" | "split">("unified");
  const [file, setFile] = useState<string | null>(null);
  const visibleDiff = useMemo(() => {
    if (!file) return data.diff;
    const chunks = data.diff.split(/(?=^diff --git )/m);
    return chunks.find((chunk) => chunk.includes(` b/${file}`)) || data.diff;
  }, [data.diff, file]);
  return <div className="grid h-full min-h-[470px] grid-cols-[210px_minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-elevated max-md:grid-cols-1">
    <aside className="scrollbar-thin border-r border-border bg-panel p-2 max-md:max-h-32 max-md:border-b max-md:border-r-0"><button onClick={() => setFile(null)} className={cn("mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs", !file && "bg-panel-strong")}><Rows3 className="size-3.5" /> All changes <span className="ml-auto text-muted">{data.files.length}</span></button>{data.files.map((item) => <button key={item.path} onClick={() => setFile(item.path)} className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] hover:bg-panel-strong", file === item.path && "bg-panel-strong")}><FileCode2 className="size-3.5 text-muted" /><span className="min-w-0 flex-1 truncate">{item.path}</span><span className="text-emerald-600">+{item.added}</span><span className="text-rose-600">-{item.deleted}</span></button>)}</aside>
    <section className="flex min-w-0 flex-col"><header className="flex h-10 items-center justify-between border-b border-border px-3"><div className="font-mono text-[10px] text-muted">diff {data.hash.slice(0, 10)} · {Math.min(data.page * data.pageSize, data.totalLines)}/{data.totalLines} lines</div><div className="flex gap-1"><Button variant={view === "unified" ? "secondary" : "ghost"} size="sm" onClick={() => setView("unified")}><Rows3 className="size-3.5" /> Unified</Button><Button variant={view === "split" ? "secondary" : "ghost"} size="sm" onClick={() => setView("split")}><Columns2 className="size-3.5" /> Split</Button></div></header><div className="scrollbar-thin flex-1 overflow-auto">{visibleDiff ? <>{view === "unified" ? <Unified diff={visibleDiff} /> : <SideBySide diff={visibleDiff} />}{data.hasMore && <div className="sticky bottom-3 flex justify-center"><Button variant="secondary" size="sm" onClick={onLoadMore}>Load more diff lines</Button></div>}</> : <div className="grid h-full min-h-64 place-items-center text-sm text-muted">No changes yet</div>}</div></section>
  </div>;
}
