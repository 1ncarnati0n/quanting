import IntervalSelector from "./IntervalSelector";
import TimeRangeBar from "./TimeRangeBar";
import { useSettingsStore } from "../stores/useSettingsStore";
import { getSymbolLabel } from "../utils/constants";
import { useChartStore } from "../stores/useChartStore";
import { formatPrice } from "../utils/formatters";
import { Button } from "@/components/ui/button";

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
  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const prevCandle = candles.length > 1 ? candles[candles.length - 2] : null;
  const change = lastCandle && prevCandle ? lastCandle.close - prevCandle.close : 0;
  const changePct = prevCandle && prevCandle.close !== 0 ? (change / prevCandle.close) * 100 : 0;
  const changeColor = change >= 0 ? "var(--success)" : "var(--destructive)";
  const high = candles.length > 0 ? Math.max(...candles.map((c) => c.high)) : null;
  const low = candles.length > 0 ? Math.min(...candles.map((c) => c.low)) : null;
  const marketBadge =
    market === "crypto" ? "코인" : market === "krStock" ? "KR" : market === "forex" ? "FX" : "US";
  const marketColor =
    market === "crypto"
      ? "var(--warning)"
      : market === "krStock"
        ? "#EC4899"
        : market === "forex"
          ? "#14B8A6"
          : "var(--primary)";

  const formatVolume = (volume: number | null) => {
    if (volume === null) return "-";
    return new Intl.NumberFormat("ko-KR", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(volume);
  };

  const rangePct = high !== null && low !== null && low > 0 ? ((high - low) / low) * 100 : null;

  return (
    <div className="market-header flex flex-col">
      {/* Row 1: Symbol / Price / OHLV / Range */}
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2.5 sm:gap-x-3 sm:px-4">
        {/* Symbol + Badge + LIVE */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="ds-type-title font-semibold tracking-wide text-[var(--primary)]">
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

        {/* Divider */}
        <div className="hidden h-4 w-px bg-[var(--border)] sm:block" />

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
            V <span style={{ color: changeColor }}>{formatVolume(lastCandle?.volume ?? null)}</span>
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

        {/* Symbol name (far right, muted) */}
        {symbolLabel && (
          <>
            <div className="flex-1" />
            <span className="ds-type-label hidden truncate text-[var(--muted-foreground)] xl:inline">
              {symbol} · {symbolLabel}
            </span>
          </>
        )}
      </div>

      {/* Row 2: Controls */}
      <div className="flex min-w-0 flex-wrap items-center gap-2.5 border-t border-[var(--border)] px-3 py-2 sm:gap-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleWatchlist}
          className="h-8 w-8 shrink-0 text-[var(--muted-foreground)] xl:hidden"
          title="관심종목 패널 열기/닫기 (Ctrl/Cmd+B)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
          </svg>
        </Button>

        <div className="flex min-w-0 shrink-0 items-center gap-1 rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-1">
          <span className="ds-type-caption hidden font-semibold text-[var(--muted-foreground)] sm:inline">
            인터벌
          </span>
          <div className="min-w-0 overflow-x-auto">
            <IntervalSelector />
          </div>
        </div>

        <div className="hidden min-w-0 shrink-0 items-center gap-1 rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-1 lg:flex">
          <span className="ds-type-caption font-semibold text-[var(--muted-foreground)]">기간</span>
          <div className="min-w-0 overflow-x-auto">
            <TimeRangeBar />
          </div>
        </div>

        <div className="min-w-0 flex-1" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-[var(--muted-foreground)]"
            title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
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
            className="h-8 w-8 text-[var(--muted-foreground)] xl:hidden"
            title="설정 패널 열기/닫기 (Ctrl/Cmd+,)"
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
