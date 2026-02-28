import SymbolSearch from "./SymbolSearch";
import IntervalSelector from "./IntervalSelector";
import { useSettingsStore } from "../stores/useSettingsStore";
import { getSymbolLabel } from "../utils/constants";
import { useChartStore } from "../stores/useChartStore";
import { formatPrice, formatShortTime } from "../utils/formatters";

interface ToolbarProps {
  onToggleWatchlist: () => void;
  onToggleSettings: () => void;
}

export default function Toolbar({ onToggleWatchlist, onToggleSettings }: ToolbarProps) {
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
  const marketBadge = market === "crypto" ? "CRYPTO" : market === "krStock" ? "KR" : "US";
  const marketColor =
    market === "crypto"
      ? "var(--warning-color)"
      : market === "krStock"
      ? "#EC4899"
      : "var(--accent-primary)";

  const formatVolume = (volume: number | null) => {
    if (volume === null) return "-";
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(volume);
  };

  return (
    <div
      className="flex flex-col gap-2 border-b px-3 py-2 shadow-sm"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="flex min-w-0 flex-wrap items-start gap-2 xl:flex-nowrap">
        <button
          type="button"
          onClick={onToggleWatchlist}
          className="btn-ghost rounded p-1.5 text-sm transition-colors xl:hidden"
          style={{ color: "var(--text-secondary)" }}
          title="Open watchlist (Ctrl/Cmd+B)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-sm font-bold tracking-wide" style={{ color: "var(--accent-primary)" }}>
              Quanting
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: marketColor, color: "var(--accent-contrast)" }}
            >
              {marketBadge}
            </span>
            <span className="truncate text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              {symbolLabel ? `${symbol} · ${symbolLabel}` : symbol}
            </span>
            {isLoading && (
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                Updating...
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px]">
            <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
              {lastCandle ? formatPrice(lastCandle.close, market) : "-"}
            </span>
            {lastCandle && prevCandle && (
              <span className="font-mono" style={{ color: changeColor }}>
                {change >= 0 ? "+" : ""}
                {formatPrice(Math.abs(change), market)} ({changePct >= 0 ? "+" : ""}
                {changePct.toFixed(2)}%)
              </span>
            )}
            <span className="hidden sm:inline text-[10px]" style={{ color: "var(--text-secondary)" }}>
              {lastCandle ? `Updated ${formatShortTime(lastCandle.time)}` : "No data"}
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-2 text-[10px] xl:flex">
          <span style={{ color: "var(--text-secondary)" }}>H</span>
          <span className="font-mono" style={{ color: "var(--text-primary)" }}>
            {high !== null ? formatPrice(high, market) : "-"}
          </span>
          <span style={{ color: "var(--text-secondary)" }}>L</span>
          <span className="font-mono" style={{ color: "var(--text-primary)" }}>
            {low !== null ? formatPrice(low, market) : "-"}
          </span>
          <span style={{ color: "var(--text-secondary)" }}>VOL</span>
          <span className="font-mono" style={{ color: "var(--text-primary)" }}>
            {formatVolume(lastCandle?.volume ?? null)}
          </span>
        </div>

        <div className="hidden flex-1 xl:block" />

        <div className="hidden min-w-0 xl:block">
          <SymbolSearch />
        </div>

        <button
          onClick={toggleTheme}
          className="btn-ghost rounded p-1.5 text-sm transition-colors"
          style={{ color: "var(--text-secondary)" }}
          title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}
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
        </button>

        <button
          onClick={onToggleSettings}
          className="btn-ghost rounded p-1.5 text-sm transition-colors 2xl:hidden"
          style={{ color: "var(--text-secondary)" }}
          title="Settings (Ctrl/Cmd+,)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>

      <div className="max-w-full overflow-x-auto">
        <IntervalSelector />
      </div>
    </div>
  );
}
