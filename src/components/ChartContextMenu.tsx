import { useState, useEffect, useCallback, useRef } from "react";
import { useCrosshairStore } from "../stores/useCrosshairStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { formatPrice } from "../utils/formatters";

interface MenuPosition {
  x: number;
  y: number;
}

export default function ChartContextMenu() {
  const [pos, setPos] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setPos(null), []);

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      // Only handle right-click on chart area (canvas or chart container)
      const target = e.target as HTMLElement;
      if (target.tagName === "CANVAS" || target.closest("[data-chart-area]")) {
        e.preventDefault();
        setPos({ x: e.clientX, y: e.clientY });
      }
    };

    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close]);

  if (!pos) return null;

  const dispatch = (event: string) => {
    window.dispatchEvent(new CustomEvent(event));
    close();
  };

  return (
    <div ref={menuRef} className="context-menu" style={{ left: pos.x, top: pos.y }}>
      <button
        type="button"
        className="context-menu-item"
        onClick={() => {
          const { close } = useCrosshairStore.getState();
          const { market } = useSettingsStore.getState();
          const text = formatPrice(close, market);
          navigator.clipboard.writeText(text).catch(() => {});
          setPos(null);
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        가격 복사
      </button>
      <div className="context-menu-separator" />
      <button type="button" className="context-menu-item" onClick={() => dispatch("quanting:chart-fit")}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
        차트 초기화
      </button>
      <button type="button" className="context-menu-item" onClick={() => dispatch("quanting:chart-screenshot")}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        스크린샷 저장
      </button>
      <div className="context-menu-separator" />
      <button type="button" className="context-menu-item" onClick={() => dispatch("quanting:chart-zoom-in")}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        줌 인
      </button>
      <button type="button" className="context-menu-item" onClick={() => dispatch("quanting:chart-zoom-out")}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        줌 아웃
      </button>
      <div className="context-menu-separator" />
      <button
        type="button"
        className="context-menu-item"
        onClick={() => {
          window.dispatchEvent(new CustomEvent("quanting:show-shortcuts"));
          close();
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        단축키 도움말
      </button>
    </div>
  );
}
