import { useCallback, useEffect, useState } from "react";
import { useCrosshairStore } from "../stores/useCrosshairStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { formatPrice } from "../utils/formatters";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

interface MenuPosition {
  x: number;
  y: number;
}

export default function ChartContextMenu() {
  const [pos, setPos] = useState<MenuPosition | null>(null);
  const close = useCallback(() => setPos(null), []);

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      // Only handle right-click on chart area (canvas or chart container)
      const target = e.target as HTMLElement;
      if (target.tagName === "CANVAS" || target.closest("[data-chart-area]")) {
        e.preventDefault();
        setPos({ x: e.clientX, y: e.clientY });
        return;
      }
      setPos(null);
    };

    document.addEventListener("contextmenu", onContextMenu);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, []);

  const dispatch = (event: string) => {
    window.dispatchEvent(new CustomEvent(event));
  };

  return (
    <ContextMenu open={Boolean(pos)} onOpenChange={(open) => !open && close()}>
      <ContextMenuContent position={pos} className="min-w-[170px]">
        <ContextMenuItem
          onSelect={() => {
            const { close: closePrice } = useCrosshairStore.getState();
            const { market } = useSettingsStore.getState();
            const text = formatPrice(closePrice, market);
            navigator.clipboard.writeText(text).catch(() => {});
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          가격 복사
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            const state = useSettingsStore.getState();
            state.addPriceAlert(useCrosshairStore.getState().close, "above");
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
          현재가 상향 알림
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            const state = useSettingsStore.getState();
            state.addPriceAlert(useCrosshairStore.getState().close, "below");
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14" />
            <path d="M19 12l-7 7-7-7" />
          </svg>
          현재가 하향 알림
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => dispatch("quanting:chart-fit")}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          차트 초기화
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => dispatch("quanting:chart-screenshot")}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          스크린샷 저장
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => dispatch("quanting:chart-zoom-in")}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          줌 인
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => dispatch("quanting:chart-zoom-out")}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          줌 아웃
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => window.dispatchEvent(new CustomEvent("quanting:show-shortcuts"))}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          단축키 도움말
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
