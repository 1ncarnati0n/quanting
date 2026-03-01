import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SegmentButtonTone = "primary" | "warning" | "accent";
type SegmentButtonSurface = "secondary" | "card";
type SegmentButtonSize = "sm" | "md";

interface SegmentButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  activeTone?: SegmentButtonTone;
  inactiveSurface?: SegmentButtonSurface;
  size?: SegmentButtonSize;
}

export default function SegmentButton({
  active,
  activeTone = "primary",
  inactiveSurface = "secondary",
  size = "md",
  className,
  children,
  ...props
}: SegmentButtonProps) {
  return (
    <button
      className={cn(
        "rounded border font-semibold transition-colors",
        size === "md" ? "ds-type-label px-2 py-1.5" : "ds-type-caption px-2 py-1",
        active &&
          activeTone === "primary" &&
          "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]",
        active &&
          activeTone === "warning" &&
          "border-[var(--warning)] bg-[var(--warning)] text-[#111827]",
        active &&
          activeTone === "accent" &&
          "border-[var(--primary)] bg-[var(--accent)] text-[var(--primary)]",
        !active &&
          (inactiveSurface === "card"
            ? "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]"
            : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)]"),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
