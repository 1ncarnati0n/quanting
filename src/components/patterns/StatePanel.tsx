import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type StatePanelVariant = "loading" | "error" | "empty";
type StatePanelSize = "default" | "compact";

interface StatePanelProps {
  variant: StatePanelVariant;
  title: string;
  description?: string;
  className?: string;
  size?: StatePanelSize;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

function LoadingSpinner({ compact }: { compact: boolean }) {
  return (
    <div
      className={cn(
        "rounded-full border-2 border-t-transparent",
        compact ? "h-5 w-5" : "h-8 w-8",
      )}
      style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
      aria-hidden="true"
    />
  );
}

export default function StatePanel({
  variant,
  title,
  description,
  className,
  size = "default",
  actionLabel,
  onAction,
  icon,
}: StatePanelProps) {
  const compact = size === "compact";
  const isError = variant === "error";
  const isLoading = variant === "loading";
  const textTone = isError ? "var(--destructive)" : "var(--foreground)";

  return (
    <div
      className={cn(
        "rounded border border-[var(--border)] bg-[var(--card)] text-center",
        compact ? "px-3 py-3" : "p-6",
        className,
      )}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <div className={cn("flex flex-col items-center", compact ? "gap-1.5" : "gap-3")}>
        {icon ? icon : isLoading ? <LoadingSpinner compact={compact} /> : null}
        <p
          className={cn(compact ? "ds-type-label" : "text-sm", "font-semibold")}
          style={{ color: textTone }}
        >
          {title}
        </p>
        {description ? (
          <p
            className={cn(compact ? "ds-type-caption" : "ds-type-label")}
            style={{ color: "var(--muted-foreground)" }}
          >
            {description}
          </p>
        ) : null}
        {actionLabel && onAction ? (
          <Button
            type="button"
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={onAction}
            className="mt-1"
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
