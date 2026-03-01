import { useMemo } from "react";
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

  const rangePct = high !== null && low !== null && low > 0 ? ((high - low) / low) * 100 : null;

  return (
    <div className="market-header flex flex-col">
      {/* Row 1: Symbol / Price / OHLV / Range */}
      <div className="flex min-w-0 flex-wrap items-end gap-x-3 gap-y-2 px-4 py-3 sm:gap-x-4 sm:px-5 sm:py-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <QuantingLogo size={16} color="var(--primary)" />
            <span className="ds-type-caption font-semibold tracking-wide text-[var(--primary)]">
              Quanting
            </span>
            <span
              className="ds-type-caption rounded px-1.5 py-1 font-bold leading-none"
              style={{ background: marketColor, color: "var(--primary-foreground)" }}
            >
              {marketBadge}
            </span>
            <span className="ds-type-caption hidden items-center gap-1 rounded bg-[var(--secondary)] px-2 py-1 text-[var(--muted-foreground)] sm:inline-flex">
              <span className={`h-1.5 w-1.5 rounded-full ${isLoading ? "" : "header-live-dot"}`} style={{ background: isLoading ? "var(--warning)" : "var(--success)" }} />
              {isLoading ? "갱신중" : "LIVE"}
            </span>
          </div>
          <div className="mt-1 min-w-0">
            <h1 className="truncate text-[18px] font-bold leading-tight text-[var(--foreground)] sm:text-[22px]">
              {instrument.primary}
            </h1>
            {instrument.secondary && (
              <p className="ds-type-label mt-0.5 truncate font-mono text-[var(--muted-foreground)]">
                {instrument.secondary}
              </p>
            )}
          </div>
        </div>

        {/* Price + Change */}
        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <span className="price-display font-mono text-lg font-bold text-[var(--foreground)] sm:text-xl">
            {lastCandle ? formatPrice(lastCandle.close, market) : "-"}
          </span>
          {lastCandle && prevCandle && (
            <span className="ds-type-label font-mono font-semibold" style={{ color: changeColor }}>
              {change >= 0 ? "+" : ""}{formatPrice(Math.abs(change), market)} ({changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%)
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="hidden h-4 w-px bg-[var(--border)] md:block" />

        {/* H / L / Vol inline */}
        <div className="ds-type-label hidden items-center gap-2 font-mono md:flex lg:gap-3">
          <span style={{ color: "var(--muted-foreground)" }}>
            H <span style={{ color: "var(--foreground)" }}>{high !== null ? formatPrice(high, market) : "-"}</span>
          </span>
          <span style={{ color: "var(--muted-foreground)" }}>
            L <span style={{ color: "var(--foreground)" }}>{low !== null ? formatPrice(low, market) : "-"}</span>
          </span>
          <span style={{ color: "var(--muted-foreground)" }}>
            V <span style={{ color: changeColor }}>{formatCompactNumber(lastCandle?.volume ?? null)}</span>
          </span>
        </div>

        {/* Divider */}
        {rangePct !== null && <div className="hidden h-4 w-px bg-[var(--border)] lg:block" />}

        {/* Range */}
        {rangePct !== null && (
          <span className="ds-type-label hidden font-mono lg:inline" style={{ color: "var(--muted-foreground)" }}>
            Range <span style={{ color: "var(--primary)" }}>{rangePct.toFixed(2)}%</span>
          </span>
        )}
      </div>

      {/* Row 2: Controls */}
      <div className="flex min-w-0 flex-wrap items-center gap-2 border-t border-[var(--border)] px-4 py-2 sm:px-5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleWatchlist}
          className="h-7 w-7 shrink-0 text-[var(--muted-foreground)] xl:hidden"
          title="관심종목 패널 열기/닫기 (Ctrl/Cmd+B)"
          aria-label="관심종목 패널 열기/닫기"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
          </svg>
        </Button>

        <div className="flex min-w-0 shrink-0 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5">
          <span className="ds-type-caption hidden font-medium text-[var(--muted-foreground)] sm:inline">
            인터벌
          </span>
          <div className="min-w-0 overflow-visible">
            <IntervalSelector />
          </div>
        </div>

        <div className="hidden min-w-0 shrink-0 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 lg:flex">
          <span className="ds-type-caption font-medium text-[var(--muted-foreground)]">기간</span>
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
            className="h-7 w-7 text-[var(--muted-foreground)]"
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
            className="h-7 w-7 text-[var(--muted-foreground)] xl:hidden"
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
