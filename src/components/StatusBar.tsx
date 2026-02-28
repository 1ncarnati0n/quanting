import { useChartStore } from "../stores/useChartStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import SignalBadge from "./SignalBadge";
import { formatPrice, formatTime } from "../utils/formatters";
import { useMemo } from "react";

type PillIndicatorKey =
  | "bb"
  | "rsi"
  | "sma"
  | "ema"
  | "signalZones"
  | "volumeProfile"
  | "vwap"
  | "ichimoku"
  | "supertrend"
  | "psar"
  | "atr"
  | "macd"
  | "stochastic"
  | "volume"
  | "obv";

const INDICATOR_PILLS: { key: PillIndicatorKey; label: string; color: string }[] = [
  { key: "bb", label: "BB", color: "var(--accent-primary)" },
  { key: "rsi", label: "RSI", color: "#A78BFA" },
  { key: "sma", label: "SMA", color: "#F59E0B" },
  { key: "ema", label: "EMA", color: "#8B5CF6" },
  { key: "signalZones", label: "ZONES", color: "#22C55E" },
  { key: "volumeProfile", label: "VP", color: "#60A5FA" },
  { key: "vwap", label: "VWAP", color: "#06B6D4" },
  { key: "ichimoku", label: "ICHI", color: "#F59E0B" },
  { key: "supertrend", label: "SUPER", color: "#22C55E" },
  { key: "psar", label: "PSAR", color: "#F97316" },
  { key: "atr", label: "ATR", color: "#38BDF8" },
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

  const performance = useMemo(() => {
    if (!data || data.signals.length < 2) {
      return { trades: 0, wins: 0, winRate: 0, avgReturn: 0 };
    }

    const buySignals = new Set(["strongBuy", "weakBuy", "macdBullish", "stochOversold"]);
    const sellSignals = new Set(["strongSell", "weakSell", "macdBearish", "stochOverbought"]);
    let entry: number | null = null;
    const returns: number[] = [];

    for (const signal of data.signals) {
      if (entry === null && buySignals.has(signal.signalType)) {
        entry = signal.price;
        continue;
      }
      if (entry !== null && sellSignals.has(signal.signalType)) {
        const ret = entry !== 0 ? ((signal.price - entry) / entry) * 100 : 0;
        returns.push(ret);
        entry = null;
      }
    }

    if (returns.length === 0) {
      return { trades: 0, wins: 0, winRate: 0, avgReturn: 0 };
    }
    const wins = returns.filter((ret) => ret > 0).length;
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    return {
      trades: returns.length,
      wins,
      winRate: (wins / returns.length) * 100,
      avgReturn,
    };
  }, [data]);

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
        {performance.trades > 0 && (
          <div className="mt-0.5 text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
            성과 {performance.winRate.toFixed(1)}% · {performance.avgReturn >= 0 ? "+" : ""}
            {performance.avgReturn.toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );
}
