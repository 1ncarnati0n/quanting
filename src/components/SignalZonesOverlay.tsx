import { useEffect, useMemo, useState } from "react";
import type { IChartApi, Time } from "lightweight-charts";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useReplayStore } from "../stores/useReplayStore";
import type { AnalysisResponse, SignalType } from "../types";

type Zone = {
  id: string;
  startTime: number;
  endTime: number;
  returnPct: number;
};

interface SignalZonesOverlayProps {
  chart: IChartApi | null;
  data: AnalysisResponse | null;
}

const BUY_SIGNALS = new Set<SignalType>([
  "strongBuy",
  "weakBuy",
  "macdBullish",
  "stochOversold",
]);
const SELL_SIGNALS = new Set<SignalType>([
  "strongSell",
  "weakSell",
  "macdBearish",
  "stochOverbought",
]);

function buildZones(data: AnalysisResponse, maxTime: number): Zone[] {
  const scopedSignals = data.signals
    .filter((signal) => signal.time <= maxTime)
    .slice()
    .sort((a, b) => a.time - b.time);

  const zones: Zone[] = [];
  let entry: { time: number; price: number } | null = null;

  for (const signal of scopedSignals) {
    if (entry === null && BUY_SIGNALS.has(signal.signalType)) {
      entry = { time: signal.time, price: signal.price };
      continue;
    }

    if (entry !== null && SELL_SIGNALS.has(signal.signalType)) {
      const returnPct =
        Math.abs(entry.price) > Number.EPSILON
          ? ((signal.price - entry.price) / entry.price) * 100
          : 0;
      zones.push({
        id: `zone-${entry.time}-${signal.time}`,
        startTime: entry.time,
        endTime: signal.time,
        returnPct,
      });
      entry = null;
    }
  }

  if (entry !== null) {
    let lastCandle = null as (typeof data.candles)[number] | null;
    for (let i = data.candles.length - 1; i >= 0; i -= 1) {
      if (data.candles[i].time <= maxTime) {
        lastCandle = data.candles[i];
        break;
      }
    }
    if (lastCandle) {
      const returnPct =
        Math.abs(entry.price) > Number.EPSILON
          ? ((lastCandle.close - entry.price) / entry.price) * 100
          : 0;
      zones.push({
        id: `zone-open-${entry.time}`,
        startTime: entry.time,
        endTime: lastCandle.time,
        returnPct,
      });
    }
  }

  return zones;
}

export default function SignalZonesOverlay({ chart, data }: SignalZonesOverlayProps) {
  const showZones = useSettingsStore((s) => s.indicators.signalZones.enabled);
  const replayEnabled = useReplayStore((s) => s.enabled);
  const replayIndex = useReplayStore((s) => s.currentIndex);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!chart) return;
    const onRange = () => setRevision((prev) => prev + 1);
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRange);
    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRange);
    };
  }, [chart]);

  useEffect(() => {
    if (!chart) return;
    const onResize = () => setRevision((prev) => prev + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [chart]);

  const elements = useMemo(() => {
    if (!showZones || !chart || !data || data.candles.length < 2) return [];

    const cappedIndex = replayEnabled
      ? Math.min(Math.max(replayIndex, 0), data.candles.length - 1)
      : data.candles.length - 1;
    const maxTime = data.candles[cappedIndex]?.time ?? data.candles[data.candles.length - 1].time;
    const zones = buildZones(data, maxTime);

    return zones
      .map((zone) => {
        const x1 = chart.timeScale().timeToCoordinate(zone.startTime as Time);
        const x2 = chart.timeScale().timeToCoordinate(zone.endTime as Time);
        if (x1 === null || x2 === null) return null;
        const left = Math.min(x1, x2);
        const width = Math.max(1, Math.abs(x2 - x1));
        const positive = zone.returnPct >= 0;
        const text = `${positive ? "+" : ""}${zone.returnPct.toFixed(2)}%`;

        return (
          <div
            key={zone.id}
            className="absolute"
            style={{
              left,
              width,
              top: 0,
              bottom: 0,
              background: positive ? "rgba(34,197,94,0.09)" : "rgba(239,68,68,0.09)",
              borderLeft: positive ? "1px solid rgba(34,197,94,0.26)" : "1px solid rgba(239,68,68,0.26)",
              borderRight: positive ? "1px solid rgba(34,197,94,0.26)" : "1px solid rgba(239,68,68,0.26)",
            }}
          >
            <span
              className="ds-type-caption absolute left-1 top-1 rounded px-1 py-0.5 font-mono"
              style={{
                color: positive ? "#22C55E" : "#F87171",
                background: "color-mix(in srgb, var(--background) 75%, transparent)",
              }}
            >
              {text}
            </span>
          </div>
        );
      })
      .filter((node): node is JSX.Element => node !== null);
  }, [chart, data, replayEnabled, replayIndex, revision, showZones]);

  if (!showZones || elements.length === 0) return null;

  return <div className="pointer-events-none absolute inset-0 z-[4]">{elements}</div>;
}
