import { useMemo, useRef } from "react";
import MainChart from "./MainChart";
import CrosshairLegend from "./CrosshairLegend";
import ChartToolbar from "./ChartToolbar";
import ChartContextMenu from "./ChartContextMenu";
import { useChartStore } from "../stores/useChartStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import type { IChartApi } from "lightweight-charts";

type OverlayBand = {
  id: "volume" | "rsi" | "macd" | "stoch" | "obv";
  label: string;
  color: string;
  weight: number;
  value: string;
};

type OverlayBandLayout = OverlayBand & {
  top: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function ChartContainer() {
  const { data, isLoading, error } = useChartStore();
  const { indicators } = useSettingsStore();
  const chartApiRef = useRef<IChartApi | null>(null);
  const compactFormatter = useMemo(
    () =>
      new Intl.NumberFormat("ko-KR", {
        notation: "compact",
        maximumFractionDigits: 2,
      }),
    [],
  );

  const bands = useMemo<OverlayBand[]>(() => {
    const next: OverlayBand[] = [];
    const lastCandle = data?.candles[data.candles.length - 1];
    const lastRsi = data?.rsi[data.rsi.length - 1];
    const macdData = data?.macd?.data ?? [];
    const stochasticData = data?.stochastic?.data ?? [];
    const obvData = data?.obv?.data ?? [];
    const lastMacd = macdData[macdData.length - 1];
    const lastStoch = stochasticData[stochasticData.length - 1];
    const lastObv = obvData[obvData.length - 1];

    if (indicators.volume.enabled) {
      next.push({
        id: "volume",
        label: "거래량",
        color: "var(--success-color)",
        weight: Math.max(0.2, indicators.layout.volumeWeight),
        value: lastCandle ? compactFormatter.format(lastCandle.volume) : "-",
      });
    }

    if (indicators.rsi.enabled) {
      next.push({
        id: "rsi",
        label: "RSI",
        color: "#A78BFA",
        weight: Math.max(0.2, indicators.layout.rsiWeight),
        value: lastRsi ? lastRsi.value.toFixed(1) : "-",
      });
    }

    if (indicators.macd.enabled) {
      next.push({
        id: "macd",
        label: "MACD",
        color: "var(--accent-primary)",
        weight: Math.max(0.2, indicators.layout.macdWeight),
        value: lastMacd ? `${lastMacd.macd.toFixed(2)} / ${lastMacd.signal.toFixed(2)}` : "-",
      });
    }

    if (indicators.stochastic.enabled) {
      next.push({
        id: "stoch",
        label: "STOCH",
        color: "#F59E0B",
        weight: Math.max(0.2, indicators.layout.stochasticWeight),
        value: lastStoch ? `${lastStoch.k.toFixed(1)} / ${lastStoch.d.toFixed(1)}` : "-",
      });
    }

    if (indicators.obv.enabled) {
      next.push({
        id: "obv",
        label: "OBV",
        color: "#14B8A6",
        weight: Math.max(0.2, indicators.layout.obvWeight),
        value: lastObv ? compactFormatter.format(lastObv.value) : "-",
      });
    }

    return next;
  }, [compactFormatter, data, indicators]);

  const bandLayouts = useMemo<OverlayBandLayout[]>(() => {
    if (bands.length === 0) return [];

    const regionTop = clamp(indicators.layout.priceAreaRatio, 0.35, 0.85);
    const regionBottom = 0.02;
    const regionHeight = Math.max(0.08, 1 - regionTop - regionBottom);
    const totalWeight = bands.reduce((sum, band) => sum + band.weight, 0);

    let cursorTop = regionTop;
    return bands.map((band, index) => {
      const isLast = index === bands.length - 1;
      const bandHeight = isLast
        ? Math.max(0.01, 1 - regionBottom - cursorTop)
        : regionHeight * (band.weight / Math.max(0.0001, totalWeight));
      const top = clamp(cursorTop, 0.01, 0.95);

      cursorTop += bandHeight;
      return { ...band, top };
    });
  }, [bands, indicators.layout.priceAreaRatio]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border p-6" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <div className="text-center">
          <p className="mb-2 text-sm" style={{ color: "var(--danger-color)" }}>
            {error}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            심볼명 또는 네트워크 연결을 확인해 주세요
          </p>
        </div>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border p-6" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <div className="text-center">
          <div
            className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            데이터 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-lg border"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-secondary)",
      }}
    >
      {isLoading && (
        <div
          className="h-0.5 w-full overflow-hidden"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <div
            className="h-full animate-pulse"
            style={{ background: "var(--accent-primary)", width: "40%" }}
          />
        </div>
      )}
      <CrosshairLegend />
      <ChartToolbar />
      <ChartContextMenu />
      {bandLayouts.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-[8]">
          {bandLayouts.map((band) => (
            <div
              key={`${band.id}-line`}
              className="chart-band-separator"
              style={{ top: `${(band.top * 100).toFixed(2)}%` }}
            />
          ))}
          {bandLayouts.map((band) => (
            <div
              key={`${band.id}-label`}
              className="chart-band-label"
              style={{
                top: `calc(${(band.top * 100).toFixed(2)}% + 4px)`,
                borderColor: `color-mix(in srgb, ${band.color} 30%, var(--border-color))`,
              }}
            >
              <span className="chart-band-label__title" style={{ color: band.color }}>
                {band.label}
              </span>
              <span className="chart-band-label__value">{band.value}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex-1 min-h-0" data-chart-area>
        <MainChart data={data} onChartReady={(c) => { chartApiRef.current = c; }} />
      </div>
    </div>
  );
}
