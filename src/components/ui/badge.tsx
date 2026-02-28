import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default:
    "border-transparent bg-[var(--accent-primary)] text-[var(--accent-contrast)]",
  secondary:
    "border-transparent bg-[var(--bg-tertiary)] text-[var(--text-primary)]",
  outline: "border-[var(--border-color)] bg-transparent text-[var(--text-primary)]",
  destructive: "border-transparent bg-[var(--danger-color)] text-white",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
