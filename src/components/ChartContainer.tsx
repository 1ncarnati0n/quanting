import { useCallback, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
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
import StatePanel from "./patterns/StatePanel";
import { useChartStore } from "../stores/useChartStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { calculateRvol } from "../utils/rvol";
import { computeIndicatorBandLayout } from "../utils/indicatorBandLayout";
import { buildAnalysisParams } from "../utils/analysisParams";
import type { IChartApi, ISeriesApi, SeriesType } from "lightweight-charts";

type OverlayBand = {
  id: "volume" | "rsi" | "macd" | "stoch" | "obv" | "atr" | "rvol";
  label: string;
  color: string;
  weight: number;
  value: string;
};

export default function ChartContainer() {
  const { data, isLoading, error, fetchData } = useChartStore(
    useShallow((state) => ({
      data: state.data,
      isLoading: state.isLoading,
      error: state.error,
      fetchData: state.fetchData,
    })),
  );
  const {
    multiChartLayout,
    symbol,
    interval,
    market,
    volumeIndicator,
    rsiIndicator,
    macdIndicator,
    stochasticIndicator,
    obvIndicator,
    atrIndicator,
    rvolIndicator,
    indicatorLayout,
  } = useSettingsStore(
    useShallow((state) => ({
      multiChartLayout: state.multiChartLayout,
      symbol: state.symbol,
      interval: state.interval,
      market: state.market,
      volumeIndicator: state.indicators.volume,
      rsiIndicator: state.indicators.rsi,
      macdIndicator: state.indicators.macd,
      stochasticIndicator: state.indicators.stochastic,
      obvIndicator: state.indicators.obv,
      atrIndicator: state.indicators.atr,
      rvolIndicator: state.indicators.rvol,
      indicatorLayout: state.indicators.layout,
    })),
  );
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

    if (volumeIndicator.enabled) {
      next.push({
        id: "volume",
        label: "거래량",
        color: "var(--success)",
        weight: Math.max(0.2, indicatorLayout.volumeWeight),
        value: lastCandle ? compactFormatter.format(lastCandle.volume) : "-",
      });
    }

    if (rsiIndicator.enabled) {
      next.push({
        id: "rsi",
        label: "RSI",
        color: "#A78BFA",
        weight: Math.max(0.2, indicatorLayout.rsiWeight),
        value: lastRsi ? lastRsi.value.toFixed(1) : "-",
      });
    }

    if (macdIndicator.enabled) {
      next.push({
        id: "macd",
        label: "MACD",
        color: "var(--primary)",
        weight: Math.max(0.2, indicatorLayout.macdWeight),
        value: lastMacd ? `${lastMacd.macd.toFixed(2)} / ${lastMacd.signal.toFixed(2)}` : "-",
      });
    }

    if (stochasticIndicator.enabled) {
      next.push({
        id: "stoch",
        label: "STOCH",
        color: "#F59E0B",
        weight: Math.max(0.2, indicatorLayout.stochasticWeight),
        value: lastStoch ? `${lastStoch.k.toFixed(1)} / ${lastStoch.d.toFixed(1)}` : "-",
      });
    }

    if (obvIndicator.enabled) {
      next.push({
        id: "obv",
        label: "OBV",
        color: "#14B8A6",
        weight: Math.max(0.2, indicatorLayout.obvWeight),
        value: lastObv ? compactFormatter.format(lastObv.value) : "-",
      });
    }

    if (atrIndicator.enabled) {
      next.push({
        id: "atr",
        label: "ATR",
        color: "#38BDF8",
        weight: Math.max(0.2, indicatorLayout.atrWeight),
        value: lastAtr ? lastAtr.value.toFixed(2) : "-",
      });
    }

    if (rvolIndicator.enabled) {
      const candles = data?.candles ?? [];
      const rvolData = calculateRvol(candles, rvolIndicator.period);
      const lastRvol = rvolData[rvolData.length - 1];
      next.push({
        id: "rvol",
        label: "RVOL",
        color: "#F59E0B",
        weight: Math.max(0.2, indicatorLayout.rvolWeight),
        value: lastRvol ? `${lastRvol.value.toFixed(2)}x` : "-",
      });
    }

    return next;
  }, [
    atrIndicator.enabled,
    compactFormatter,
    data,
    indicatorLayout.atrWeight,
    indicatorLayout.macdWeight,
    indicatorLayout.obvWeight,
    indicatorLayout.rsiWeight,
    indicatorLayout.rvolWeight,
    indicatorLayout.stochasticWeight,
    indicatorLayout.volumeWeight,
    macdIndicator.enabled,
    obvIndicator.enabled,
    rsiIndicator.enabled,
    rvolIndicator.enabled,
    rvolIndicator.period,
    stochasticIndicator.enabled,
    volumeIndicator.enabled,
  ]);

  const bandLayouts = useMemo(() => {
    if (bands.length === 0) return [];

    return computeIndicatorBandLayout(
      bands,
      indicatorLayout.priceAreaRatio,
      {
        minMainRegionTop: 0.35,
        maxMainRegionTop: 0.85,
        splitGap: 0.006,
        oscBottomMargin: 0.02,
        minBandHeight: 0.028,
      },
    ).bands.filter((band) => Number.isFinite(band.top) && Number.isFinite(band.height));
  }, [bands, indicatorLayout.priceAreaRatio]);

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

  const retryFetch = useCallback(() => {
    const currentIndicators = useSettingsStore.getState().indicators;
    fetchData(
      buildAnalysisParams({
        symbol,
        interval,
        market,
        indicators: currentIndicators,
      }),
    );
  }, [fetchData, interval, market, symbol]);

  if (error) {
    return (
      <StatePanel
        variant="error"
        title={error}
        description="심볼명 또는 네트워크 연결을 확인한 뒤 다시 시도해 주세요."
        actionLabel="다시 시도"
        onAction={retryFetch}
        className="h-full w-full flex items-center justify-center"
      />
    );
  }

  if (isLoading && !data) {
    return (
      <StatePanel
        variant="loading"
        title="데이터를 불러오는 중입니다"
        description="시장 데이터와 지표를 동기화하고 있어요."
        className="h-full w-full flex items-center justify-center"
      />
    );
  }

  return (
    <div
      className="chart-workspace relative isolate flex h-full w-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+0.15rem)] border"
      style={{
        borderColor: "var(--border)",
        background: "var(--card)",
      }}
    >
      <div aria-hidden className="chart-workspace__backdrop" />
      {isLoading && (
        <div
          className="chart-workspace__loading-track h-0.5 w-full overflow-hidden"
          style={{ background: "var(--secondary)" }}
        >
          <div
            className="chart-workspace__loading-bar h-full animate-pulse"
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
        className={multiChartLayout === 1 ? "flex-1 min-h-0 pt-10" : "flex-1 min-h-0 grid gap-1 p-1 pt-10"}
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
