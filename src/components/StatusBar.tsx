import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useChartStore } from "../stores/useChartStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import SignalBadge from "./SignalBadge";
import { formatPrice, formatTime } from "../utils/formatters";
import { getIntervalLabel, type Interval } from "../utils/constants";

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
  { key: "bb", label: "BB", color: "var(--primary)" },
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
  { key: "macd", label: "MACD", color: "var(--primary)" },
  { key: "stochastic", label: "STOCH", color: "#F59E0B" },
  { key: "volume", label: "VOL", color: "var(--success)" },
  { key: "obv", label: "OBV", color: "#14B8A6" },
];

function StatusMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="status-strip__metric">
      <span className="status-strip__metric-label">{label}</span>
      <strong className="status-strip__metric-value" style={accent ? { color: accent } : undefined}>
        {value}
      </strong>
    </div>
  );
}

export default function StatusBar() {
  const data = useChartStore((state) => state.data);
  const { interval, market, indicators } = useSettingsStore(
    useShallow((state) => ({
      interval: state.interval,
      market: state.market,
      indicators: state.indicators,
    })),
  );

  const lastCandle = data?.candles[data.candles.length - 1];
  const lastSignal = data?.signals[data.signals.length - 1];
  const lastRsi = data?.rsi[data.rsi.length - 1];

  const enabledIndicators = INDICATOR_PILLS.filter(({ key }) => indicators[key].enabled);
  const visibleIndicators = enabledIndicators.slice(0, 9);
  const hiddenIndicatorCount = Math.max(enabledIndicators.length - visibleIndicators.length, 0);

  const performance = useMemo(() => {
    if (!data || data.signals.length < 2) {
      return { trades: 0, wins: 0, winRate: 0, avgReturn: 0 };
    }

    const buySignals = new Set([
      "supertrendBuy", "emaCrossoverBuy", "stochRsiBuy", "cmfObvBuy",
      "ttmSqueezeBuy", "vwapBreakoutBuy", "parabolicSarBuy",
      "macdHistReversalBuy", "ibsMeanRevBuy", "rsiDivergenceBuy",
    ]);
    const sellSignals = new Set([
      "supertrendSell", "emaCrossoverSell", "stochRsiSell", "cmfObvSell",
      "ttmSqueezeSell", "vwapBreakoutSell", "parabolicSarSell",
      "macdHistReversalSell", "ibsMeanRevSell", "rsiDivergenceSell",
    ]);
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
    <div className="status-strip ds-type-label grid min-w-0 gap-2 px-3 py-2.5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_auto] lg:items-center">
      <div className="status-strip__group min-w-0">
        <div className="status-strip__eyebrow ds-type-caption">Signal Feed</div>
        {lastSignal ? (
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <SignalBadge signalType={lastSignal.signalType} />
            <span className="ds-type-label truncate text-[var(--muted-foreground)]">
              {formatTime(lastSignal.time)} · 진입 {formatPrice(lastSignal.price, market)}
              {lastRsi ? ` · RSI ${lastRsi.value.toFixed(1)}` : ""}
            </span>
          </div>
        ) : (
          <span className="mt-1 block ds-type-label text-[var(--muted-foreground)]">
            최근 신호 없음
          </span>
        )}
        <div className="ds-type-caption mt-1 text-[var(--muted-foreground)]">
          {getIntervalLabel(interval as Interval)} 차트
          {lastCandle ? ` · 종가 ${formatPrice(lastCandle.close, market)}` : ""}
        </div>
      </div>

      <div className="status-strip__group hidden min-w-0 md:flex md:flex-col">
        <div className="status-strip__eyebrow ds-type-caption">Indicator Stack</div>
        <div className="status-strip__pill-row mt-1.5 flex min-w-0 flex-wrap items-center gap-1">
          <span className="ds-type-caption text-[var(--muted-foreground)]">
            {enabledIndicators.length}개 활성
          </span>
          {visibleIndicators.map(({ key, label, color }) => (
            <span
              key={key}
              className="ds-type-caption rounded-full px-2 py-1 font-semibold"
              style={{
                background: `color-mix(in srgb, ${color} 16%, transparent)`,
                color,
                border: `1px solid color-mix(in srgb, ${color} 34%, transparent)`,
              }}
            >
              {label}
            </span>
          ))}
          {hiddenIndicatorCount > 0 && (
            <span className="ds-type-caption rounded-full border border-[var(--border)] px-2 py-1 text-[var(--muted-foreground)]">
              +{hiddenIndicatorCount}
            </span>
          )}
        </div>
      </div>

      <div className="status-strip__metrics flex flex-wrap items-center gap-1.5 lg:justify-end">
        <StatusMetric label="인터벌" value={getIntervalLabel(interval as Interval)} />
        {lastCandle && (
          <StatusMetric
            label="마감"
            value={formatPrice(lastCandle.close, market)}
            accent={lastCandle.close >= lastCandle.open ? "var(--success)" : "var(--destructive)"}
          />
        )}
        {lastCandle && <StatusMetric label="시각" value={formatTime(lastCandle.time)} />}
        {performance.trades > 0 && (
          <StatusMetric
            label="성과"
            value={`${performance.winRate.toFixed(1)}% / ${performance.avgReturn >= 0 ? "+" : ""}${performance.avgReturn.toFixed(2)}%`}
            accent={performance.avgReturn >= 0 ? "var(--success)" : "var(--destructive)"}
          />
        )}
      </div>
    </div>
  );
}
