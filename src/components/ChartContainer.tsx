import { useCallback, useMemo, useState } from "react";
import MainChart from "./MainChart";
import CrosshairLegend from "./CrosshairLegend";
import ChartToolbar from "./ChartToolbar";
import ChartContextMenu from "./ChartContextMenu";
import DrawingCanvas from "./DrawingCanvas";
import DrawingToolbar from "./DrawingToolbar";
import ReplayControls from "./ReplayControls";
import SignalZonesOverlay from "./SignalZonesOverlay";
import VolumeProfileOverlay from "./VolumeProfileOverlay";
import FundamentalsOverlay from "./FundamentalsOverlay";
import { useChartStore } from "../stores/useChartStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { calculateRvol } from "../utils/rvol";
import type { IChartApi, ISeriesApi, SeriesType } from "lightweight-charts";

type OverlayBand = {
  id: "volume" | "rsi" | "macd" | "stoch" | "obv" | "atr" | "rvol";
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
  const { indicators, multiChartLayout } = useSettingsStore();
  const [chartApi, setChartApi] = useState<IChartApi | null>(null);
  const [mainSeries, setMainSeries] = useState<ISeriesApi<SeriesType> | null>(null);
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
    const atrData = data?.atr?.data ?? [];
    const lastMacd = macdData[macdData.length - 1];
    const lastStoch = stochasticData[stochasticData.length - 1];
    const lastObv = obvData[obvData.length - 1];
    const lastAtr = atrData[atrData.length - 1];

    if (indicators.volume.enabled) {
      next.push({
        id: "volume",
        label: "거래량",
        color: "var(--success)",
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
        color: "var(--primary)",
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

    if (indicators.atr.enabled) {
      next.push({
        id: "atr",
        label: "ATR",
        color: "#38BDF8",
        weight: Math.max(0.2, indicators.layout.atrWeight),
        value: lastAtr ? lastAtr.value.toFixed(2) : "-",
      });
    }

    if (indicators.rvol.enabled) {
      const candles = data?.candles ?? [];
      const rvolData = calculateRvol(candles, indicators.rvol.period);
      const lastRvol = rvolData[rvolData.length - 1];
      next.push({
        id: "rvol",
        label: "RVOL",
        color: "#F59E0B",
        weight: Math.max(0.2, indicators.layout.rvolWeight),
        value: lastRvol ? `${lastRvol.value.toFixed(2)}x` : "-",
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

  const chartSlots = useMemo(() => {
    if (multiChartLayout === 4) return [0, 1, 2, 3];
    if (multiChartLayout === 2) return [0, 1];
    return [0];
  }, [multiChartLayout]);

  const handlePrimaryChartReady = useCallback((chart: IChartApi) => {
    setChartApi((prev) => (prev === chart ? prev : chart));
  }, []);

  const handlePrimaryMainSeriesReady = useCallback(
    (series: ISeriesApi<SeriesType> | null) => {
      setMainSeries((prev) => (prev === series ? prev : series));
    },
    [],
  );

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded border p-6" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="text-center">
          <p className="mb-2 text-sm" style={{ color: "var(--destructive)" }}>
            {error}
          </p>
          <p className="ds-type-label" style={{ color: "var(--muted-foreground)" }}>
            심볼명 또는 네트워크 연결을 확인해 주세요
          </p>
        </div>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded border p-6" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="text-center">
          <div
            className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            데이터 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded border"
      style={{
        borderColor: "var(--border)",
        background: "var(--card)",
      }}
    >
      {isLoading && (
        <div
          className="h-0.5 w-full overflow-hidden"
          style={{ background: "var(--secondary)" }}
        >
          <div
            className="h-full animate-pulse"
            style={{ background: "var(--primary)", width: "40%" }}
          />
        </div>
      )}
      <CrosshairLegend />
      {multiChartLayout === 1 && <DrawingToolbar />}
      <ChartToolbar />
      <ChartContextMenu />
      <ReplayControls />
      {multiChartLayout === 1 && <SignalZonesOverlay chart={chartApi} data={data} />}
      {multiChartLayout === 1 && <VolumeProfileOverlay data={data} />}
      {multiChartLayout === 1 && <FundamentalsOverlay />}
      {multiChartLayout === 1 && <DrawingCanvas chart={chartApi} mainSeries={mainSeries} />}
      {multiChartLayout === 1 && bandLayouts.length > 0 && (
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
                borderColor: `color-mix(in srgb, ${band.color} 30%, var(--border))`,
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
      <div
        className={multiChartLayout === 1 ? "flex-1 min-h-0" : "flex-1 min-h-0 grid gap-1 p-1"}
        style={
          multiChartLayout === 1
            ? undefined
            : {
                gridTemplateColumns: multiChartLayout === 4 ? "1fr 1fr" : "1fr 1fr",
                gridTemplateRows: multiChartLayout === 4 ? "1fr 1fr" : "1fr",
              }
        }
      >
        {chartSlots.map((slotIndex) => (
          <div
            key={`chart-slot-${slotIndex}`}
            className="h-full w-full min-h-0 overflow-hidden rounded"
            data-chart-area
          >
            <MainChart
              data={data}
              onChartReady={slotIndex === 0 ? handlePrimaryChartReady : undefined}
              onMainSeriesReady={slotIndex === 0 ? handlePrimaryMainSeriesReady : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
