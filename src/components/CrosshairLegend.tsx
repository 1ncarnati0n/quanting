import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCrosshairStore } from "../stores/useCrosshairStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { formatPrice } from "../utils/formatters";

const CHART_TYPE_LABELS: Record<string, string> = {
  candlestick: "캔들스틱",
  heikinAshi: "하이킨 아시",
  line: "라인",
  area: "영역",
  bar: "바",
};

export default function CrosshairLegend() {
  const { open, high, low, close, volume, indicators } = useCrosshairStore(
    useShallow((state) => ({
      open: state.open,
      high: state.high,
      low: state.low,
      close: state.close,
      volume: state.volume,
      indicators: state.indicators,
    })),
  );
  const { symbol, chartType, market } = useSettingsStore(
    useShallow((state) => ({
      symbol: state.symbol,
      chartType: state.chartType,
      market: state.market,
    })),
  );
  const compactFormatter = useMemo(
    () =>
      new Intl.NumberFormat("ko-KR", {
        notation: "compact",
        maximumFractionDigits: 2,
      }),
    [],
  );
  const indicatorEntries = useMemo(() => Object.entries(indicators), [indicators]);

  const hasData = open !== 0 || high !== 0 || low !== 0 || close !== 0;
  const changeColor = close >= open ? "var(--market-up)" : "var(--market-down)";
  const isLineType = chartType === "line" || chartType === "area";

  return (
    <div className="chart-crosshair-legend pointer-events-none absolute left-6 top-3 z-10 flex flex-wrap items-center gap-2 rounded-full px-3 py-1.5">
      <div className="ds-type-caption flex items-center gap-2">
        <span className="font-semibold text-[var(--foreground)]">
          {symbol}
        </span>
        <span className="text-[var(--muted-foreground)]">
          {CHART_TYPE_LABELS[chartType] ?? chartType}
        </span>
      </div>

      {hasData && (
        <div className="chart-crosshair-legend__values ds-type-caption flex flex-wrap items-center gap-x-2 gap-y-0">
          {!isLineType && (
            <>
              <span className="text-[var(--muted-foreground)]">O</span>
              <span style={{ color: changeColor }}>{formatPrice(open, market)}</span>
              <span className="text-[var(--muted-foreground)]">H</span>
              <span style={{ color: changeColor }}>{formatPrice(high, market)}</span>
              <span className="text-[var(--muted-foreground)]">L</span>
              <span style={{ color: changeColor }}>{formatPrice(low, market)}</span>
            </>
          )}
          <span className="text-[var(--muted-foreground)]">C</span>
          <span style={{ color: changeColor }}>{formatPrice(close, market)}</span>
          {volume > 0 && (
            <>
              <span className="text-[var(--muted-foreground)]">V</span>
              <span className="text-[var(--foreground)]">{compactFormatter.format(volume)}</span>
            </>
          )}
        </div>
      )}

      {indicatorEntries.length > 0 && (
        <div className="ds-type-caption flex flex-wrap gap-x-2 text-[var(--muted-foreground)]">
          {indicatorEntries.map(([key, val]) => (
            <span key={key}>
              <span className="font-medium uppercase">{key.replace(/-\d+$/, "").replace("-line", "")}</span>{" "}
              <span className="chart-crosshair-legend__values text-[var(--foreground)]">{val}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
