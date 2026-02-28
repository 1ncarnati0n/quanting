import { useChartStore } from "../stores/useChartStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import SignalBadge from "./SignalBadge";
import { formatPrice, formatTime } from "../utils/formatters";
import { getSymbolLabel } from "../utils/constants";

export default function StatusBar() {
  const { data } = useChartStore();
  const { symbol, interval, market } = useSettingsStore();

  const lastCandle = data?.candles[data.candles.length - 1];
  const lastSignal = data?.signals[data.signals.length - 1];
  const lastRsi = data?.rsi[data.rsi.length - 1];

  const displayName = getSymbolLabel(symbol);
  const marketBadge = market === "crypto" ? "CRYPTO" : market === "krStock" ? "KR" : "US";
  const badgeColor = market === "crypto" ? "#F59E0B" : market === "krStock" ? "#EC4899" : "#2563EB";

  return (
    <div
      className="flex items-center gap-3 border-t px-4 py-1.5 text-xs"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
        color: "var(--text-secondary)",
      }}
    >
      <span
        className="rounded px-1 py-0.5 text-[9px] font-bold"
        style={{ background: badgeColor, color: "#fff" }}
      >
        {marketBadge}
      </span>
      <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>
        {displayName ? `${symbol} · ${displayName}` : symbol}
      </span>
      <span>{interval}</span>

      {lastCandle && (
        <>
          <span
            className="font-mono"
            style={{
              color:
                lastCandle.close >= lastCandle.open ? "#22C55E" : "#EF4444",
            }}
          >
            {formatPrice(lastCandle.close, market)}
          </span>
          {lastRsi && (
            <span>
              RSI: <span className="font-mono">{lastRsi.value.toFixed(1)}</span>
            </span>
          )}
        </>
      )}

      {lastSignal && <SignalBadge signalType={lastSignal.signalType} />}

      <div className="flex-1" />

      {lastCandle && (
        <span className="text-[10px]">
          Updated: {formatTime(lastCandle.time)}
        </span>
      )}
    </div>
  );
}
