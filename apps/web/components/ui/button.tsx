import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45", {
  variants: {
    variant: {
      default: "bg-accent text-accent-foreground shadow-sm hover:bg-accent-strong",
      secondary: "border border-border bg-panel text-foreground hover:bg-panel-strong",
      ghost: "text-muted hover:bg-panel-strong hover:text-foreground",
      danger: "bg-danger text-white hover:brightness-110",
    },
    size: { default: "h-9 px-3.5", sm: "h-8 rounded-md px-2.5 text-xs", icon: "size-9 p-0" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
