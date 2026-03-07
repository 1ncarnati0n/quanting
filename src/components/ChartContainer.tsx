import { useCallback, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import MainChart from "./MainChart";
import CrosshairLegend from "./CrosshairLegend";
import ChartContextMenu from "./ChartContextMenu";
import DrawingCanvas from "./DrawingCanvas";
import ReplayControls from "./ReplayControls";
import SignalZonesOverlay from "./SignalZonesOverlay";
import VolumeProfileOverlay from "./VolumeProfileOverlay";
import FundamentalsOverlay from "./FundamentalsOverlay";
import StatePanel from "./patterns/StatePanel";
import { useChartStore } from "../stores/useChartStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { computeIndicatorBandLayout } from "../utils/indicatorBandLayout";
import { buildAnalysisParams } from "../utils/analysisParams";
import {
  LOWER_INDICATOR_LAYOUT_OPTIONS,
  getActiveLowerIndicatorPaneSummaries,
} from "../utils/lowerIndicatorPanes";
import type { IChartApi, ISeriesApi, SeriesType } from "lightweight-charts";

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
    indicators,
  } = useSettingsStore(
    useShallow((state) => ({
      multiChartLayout: state.multiChartLayout,
      symbol: state.symbol,
      interval: state.interval,
      market: state.market,
      indicators: state.indicators,
    })),
  );
  const [chartApi, setChartApi] = useState<IChartApi | null>(null);
  const [mainSeries, setMainSeries] = useState<ISeriesApi<SeriesType> | null>(null);

  const bands = useMemo(
    () => getActiveLowerIndicatorPaneSummaries(indicators, data),
    [data, indicators],
  );

  const bandLayouts = useMemo(() => {
    if (bands.length === 0) return [];

    return computeIndicatorBandLayout(
      bands,
      indicators.layout.priceAreaRatio,
      LOWER_INDICATOR_LAYOUT_OPTIONS,
    ).bands.filter((band) => Number.isFinite(band.top) && Number.isFinite(band.height));
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
      className="chart-workspace relative isolate flex h-full w-full flex-col overflow-hidden"
      style={{
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
        className={multiChartLayout === 1 ? "flex-1 min-h-0 pt-4" : "flex-1 min-h-0 grid gap-1 p-1 pt-4"}
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
