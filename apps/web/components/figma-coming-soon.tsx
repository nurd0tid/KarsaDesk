"use client";

import { ExternalLink, LockKeyhole, Palette, PlugZap } from "lucide-react";
import type { Project } from "@vk/contracts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const field =
  "w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none transition placeholder:text-muted/70 disabled:cursor-not-allowed disabled:opacity-60";

export function FigmaComingSoonModal({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(760px,calc(100vw-24px))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="size-5 text-accent" /> Figma Canvas
          </DialogTitle>
          <DialogDescription>
            Coming soon. Authentication and canvas handoff are prepared, but
            design-editing behavior is paused until the exact workflow is clear.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <section className="space-y-4 rounded-2xl border border-border bg-elevated p-4">
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <LockKeyhole className="size-4" /> Coming soon reminder
              </div>
              Nanti area ini bisa connect OAuth, embed canvas/file preview, dan
              mengirim task desain ke session kanban. Untuk sekarang tombolnya
              sengaja disabled supaya tidak pura-pura sudah aman.
            </div>

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
                  Auth status
                </label>
                <input className={field} disabled value="Not connected" readOnly />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Figma file URL
              </label>
              <input
                className={field}
                disabled
                placeholder="https://www.figma.com/file/..."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {["OAuth connect", "Canvas embed", "AI design tasks"].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-border bg-panel p-3 text-xs text-muted"
                >
                  <PlugZap className="mb-2 size-4 text-accent" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-3 rounded-2xl border border-border bg-panel p-4 text-sm leading-6 text-muted">
            <p className="font-medium text-foreground">Prepared contract</p>
            <ul className="list-disc space-y-1 pl-4 text-xs">
              <li>Server-side token storage only.</li>
              <li>No browser-exposed Figma secret.</li>
              <li>Per-project design context.</li>
              <li>Future output goes through review, not auto-publish.</li>
            </ul>
            <Button variant="secondary" size="sm" className="w-full" disabled>
              <ExternalLink className="size-3.5" /> Connect Figma later
            </Button>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
