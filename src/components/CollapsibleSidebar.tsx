import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

interface CollapsibleSidebarProps {
  side: "left" | "right";
  label: string;
  storageKey: string;
  expandedWidth: number;
  resizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function CollapsibleSidebar({
  side,
  label,
  storageKey,
  expandedWidth,
  resizable = false,
  minWidth,
  maxWidth,
  children,
}: CollapsibleSidebarProps) {
  const RESIZER_GUTTER_PX = 6;
  const widthStorageKey = `${storageKey}:width`;
  const widthRange = useMemo(() => {
    const resolvedMin = minWidth ?? Math.max(240, Math.floor(expandedWidth * 0.8));
    const resolvedMax = maxWidth ?? 640;
    return { min: resolvedMin, max: Math.max(resolvedMin, resolvedMax) };
  }, [expandedWidth, maxWidth, minWidth]);

  const clampWidth = (value: number) =>
    Math.min(widthRange.max, Math.max(widthRange.min, value));

  const [width, setWidth] = useState<number>(() => {
    if (!resizable) return expandedWidth;
    try {
      const raw = localStorage.getItem(widthStorageKey);
      if (!raw) return expandedWidth;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return expandedWidth;
      return clampWidth(parsed);
    } catch {
      return expandedWidth;
    }
  });

  useEffect(() => {
    if (!resizable) return;
    try {
      localStorage.setItem(widthStorageKey, String(width));
    } catch {}
  }, [resizable, widthStorageKey, width]);

  useEffect(() => {
    if (!resizable) return;
    setWidth((prev) => clampWidth(prev));
  }, [resizable, widthRange.max, widthRange.min]);

  const startResize = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!resizable) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth =
        side === "right" ? startWidth - delta : startWidth + delta;
      setWidth(clampWidth(nextWidth));
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const resetWidth = () => {
    if (!resizable) return;
    setWidth(clampWidth(expandedWidth));
  };

  return (
    <aside
      className="sidebar-shell relative hidden h-full shrink-0 overflow-hidden xl:flex"
      style={{
        width: resizable ? width : expandedWidth,
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      {resizable && (
        <button
          type="button"
          className="group absolute inset-y-0 z-30 w-3 cursor-col-resize bg-transparent transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_16%,transparent)]"
          style={{ [side === "right" ? "left" : "right"]: 0 } as CSSProperties}
          onMouseDown={startResize}
          onDoubleClick={resetWidth}
          aria-label={`${label} 패널 너비 조절`}
          title={`${label} 패널 너비 조절 (더블클릭: 기본 너비)`}
        >
          <span className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-[var(--border)] opacity-85 transition-colors group-hover:bg-[var(--primary)]" />
        </button>
      )}
      <div
        className="min-w-0 flex-1 overflow-hidden"
        style={{
          paddingRight: resizable && side === "left" ? `${RESIZER_GUTTER_PX}px` : 0,
          paddingLeft: resizable && side === "right" ? `${RESIZER_GUTTER_PX}px` : 0,
        }}
      >
        {children}
      </div>
    </aside>
  );
}
