import type { ReactNode } from "react";
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
  return (
    <div className={cn("border-b border-token", className)}>
      <div
        className={cn(
          "flex justify-between",
          density === "compact" ? "items-start gap-1.5" : "items-center gap-2",
        )}
      >
        <div className="min-w-0">
          <div className={cn("flex items-center", density === "compact" ? "gap-1" : "gap-1.5")}>
            <span className="ds-type-title text-token-foreground font-semibold">
              {title}
            </span>
            {badgeText && (
              <span
                className="ds-type-caption rounded px-1 py-0.5 font-bold"
                style={{
                  background: `color-mix(in srgb, ${badgeColor} 18%, transparent)`,
                  color: badgeColor,
                }}
              >
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p
              className={cn(
                "ds-type-label text-token-muted truncate",
                density === "compact" ? "mt-0" : "mt-0.5",
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
      {children ? <div className={cn(density === "compact" ? "mt-1.5" : "mt-2")}>{children}</div> : null}
    </div>
  );
}
