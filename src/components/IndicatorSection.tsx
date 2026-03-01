import { useState, type ReactNode } from "react";
import { INDICATOR_GUIDE } from "../utils/indicatorGuide";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface IndicatorSectionProps {
  title: string;
  color: string;
  enabled: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

export default function IndicatorSection({
  title,
  color,
  enabled,
  onToggle,
  children,
}: IndicatorSectionProps) {
  const [open, setOpen] = useState(false);
  const guide = INDICATOR_GUIDE[title];
  const hasContent = !!(children || guide);

  return (
    <div className="mb-2.5 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <div className="flex items-start gap-2.5 px-2.5 py-2">
        <div
          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: color, opacity: enabled ? 1 : 0.45 }}
        />
        <button
          type="button"
          className={cn(
            "min-w-0 flex-1 text-left",
            hasContent ? "cursor-pointer" : "cursor-default",
          )}
          onClick={() => hasContent && setOpen((prev) => !prev)}
          aria-expanded={hasContent ? open : undefined}
        >
          <div className="flex items-center gap-2">
            <span
              className="ds-type-label font-semibold"
              style={{ color: enabled ? "var(--foreground)" : "var(--muted-foreground)" }}
            >
              {title}
            </span>
            <span
              className="ds-type-caption rounded-full border px-1.5 py-0.5 font-semibold leading-none"
              style={{
                color: enabled ? "var(--success)" : "var(--muted-foreground)",
                borderColor: enabled
                  ? "color-mix(in srgb, var(--success) 35%, var(--border))"
                  : "var(--border)",
                background: enabled
                  ? "color-mix(in srgb, var(--success) 14%, var(--card))"
                  : "color-mix(in srgb, var(--muted-foreground) 8%, var(--card))",
              }}
            >
              {enabled ? "활성" : "비활성"}
            </span>
          </div>
          {guide?.summary && (
            <p className="ds-type-caption mt-1 truncate text-[var(--muted-foreground)]">
              {guide.summary}
            </p>
          )}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {hasContent && (
            <button
              type="button"
              className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              onClick={() => setOpen((prev) => !prev)}
              title={open ? "세부 설정 접기" : "세부 설정 펼치기"}
              aria-label={open ? "세부 설정 접기" : "세부 설정 펼치기"}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.15s",
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}
          <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`${title} 지표 토글`} />
        </div>
      </div>

      {hasContent && (
        <div
          style={{
            display: "grid",
            gridTemplateRows: open ? "1fr" : "0fr",
            transition: "grid-template-rows 200ms",
          }}
        >
          <div className="overflow-hidden border-t border-[var(--border)]">
            <div className={cn("space-y-2.5 px-2.5 py-2.5", !enabled && "opacity-60")}>
              {guide && (
                <div
                  className="rounded-[var(--radius-sm)] border p-2.5"
                  style={{
                    borderColor: "color-mix(in srgb, var(--primary) 24%, var(--border))",
                    background: "color-mix(in srgb, var(--secondary) 55%, var(--card))",
                  }}
                >
                  <div className="ds-type-caption mb-1 font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    해석 가이드
                  </div>
                  <p className="ds-type-caption leading-relaxed text-[var(--foreground)]">{guide.summary}</p>
                  <p className="ds-type-caption mt-1 leading-relaxed text-[var(--muted-foreground)]">
                    {guide.tip}
                  </p>
                </div>
              )}
              {children && (
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--muted)] p-2.5">
                  <div className="ds-type-caption mb-2 font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    세부 설정
                  </div>
                  {children}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
