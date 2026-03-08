import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "../../stores/useSettingsStore";
import type { DashboardDockTab } from "./types";
import DashboardGlobalSettingsPanel from "./DashboardGlobalSettingsPanel";

interface DashboardTopBarProps {
  activeDockTab: DashboardDockTab;
  isDockOpen: boolean;
  onOpenDockTab: (tab: DashboardDockTab) => void;
}

function DockIconButton({
  active = false,
  label,
  badge,
  children,
  onClick,
}: {
  active?: boolean;
  label: string;
  badge?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`dashboard-topbar__icon-button dashboard-topbar__dock-button ${active ? "is-active" : ""}`}
      aria-label={label}
    >
      {children}
      {badge ? <span className="dashboard-topbar__dock-badge">{badge}</span> : null}
      <span className="dashboard-topbar__tooltip" aria-hidden="true">
        {label}
      </span>
    </button>
  );
}

export default function DashboardTopBar({
  activeDockTab,
  isDockOpen,
  onOpenDockTab,
}: DashboardTopBarProps) {
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
  const globalSettingsAnchorRef = useRef<HTMLDivElement | null>(null);
  const globalSettingsSurfaceRef = useRef<HTMLDivElement | null>(null);
  const { indicators, theme, toggleTheme } = useSettingsStore(
    useShallow((state) => ({
      indicators: state.indicators,
      theme: state.theme,
      toggleTheme: state.toggleTheme,
    })),
  );

  const enabledIndicatorCount = useMemo(
    () =>
      Object.values(indicators).reduce((count, item) => {
        if (item && typeof item === "object" && "enabled" in item && item.enabled) {
          return count + 1;
        }
        return count;
      }, 0),
    [indicators],
  );

  useEffect(() => {
    if (!globalSettingsOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (globalSettingsAnchorRef.current?.contains(target)) return;
      if (globalSettingsSurfaceRef.current?.contains(target)) return;
      setGlobalSettingsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setGlobalSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [globalSettingsOpen]);

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar__left">
        <button
          type="button"
          className="dashboard-topbar__brand"
          onClick={() => onOpenDockTab("watchlist")}
        >
          <span className="dashboard-topbar__brand-text">Quanting</span>
        </button>
      </div>

      <div className="dashboard-topbar__center" />

      <div className="dashboard-topbar__right">
        <DockIconButton
          label="관심종목 패널"
          active={isDockOpen && activeDockTab === "watchlist"}
          onClick={() => onOpenDockTab("watchlist")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5z" />
            <path d="M8 8h8" />
            <path d="M8 12h8" />
            <path d="M8 16h5" />
          </svg>
        </DockIconButton>

        <DockIconButton
          label="분석 패널"
          badge={enabledIndicatorCount > 0 ? `${enabledIndicatorCount}` : undefined}
          active={isDockOpen && activeDockTab === "indicators"}
          onClick={() => onOpenDockTab("indicators")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19h16" />
            <path d="M7 16V9" />
            <path d="M12 16V5" />
            <path d="M17 16v-6" />
          </svg>
        </DockIconButton>

        <Button
          variant="ghost"
          size="icon"
          className="dashboard-topbar__icon-button"
          onClick={() => window.dispatchEvent(new CustomEvent("quanting:open-symbol-search"))}
          aria-label="심볼 검색"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="dashboard-topbar__tooltip" aria-hidden="true">
            심볼 검색
          </span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="dashboard-topbar__icon-button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
        >
          {theme === "dark" ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          <span className="dashboard-topbar__tooltip" aria-hidden="true">
            {theme === "dark" ? "라이트 모드" : "다크 모드"}
          </span>
        </Button>

        <div className="dashboard-topbar__menu-anchor" ref={globalSettingsAnchorRef}>
          <Button
            variant="ghost"
            size="icon"
            className={`dashboard-topbar__icon-button ${globalSettingsOpen ? "is-active" : ""}`}
            onClick={() => setGlobalSettingsOpen((current) => !current)}
            aria-label="전역 설정"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .92 1.7 1.7 0 0 1-3.2 0 1.7 1.7 0 0 0-1-.92 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.92-1 1.7 1.7 0 0 1 0-3.2 1.7 1.7 0 0 0 .92-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.92 1.7 1.7 0 0 1 3.2 0 1.7 1.7 0 0 0 1 .92 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.24.39.57.7.96.89a1.7 1.7 0 0 1 0 3.2c-.39.19-.72.5-.96.91Z" />
            </svg>
            <span className="dashboard-topbar__tooltip" aria-hidden="true">
              전역 설정
            </span>
          </Button>
          {globalSettingsOpen ? (
            <DashboardGlobalSettingsPanel
              anchorRef={globalSettingsAnchorRef}
              panelRef={globalSettingsSurfaceRef}
              onClose={() => setGlobalSettingsOpen(false)}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
