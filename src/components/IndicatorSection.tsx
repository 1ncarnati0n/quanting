import { useState, type ReactNode } from "react";
import { INDICATOR_GUIDE } from "../utils/indicatorGuide";

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
    <div className="mb-2">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors"
        style={{ background: "var(--secondary)" }}
        onClick={() => setOpen(!open)}
      >
        {/* Color dot */}
        <div
          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{ background: color, opacity: enabled ? 1 : 0.4 }}
        />

        {/* Title */}
        <span
          className="ds-type-label flex-1 font-medium"
          style={{
            color: enabled ? "var(--foreground)" : "var(--muted-foreground)",
          }}
        >
          {title}
        </span>

        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            color: "var(--muted-foreground)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>

        {/* Toggle switch */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="relative ml-1 h-4 w-7 rounded-full transition-colors"
          style={{
            background: enabled ? color : "var(--border)",
          }}
        >
          <div
            className="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform"
            style={{
              transform: enabled ? "translateX(13px)" : "translateX(2px)",
            }}
          />
        </button>
      </div>

      {/* Content — smooth grid-rows animation */}
      {hasContent && (
        <div
          style={{
            display: "grid",
            gridTemplateRows: open ? "1fr" : "0fr",
            transition: "grid-template-rows 200ms",
          }}
        >
          <div className="overflow-hidden">
            <div
              className="mt-1 px-2 pb-1"
              style={{ opacity: enabled ? 1 : 0.5 }}
            >
              {guide && (
                <div
                  className="mb-1.5 rounded-sm border-l-2 py-1 pl-2"
                  style={{ borderColor: color }}
                >
                  <div className="ds-type-caption leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    {guide.summary}
                  </div>
                  <div className="ds-type-caption mt-0.5 leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.8 }}>
                    {guide.tip}
                  </div>
                </div>
              )}
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
