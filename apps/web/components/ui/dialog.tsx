"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, ...props }: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in" />
      <DialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(680px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-border bg-elevated p-5 shadow-2xl focus:outline-none", className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1.5 text-muted hover:bg-panel-strong hover:text-foreground" aria-label="Close"><X className="size-4" /></DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("mb-5 space-y-1", className)} {...props} />; }
export function DialogTitle({ className, ...props }: DialogPrimitive.DialogTitleProps) { return <DialogPrimitive.Title className={cn("text-lg font-semibold tracking-tight", className)} {...props} />; }
export function DialogDescription({ className, ...props }: DialogPrimitive.DialogDescriptionProps) { return <DialogPrimitive.Description className={cn("text-sm text-muted", className)} {...props} />; }
