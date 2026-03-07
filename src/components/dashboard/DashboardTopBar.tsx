import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "../../stores/useSettingsStore";
import type { DashboardDockTab } from "./types";

interface DashboardTopBarProps {
  activeDockTab: DashboardDockTab;
  onSelectDockTab: (tab: DashboardDockTab) => void;
  onToggleWatchlist: () => void;
  onToggleDock: () => void;
  onOpenAlerts: () => void;
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
  onToggleDock,
  onOpenAlerts,
  onOpenDisplaySettings,
}: DashboardTopBarProps) {
  const { indicators, priceAlerts, symbol, market } = useSettingsStore(
    useShallow((state) => ({
      indicators: state.indicators,
      priceAlerts: state.priceAlerts,
      symbol: state.symbol,
      market: state.market,
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
  const activeAlertCount = useMemo(
    () => priceAlerts.filter((alert) => alert.active && alert.symbol === symbol && alert.market === market).length,
    [market, priceAlerts, symbol],
  );

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar__left">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleWatchlist}
          className="dashboard-topbar__icon-button xl:hidden"
          aria-label="관심종목 패널 열기"
          title="관심종목 패널"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
          </svg>
        </Button>

        <button type="button" className="dashboard-topbar__brand" onClick={onToggleWatchlist}>
          <span className="dashboard-topbar__brand-text">Quanting</span>
        </button>

        <nav className="dashboard-topbar__nav" aria-label="대시보드 섹션">
          <NavButton label="실시간" active />
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
          onClick={onOpenAlerts}
          aria-label="가격 알림"
          title="가격 알림"
        >
          <span className="dashboard-topbar__icon-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.27 21a2 2 0 0 0 3.46 0" />
              <path d="M3.26 15a1 1 0 0 0 .92 1.5h15.64a1 1 0 0 0 .92-1.5L18 11.59V9a6 6 0 0 0-12 0v2.59L3.26 15Z" />
            </svg>
            {activeAlertCount > 0 ? <span className="dashboard-topbar__icon-dot" /> : null}
          </span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="dashboard-topbar__icon-button hidden xl:inline-flex"
          onClick={onOpenDisplaySettings}
          aria-label="표시 설정"
          title="표시 설정"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .92 1.7 1.7 0 0 1-3.2 0 1.7 1.7 0 0 0-1-.92 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.92-1 1.7 1.7 0 0 1 0-3.2 1.7 1.7 0 0 0 .92-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.92 1.7 1.7 0 0 1 3.2 0 1.7 1.7 0 0 0 1 .92 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.24.39.57.7.96.89a1.7 1.7 0 0 1 0 3.2c-.39.19-.72.5-.96.91Z" />
          </svg>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="dashboard-topbar__icon-button xl:hidden"
          onClick={onToggleDock}
          aria-label="우측 패널 열기"
          title="우측 패널"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M15 4v16" />
          </svg>
        </Button>
      </div>
    </header>
  );
}
