import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "../../stores/useSettingsStore";
import type { DashboardDockTab } from "./types";

interface DashboardTopBarProps {
  activeDockTab: DashboardDockTab;
  onSelectDockTab: (tab: DashboardDockTab) => void;
  onToggleWatchlist: () => void;
  onOpenDisplaySettings: () => void;
}

function NavButton({
  active = false,
  label,
  count,
  onClick,
}: {
  active?: boolean;
  label: string;
  count?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`dashboard-topbar__nav-button ${active ? "is-active" : ""}`}
    >
      <span>{label}</span>
      {count ? <span className="dashboard-topbar__nav-count">{count}</span> : null}
    </button>
  );
}

export default function DashboardTopBar({
  activeDockTab,
  onSelectDockTab,
  onToggleWatchlist,
  onOpenDisplaySettings,
}: DashboardTopBarProps) {
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

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar__left">
        <button type="button" className="dashboard-topbar__brand" onClick={onToggleWatchlist}>
          <span className="dashboard-topbar__brand-text">Quanting</span>
        </button>

        <nav className="dashboard-topbar__nav" aria-label="대시보드 섹션">
          <NavButton label="관심종목" active={activeDockTab === "watchlist"} onClick={onToggleWatchlist} />
          <NavButton
            label="차트 분석"
            count={`${enabledIndicatorCount}`}
            active={activeDockTab === "indicators"}
            onClick={() => onSelectDockTab("indicators")}
          />
          <NavButton
            label="표시 설정"
            active={activeDockTab === "layout"}
            onClick={() => onSelectDockTab("layout")}
          />
        </nav>
      </div>

      <div className="dashboard-topbar__center" />

      <div className="dashboard-topbar__right">
        <Button
          variant="ghost"
          size="icon"
          className="dashboard-topbar__icon-button"
          onClick={() => window.dispatchEvent(new CustomEvent("quanting:open-symbol-search"))}
          aria-label="심볼 검색"
          title="심볼 검색"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="dashboard-topbar__icon-button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
          title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
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
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="dashboard-topbar__icon-button"
          onClick={onOpenDisplaySettings}
          aria-label="표시 설정"
          title="표시 설정"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .92 1.7 1.7 0 0 1-3.2 0 1.7 1.7 0 0 0-1-.92 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.92-1 1.7 1.7 0 0 1 0-3.2 1.7 1.7 0 0 0 .92-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.92 1.7 1.7 0 0 1 3.2 0 1.7 1.7 0 0 0 1 .92 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.24.39.57.7.96.89a1.7 1.7 0 0 1 0 3.2c-.39.19-.72.5-.96.91Z" />
          </svg>
        </Button>

      </div>
    </header>
  );
}
