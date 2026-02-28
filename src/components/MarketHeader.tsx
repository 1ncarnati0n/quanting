import SymbolSearch from "./SymbolSearch";
import IntervalSelector from "./IntervalSelector";
import TimeRangeBar from "./TimeRangeBar";
import { useSettingsStore } from "../stores/useSettingsStore";
import { getSymbolLabel } from "../utils/constants";
import { useChartStore } from "../stores/useChartStore";
import { formatPrice, formatShortTime } from "../utils/formatters";
import { Button } from "@/components/ui/button";

interface MarketHeaderProps {
  onToggleWatchlist: () => void;
  onToggleSettings: () => void;
}

function HeaderMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative";
}) {
  const color =
    tone === "positive"
      ? "var(--success-color)"
      : tone === "negative"
        ? "var(--danger-color)"
        : "var(--text-primary)";
  return (
    <div
      className="rounded-md border px-2 py-1.5 md:px-2.5 md:py-2 xl:px-3 xl:py-2.5"
      style={{
        borderColor: "var(--border-color)",
        background: "color-mix(in srgb, var(--bg-tertiary) 80%, transparent)",
      }}
    >
      <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>
      <div className="font-mono text-[11px] font-semibold md:text-xs" style={{ color }}>
        {value}
      </div>
    </div>
  );
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
  const changeColor = change >= 0 ? "var(--success-color)" : "var(--danger-color)";
  const high = candles.length > 0 ? Math.max(...candles.map((c) => c.high)) : null;
  const low = candles.length > 0 ? Math.min(...candles.map((c) => c.low)) : null;
  const marketBadge = market === "crypto" ? "코인" : market === "krStock" ? "KR" : "US";
  const marketColor =
    market === "crypto"
      ? "var(--warning-color)"
      : market === "krStock"
        ? "#EC4899"
        : "var(--accent-primary)";

  const formatVolume = (volume: number | null) => {
    if (volume === null) return "-";
    return new Intl.NumberFormat("ko-KR", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(volume);
  };

  const rangePct = high !== null && low !== null && low > 0 ? ((high - low) / low) * 100 : null;

  return (
    <div className="market-header flex flex-col gap-2.5 px-2.5 py-2.5 sm:px-3 sm:py-3 lg:gap-3.5 lg:px-4 lg:py-4">
      <div className="grid gap-1.5 sm:gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] xl:gap-2.5">
        <section
          className="rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 md:px-4 md:py-3.5 xl:px-5 xl:py-4"
          style={{
            borderColor: "var(--border-color)",
            background:
              "linear-gradient(120deg, color-mix(in srgb, var(--bg-card) 88%, transparent), color-mix(in srgb, var(--bg-tertiary) 35%, transparent))",
          }}
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5 lg:gap-3">
            <span className="text-sm font-semibold tracking-wide" style={{ color: "var(--accent-primary)" }}>
              Quanting
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: marketColor, color: "var(--accent-contrast)" }}
            >
              {marketBadge}
            </span>
            <span className="hidden items-center gap-1 rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[9px] text-[var(--text-secondary)] sm:inline-flex">
              <span className={`h-1.5 w-1.5 rounded-full ${isLoading ? "" : "header-live-dot"}`} style={{ background: isLoading ? "var(--warning-color)" : "var(--success-color)" }} />
              {isLoading ? "갱신중" : "LIVE"}
            </span>
          </div>

          <div className="mt-2.5 flex min-w-0 items-end justify-between gap-2.5 sm:mt-3 sm:gap-3 lg:gap-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold lg:text-[15px]" style={{ color: "var(--text-primary)" }}>
                {symbolLabel ? `${symbol} · ${symbolLabel}` : symbol}
              </div>
              <div className="mt-1 text-[10px] sm:mt-1.5" style={{ color: "var(--text-secondary)" }}>
                {lastCandle ? `최근 갱신 ${formatShortTime(lastCandle.time)}` : "데이터 대기중"}
              </div>
            </div>
            {rangePct !== null && (
              <div
                className="shrink-0 rounded-md border px-2 py-1.5 sm:px-2.5 sm:py-2 xl:px-3 xl:py-2.5"
                style={{
                  borderColor: "var(--border-color)",
                  background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
                }}
              >
                <div className="text-[9px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  Range
                </div>
                <div className="font-mono text-[11px] font-semibold" style={{ color: "var(--accent-primary)" }}>
                  {rangePct.toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </section>

        <section
          className="rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 md:px-4 md:py-3.5 xl:px-5 xl:py-4"
          style={{
            borderColor: "var(--border-color)",
            background:
              "linear-gradient(140deg, color-mix(in srgb, var(--bg-card) 86%, transparent), color-mix(in srgb, var(--accent-primary) 10%, transparent))",
          }}
        >
          <div className="flex items-start justify-between gap-2.5 sm:gap-3 lg:gap-4">
            <div className="min-w-0">
              <div className="price-display font-mono text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {lastCandle ? formatPrice(lastCandle.close, market) : "-"}
              </div>
              {lastCandle && prevCandle ? (
                <div
                  className="mt-1.5 inline-flex rounded px-2 py-1 font-mono text-[11px] font-semibold sm:mt-2 sm:px-2.5 sm:py-1.5"
                  style={{
                    color: changeColor,
                    background: change >= 0 ? "rgba(34,197,94,0.14)" : "rgba(239,68,68,0.14)",
                  }}
                >
                  {change >= 0 ? "+" : ""}
                  {formatPrice(Math.abs(change), market)} ({changePct >= 0 ? "+" : ""}
                  {changePct.toFixed(2)}%)
                </div>
              ) : (
                <div className="mt-1.5 text-[10px] sm:mt-2" style={{ color: "var(--text-secondary)" }}>
                  변동 데이터 없음
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:gap-2.5">
              <HeaderMetric label="OPEN" value={lastCandle ? formatPrice(lastCandle.open, market) : "-"} />
              <HeaderMetric label="HIGH" value={high !== null ? formatPrice(high, market) : "-"} />
              <HeaderMetric label="LOW" value={low !== null ? formatPrice(low, market) : "-"} />
              <HeaderMetric
                label="VOL"
                value={formatVolume(lastCandle?.volume ?? null)}
                tone={change >= 0 ? "positive" : "negative"}
              />
            </div>
          </div>
        </section>
      </div>

      <section
        className="rounded-xl border px-2.5 py-2 sm:px-3 sm:py-2.5 lg:px-3.5 lg:py-3"
        style={{
          borderColor: "var(--border-color)",
          background: "color-mix(in srgb, var(--bg-card) 92%, transparent)",
        }}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="min-w-0 shrink-0 overflow-x-auto">
            <IntervalSelector />
          </div>

          <div className="hidden min-w-0 shrink-0 lg:block">
            <TimeRangeBar />
          </div>

          <div className="min-w-0 flex-1" />

          <div className="flex items-center gap-1">
            <SymbolSearch />

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleWatchlist}
              className="h-8 w-8 text-[var(--text-secondary)]"
              title="관심종목 패널 접기/펼치기 (Ctrl/Cmd+B)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M9 4v16" />
              </svg>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSettings}
              className="h-8 w-8 text-[var(--text-secondary)]"
              title="설정 패널 접기/펼치기 (Ctrl/Cmd+,)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M15 4v16" />
              </svg>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-[var(--text-secondary)]"
              title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </Button>

          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:mt-2">
          <span style={{ color: "var(--text-secondary)" }}>
            단축키: <span className="font-mono">Ctrl/Cmd+K</span> 검색 · <span className="font-mono">Ctrl/Cmd+B</span> 관심종목
          </span>
          <span style={{ color: "var(--text-secondary)" }}>
            {isLoading ? "데이터 업데이트 중..." : "실시간 모니터링 활성"}
          </span>
        </div>
      </section>
    </div>
  );
}
