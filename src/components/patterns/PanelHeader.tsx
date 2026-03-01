import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelHeaderDensity = "comfortable" | "compact";
type PanelHeaderActionAlign = "center" | "start";

interface PanelHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badgeText?: string;
  badgeColor?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  density?: PanelHeaderDensity;
  actionAlign?: PanelHeaderActionAlign;
}

export default function PanelHeader({
  title,
  subtitle,
  badgeText,
  badgeColor = "var(--primary)",
  actions,
  children,
  className,
  density = "comfortable",
  actionAlign = "center",
}: PanelHeaderProps) {
  const badgeStyle = badgeText
    ? ({ "--badge-color": badgeColor } as CSSProperties)
    : undefined;

  return (
    <div className={cn("border-b border-token", className)}>
      <div
        className={cn(
          "flex justify-between",
          density === "compact" ? "items-start gap-2" : "items-center gap-2.5",
        )}
      >
        <div className="min-w-0">
          <div className={cn("flex items-center", density === "compact" ? "gap-1.5" : "gap-2")}>
            <span className="ds-type-title text-token-foreground font-semibold">
              {title}
            </span>
            {badgeText && (
              <span
                className="ds-inline-badge ds-type-caption rounded-[var(--radius-sm)] px-1.5 py-0.5 font-bold"
                style={badgeStyle}
              >
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p
              className={cn(
                "ds-type-label text-token-muted truncate",
                density === "compact" ? "mt-0.5" : "mt-1",
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions ? (
          <div
            className={cn(
              "flex gap-1",
              actionAlign === "start" ? "items-start self-start" : "items-center",
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
      {children ? <div className={cn(density === "compact" ? "mt-2" : "mt-2.5")}>{children}</div> : null}
    </div>
  );
}
