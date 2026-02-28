import { useChartStore } from "../stores/useChartStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import SignalBadge from "./SignalBadge";
import { formatPrice, formatTime } from "../utils/formatters";

type PillIndicatorKey =
  | "bb"
  | "rsi"
  | "sma"
  | "ema"
  | "macd"
  | "stochastic"
  | "volume"
  | "obv";

const INDICATOR_PILLS: { key: PillIndicatorKey; label: string; color: string }[] = [
  { key: "bb", label: "BB", color: "var(--accent-primary)" },
  { key: "rsi", label: "RSI", color: "#A78BFA" },
  { key: "sma", label: "SMA", color: "#F59E0B" },
  { key: "ema", label: "EMA", color: "#8B5CF6" },
  { key: "macd", label: "MACD", color: "var(--accent-primary)" },
  { key: "stochastic", label: "STOCH", color: "#F59E0B" },
  { key: "volume", label: "VOL", color: "var(--success-color)" },
  { key: "obv", label: "OBV", color: "#14B8A6" },
];

export default function StatusBar() {
  const { data } = useChartStore();
  const { interval, market, indicators } = useSettingsStore();

  const lastCandle = data?.candles[data.candles.length - 1];
  const lastSignal = data?.signals[data.signals.length - 1];
  const lastRsi = data?.rsi[data.rsi.length - 1];

  const enabledIndicators = INDICATOR_PILLS.filter(({ key }) => indicators[key].enabled);

  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-2 border-t px-3 py-1.5 text-xs md:flex-nowrap"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
        color: "var(--text-secondary)",
      }}
    >
      <div className="min-w-0 flex-1">
        {lastSignal ? (
          <div className="flex min-w-0 items-center gap-2">
            <SignalBadge signalType={lastSignal.signalType} source={lastSignal.source} />
            <span className="truncate text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {formatTime(lastSignal.time)} · 진입 {formatPrice(lastSignal.price, market)}
              {lastRsi ? ` · RSI ${lastRsi.value.toFixed(1)}` : ""}
            </span>
          </div>
        ) : (
          <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
            최근 신호 없음
          </span>
        )}
        <div className="mt-0.5 text-[10px]" style={{ color: "var(--text-secondary)" }}>
          {interval} 차트
          {lastCandle ? ` · 종가 ${formatPrice(lastCandle.close, market)}` : ""}
        </div>
      </div>

      <div className="hidden items-center gap-1 md:flex">
        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
          {enabledIndicators.length}개 활성
        </span>
        {enabledIndicators.map(({ key, label, color }) => (
          <span
            key={key}
            className="rounded px-1 py-0.5 text-[9px] font-medium"
            style={{
              background: `color-mix(in srgb, ${color} 18%, transparent)`,
              color,
              border: `1px solid color-mix(in srgb, ${color} 38%, transparent)`,
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="hidden text-right lg:block">
        {lastCandle && (
          <div
            className="font-mono text-[12px]"
            style={{
              color: lastCandle.close >= lastCandle.open ? "var(--success-color)" : "var(--danger-color)",
            }}
          >
            {formatPrice(lastCandle.close, market)}
          </div>
        )}
        {lastCandle && (
          <div className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
            {formatTime(lastCandle.time)}
          </div>
        )}
      </div>
    </div>
  );
}
