import { useMemo, type CSSProperties } from "react";
import IntervalSelector from "./IntervalSelector";
import TimeRangeBar from "./TimeRangeBar";
import { useSettingsStore } from "../stores/useSettingsStore";
import { getSymbolLabel } from "../utils/constants";
import { useChartStore } from "../stores/useChartStore";
import { formatPrice } from "../utils/formatters";
import {
  formatCompactNumber,
  getMarketBadgeMeta,
  getInstrumentDisplay,
  summarizeCandles,
} from "../utils/marketView";
import { Button } from "@/components/ui/button";
import QuantingLogo from "./QuantingLogo";

interface MarketHeaderProps {
  onToggleWatchlist: () => void;
  onToggleSettings: () => void;
}

export default function MarketHeader({
  onToggleWatchlist,
  onToggleSettings,
}: MarketHeaderProps) {
  const { theme, toggleTheme, symbol, market } = useSettingsStore();
  const { data, isLoading } = useChartStore();
  const symbolLabel = getSymbolLabel(symbol);
  const candles = data?.candles ?? [];
  const { lastCandle, prevCandle, high, low, change, changePct } = useMemo(
    () => summarizeCandles(candles),
    [candles],
  );
  const changeColor = change >= 0 ? "var(--success)" : "var(--destructive)";
  const { label: marketBadge, color: marketColor } = getMarketBadgeMeta(market);
  const instrument = getInstrumentDisplay(symbol, symbolLabel, market);
  const headerStyle: CSSProperties = {
    "--market-badge-bg": marketColor,
    "--market-live-dot": isLoading ? "var(--warning)" : "var(--success)",
    "--market-trend-color": changeColor,
  } as CSSProperties;

  const rangePct = high !== null && low !== null && low > 0 ? ((high - low) / low) * 100 : null;

  return (
    <div className="market-header flex flex-col" style={headerStyle}>
      {/* Row 1: Symbol / Price / OHLV / Range */}
      <div className="flex min-w-0 flex-wrap items-end gap-x-3 gap-y-2 px-4 py-3 sm:gap-x-4 sm:px-5 sm:py-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <QuantingLogo size={16} color="var(--primary)" />
            <span className="ds-type-caption text-token-primary font-semibold tracking-wide">
              Quanting
            </span>
            <span className="ds-market-badge ds-type-caption rounded px-1.5 py-1 font-bold leading-none">
              {marketBadge}
            </span>
            <span className="ds-live-pill ds-type-caption hidden items-center gap-1 rounded px-2 py-1 sm:inline-flex">
              <span className={`ds-live-dot h-1.5 w-1.5 rounded-full ${isLoading ? "" : "header-live-dot"}`} />
              {isLoading ? "갱신중" : "LIVE"}
            </span>
          </div>
          <div className="mt-1 min-w-0">
            <h1 className="text-token-foreground truncate text-[18px] font-bold leading-tight sm:text-[22px]">
              {instrument.primary}
            </h1>
            {instrument.secondary && (
              <p className="ds-type-label text-token-muted mt-0.5 truncate font-mono">
                {instrument.secondary}
              </p>
            )}
          </div>
        </div>

        {/* Price + Change */}
        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <span className="price-display text-token-foreground font-mono text-lg font-bold sm:text-xl">
            {lastCandle ? formatPrice(lastCandle.close, market) : "-"}
          </span>
          {lastCandle && prevCandle && (
            <span className="ds-market-delta ds-type-label font-mono font-semibold">
              {change >= 0 ? "+" : ""}{formatPrice(Math.abs(change), market)} ({changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%)
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="hidden h-4 w-px bg-[var(--border)] md:block" />

        {/* H / L / Vol inline */}
        <div className="ds-type-label hidden items-center gap-2 font-mono md:flex lg:gap-3">
          <span className="ds-market-stat">
            H <strong>{high !== null ? formatPrice(high, market) : "-"}</strong>
          </span>
          <span className="ds-market-stat">
            L <strong>{low !== null ? formatPrice(low, market) : "-"}</strong>
          </span>
          <span className="ds-market-stat ds-market-stat--trend">
            V <strong>{formatCompactNumber(lastCandle?.volume ?? null)}</strong>
          </span>
        </div>

        {/* Divider */}
        {rangePct !== null && <div className="hidden h-4 w-px bg-[var(--border)] lg:block" />}

        {/* Range */}
        {rangePct !== null && (
          <span className="ds-market-stat ds-market-range ds-type-label hidden font-mono lg:inline">
            Range <strong>{rangePct.toFixed(2)}%</strong>
          </span>
        )}
      </div>

      {/* Row 2: Controls */}
      <div className="flex min-w-0 flex-wrap items-center gap-2.5 border-t border-[var(--border)] px-4 py-2.5 sm:px-5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleWatchlist}
          className="text-token-muted h-8 w-8 shrink-0 xl:hidden"
          title="관심종목 패널 열기/닫기 (Ctrl/Cmd+B)"
          aria-label="관심종목 패널 열기/닫기"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
          </svg>
        </Button>

        <div className="ui-control-cluster flex min-w-0 shrink-0">
          <span className="ds-type-caption text-token-muted hidden font-medium sm:inline">
            인터벌
          </span>
          <div className="min-w-0 overflow-visible">
            <IntervalSelector />
          </div>
        </div>

        <div className="ui-control-cluster hidden min-w-0 shrink-0 lg:flex">
          <span className="ds-type-caption text-token-muted font-medium">기간</span>
          <div className="min-w-0 overflow-visible">
            <TimeRangeBar />
          </div>
        </div>

        <div className="min-w-0 flex-1" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-token-muted h-8 w-8"
            title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
          >
            {theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSettings}
            className="text-token-muted h-8 w-8 xl:hidden"
            title="설정 패널 열기/닫기 (Ctrl/Cmd+,)"
            aria-label="설정 패널 열기/닫기"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M15 4v16" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
