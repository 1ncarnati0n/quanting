import { useEffect, useMemo, useRef, useState } from "react";
import { useDrawingStore, type DrawingItem, type DrawingTool } from "../stores/useDrawingStore";

const TOOLS: { key: DrawingTool; label: string; icon: string }[] = [
  { key: "none", label: "선택", icon: "↖" },
  { key: "horizontal", label: "수평선", icon: "—" },
  { key: "trend", label: "추세선", icon: "／" },
  { key: "fib", label: "피보", icon: "F" },
  { key: "measure", label: "측정", icon: "⌖" },
  { key: "rectangle", label: "직사각형", icon: "▭" },
  { key: "text", label: "텍스트", icon: "T" },
  { key: "channel", label: "채널", icon: "∥" },
  { key: "pitchfork", label: "피치포크", icon: "P" },
  { key: "gann", label: "갠 팬", icon: "G" },
  { key: "elliott", label: "엘리엇", icon: "E" },
  { key: "harmonic", label: "하모닉", icon: "H" },
];

function drawingTypeLabel(item: DrawingItem): string {
  if (item.type === "horizontal") return `수평선 ${item.price.toFixed(2)}`;
  if (item.type === "trend") return "추세선";
  if (item.type === "fib") return "피보나치";
  if (item.type === "measure") return "측정";
  if (item.type === "rectangle") return "직사각형";
  if (item.type === "text") return `텍스트: ${item.text}`;
  if (item.type === "channel") return "평행채널";
  if (item.type === "pitchfork") return "피치포크";
  if (item.type === "gann") return "갠 팬";
  if (item.type === "elliott") return "엘리엇";
  return "하모닉";
}

export default function DrawingToolbar() {
  const {
    activeTool,
    setActiveTool,
    selectedDrawingId,
    setSelectedDrawing,
    clearDrawings,
    drawings,
    removeDrawing,
    undoLastDrawing,
  } = useDrawingStore();
  const [showList, setShowList] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setShowList(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const recentDrawings = useMemo(() => {
    return [...drawings].slice(-8).reverse();
  }, [drawings]);

  return (
    <div
      ref={menuRef}
      className="pointer-events-auto absolute left-3 top-2 z-10 flex items-center gap-1 rounded-lg px-1 py-0.5"
      style={{
        background: "color-mix(in srgb, var(--bg-primary) 85%, transparent)",
        backdropFilter: "blur(6px)",
        border: "1px solid var(--border-color)",
      }}
    >
      {TOOLS.map((tool) => (
        <button
          key={tool.key}
          type="button"
          className="chart-toolbar-btn"
          title={`${tool.label} 도구`}
          onClick={() => setActiveTool(tool.key)}
          style={{
            background: activeTool === tool.key ? "var(--accent-soft)" : undefined,
            color: activeTool === tool.key ? "var(--accent-primary)" : "var(--text-primary)",
          }}
        >
          <span className="font-bold text-[10px]">{tool.icon}</span>
        </button>
      ))}

      <div className="mx-0.5 h-4 w-px" style={{ background: "var(--border-color)" }} />

      <button
        type="button"
        className="chart-toolbar-btn"
        title="최근 1개 실행취소"
        onClick={undoLastDrawing}
        disabled={drawings.length === 0}
        style={{ opacity: drawings.length === 0 ? 0.45 : 1 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 14 4 9 9 4" />
          <path d="M20 20a8 8 0 0 0-8-8H4" />
        </svg>
      </button>

      <button
        type="button"
        className="chart-toolbar-btn"
        title="선택 드로잉 삭제"
        onClick={() => selectedDrawingId && removeDrawing(selectedDrawingId)}
        disabled={!selectedDrawingId}
        style={{ opacity: selectedDrawingId ? 1 : 0.45 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18" />
          <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>

      <button
        type="button"
        className="chart-toolbar-btn"
        title={`드로잉 목록 (${drawings.length})`}
        onClick={() => setShowList((prev) => !prev)}
        style={{
          color: showList ? "var(--accent-primary)" : "var(--text-primary)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="4" cy="6" r="1" />
          <circle cx="4" cy="12" r="1" />
          <circle cx="4" cy="18" r="1" />
        </svg>
      </button>

      <button
        type="button"
        className="chart-toolbar-btn"
        title="드로잉 전체 삭제"
        onClick={clearDrawings}
        disabled={drawings.length === 0}
        style={{ opacity: drawings.length === 0 ? 0.45 : 1 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      </button>

      {showList && (
        <div className="chart-toolbar-dropdown" style={{ left: 0, minWidth: 220, top: "calc(100% + 4px)" }}>
          <div
            className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            드로잉 {drawings.length}개
          </div>
          {recentDrawings.map((item) => (
            <div
              key={item.id}
              className="chart-toolbar-dropdown-item justify-between gap-2"
              style={{
                background:
                  selectedDrawingId === item.id
                    ? "color-mix(in srgb, var(--accent-primary) 16%, transparent)"
                    : undefined,
              }}
              onClick={() => setSelectedDrawing(item.id)}
            >
              <span
                className="min-w-0 truncate text-[11px]"
                title={drawingTypeLabel(item)}
              >
                {drawingTypeLabel(item)}
              </span>
              <div className="flex items-center gap-1">
                {selectedDrawingId === item.id && (
                  <span className="text-[9px]" style={{ color: "var(--accent-primary)" }}>
                    선택
                  </span>
                )}
                <button
                  type="button"
                  className="rounded px-1 py-0.5 text-[10px]"
                  style={{
                    border: "1px solid var(--border-color)",
                    color: "var(--danger-color)",
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeDrawing(item.id);
                  }}
                  title="개별 삭제"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
          {recentDrawings.length === 0 && (
            <div className="px-2 py-1 text-[10px]" style={{ color: "var(--text-secondary)" }}>
              표시할 드로잉이 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
