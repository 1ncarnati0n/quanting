import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useShallow } from "zustand/react/shallow";
import type { IChartApi, ISeriesApi, SeriesType } from "lightweight-charts";
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
import { buildAnalysisParams } from "../utils/analysisParams";
import { CHART_PRICE_SCALE_WIDTH } from "../utils/constants";
import {
  computeLowerIndicatorPaneRatios,
  getActiveLowerIndicatorPaneConfigs,
  getActiveLowerIndicatorPaneSummaries,
  getLowerIndicatorLayoutKey,
  getLowerIndicatorToggleKey,
  type LowerIndicatorPaneId,
} from "../utils/lowerIndicatorPanes";

const MAIN_MIN_RATIO = 0.35;
const MAIN_MAX_RATIO = 0.85;
const LOWER_MIN_RATIO = 0.06;
const RESIZER_HEIGHT = 14;
const RESIZER_HALF_HEIGHT = RESIZER_HEIGHT / 2;

type PaneMetric = {
  id: "main" | LowerIndicatorPaneId;
  paneIndex: number;
  top: number;
  height: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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
    setIndicator,
  } = useSettingsStore(
    useShallow((state) => ({
      multiChartLayout: state.multiChartLayout,
      symbol: state.symbol,
      interval: state.interval,
      market: state.market,
      indicators: state.indicators,
      setIndicator: state.setIndicator,
    })),
  );

  const [chartApi, setChartApi] = useState<IChartApi | null>(null);
  const [mainSeries, setMainSeries] = useState<ISeriesApi<SeriesType> | null>(null);
  const [paneMetrics, setPaneMetrics] = useState<PaneMetric[]>([]);
  const [activeResizerId, setActiveResizerId] = useState<string | null>(null);
  const chartHostRef = useRef<HTMLDivElement>(null);

  const lowerPaneSummaries = useMemo(
    () => getActiveLowerIndicatorPaneSummaries(indicators, data),
    [data, indicators],
  );

  const lowerPaneConfigs = useMemo(
    () => getActiveLowerIndicatorPaneConfigs(indicators),
    [indicators],
  );

  const paneEntries = useMemo(() => {
    const summaryMap = new Map(lowerPaneSummaries.map((pane) => [pane.id, pane] as const));
    return lowerPaneConfigs
      .map((config) => {
        const summary = summaryMap.get(config.id);
        if (!summary) return null;
        return { ...config, summary };
      })
      .filter((pane): pane is NonNullable<typeof pane> => pane !== null);
  }, [lowerPaneConfigs, lowerPaneSummaries]);

  const paneRatioState = useMemo(
    () => computeLowerIndicatorPaneRatios(indicators.layout.priceAreaRatio, paneEntries),
    [indicators.layout.priceAreaRatio, paneEntries],
  );

  const chartSlots = useMemo(() => {
    if (multiChartLayout === 4) return [0, 1, 2, 3];
    if (multiChartLayout === 2) return [0, 1];
    return [0];
  }, [multiChartLayout]);

  const handlePrimaryChartReady = useCallback((chart: IChartApi) => {
    setChartApi((prev) => (prev === chart ? prev : chart));
  }, []);

  const handlePrimaryMainSeriesReady = useCallback((series: ISeriesApi<SeriesType> | null) => {
    setMainSeries((prev) => (prev === series ? prev : series));
  }, []);

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

  const applyPaneResize = useCallback(
    (
      event: ReactPointerEvent<HTMLButtonElement>,
      config:
        | { kind: "main"; bottomPaneId: LowerIndicatorPaneId }
        | { kind: "lower"; leftPaneId: LowerIndicatorPaneId; rightPaneId: LowerIndicatorPaneId },
    ) => {
      if (!chartHostRef.current) return;

      event.preventDefault();
      const hostHeight = Math.max(chartHostRef.current.clientHeight, 1);
      const startY = event.clientY;
      const startMainRatio = paneRatioState.mainRatio;

      const move = (moveEvent: PointerEvent) => {
        const deltaRatio = (moveEvent.clientY - startY) / hostHeight;

        if (config.kind === "main") {
          setIndicator("layout", {
            priceAreaRatio: clamp(startMainRatio + deltaRatio, MAIN_MIN_RATIO, MAIN_MAX_RATIO),
          });
          return;
        }

        const leftLayoutKey = getLowerIndicatorLayoutKey(config.leftPaneId);
        const rightLayoutKey = getLowerIndicatorLayoutKey(config.rightPaneId);
        const startLeftRatio = paneRatioState.paneRatios.get(config.leftPaneId) ?? 0;
        const startRightRatio = paneRatioState.paneRatios.get(config.rightPaneId) ?? 0;
        const pairRatio = startLeftRatio + startRightRatio;

        if (!leftLayoutKey || !rightLayoutKey || pairRatio <= LOWER_MIN_RATIO * 2) return;

        const nextLeftRatio = clamp(
          startLeftRatio + deltaRatio,
          LOWER_MIN_RATIO,
          pairRatio - LOWER_MIN_RATIO,
        );
        const leftWeight = indicators.layout[leftLayoutKey];
        const rightWeight = indicators.layout[rightLayoutKey];
        const nextLeftWeight = ((leftWeight + rightWeight) * nextLeftRatio) / pairRatio;
        const nextRightWeight = Math.max(0.2, leftWeight + rightWeight - nextLeftWeight);

        setIndicator("layout", {
          [leftLayoutKey]: Math.max(0.2, nextLeftWeight),
          [rightLayoutKey]: nextRightWeight,
        } as Partial<typeof indicators.layout>);
      };

      const up = () => {
        setActiveResizerId(null);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };

      setActiveResizerId(
        config.kind === "main" ? `main-${config.bottomPaneId}` : `${config.leftPaneId}-${config.rightPaneId}`,
      );
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [indicators.layout, paneRatioState, setIndicator],
  );

  const handleDisableLowerPane = useCallback(
    (paneId: LowerIndicatorPaneId) => {
      const toggleKey = getLowerIndicatorToggleKey(paneId);
      if (!toggleKey) return;
      setIndicator(toggleKey, { enabled: false } as never);
    },
    [setIndicator],
  );

  useEffect(() => {
    if (multiChartLayout !== 1 || !chartApi) {
      setPaneMetrics([]);
      return;
    }

    const chartElement = chartApi.chartElement();
    if (!chartElement) {
      setPaneMetrics([]);
      return;
    }

    let frame = 0;
    const measure = () => {
      if (!chartApi) return;
      const containerRect = chartElement.getBoundingClientRect();
      const nextMetrics = chartApi.panes()
        .map((pane, index) => {
          const element = pane.getHTMLElement();
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return {
            id: index === 0 ? "main" : paneEntries[index - 1]?.id ?? "main",
            paneIndex: index,
            top: rect.top - containerRect.top,
            height: rect.height,
          };
        })
        .filter((pane): pane is PaneMetric => pane !== null);
      setPaneMetrics(nextMetrics);
    };

    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(chartElement);
    chartApi.panes().forEach((pane) => {
      const element = pane.getHTMLElement();
      if (element) observer.observe(element);
    });

    window.addEventListener("resize", scheduleMeasure);
    scheduleMeasure();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [
    chartApi,
    indicators.layout.priceAreaRatio,
    multiChartLayout,
    paneEntries,
    lowerPaneSummaries,
  ]);

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

  const renderMainPane = multiChartLayout === 1;
  const mainPaneMetric = paneMetrics.find((pane) => pane.id === "main") ?? null;
  const panePlotInsetRight = CHART_PRICE_SCALE_WIDTH + 10;

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

      {renderMainPane ? (
        <div ref={chartHostRef} className="relative flex-1 min-h-0 pt-4" data-chart-area>
          <MainChart
            data={data}
            onChartReady={handlePrimaryChartReady}
            onMainSeriesReady={handlePrimaryMainSeriesReady}
          />
          <SignalZonesOverlay chart={chartApi} data={data} />
          <VolumeProfileOverlay data={data} />
          <FundamentalsOverlay />
          <DrawingCanvas chart={chartApi} mainSeries={mainSeries} />

          {mainPaneMetric && paneEntries.length > 0 ? (
            <button
              type="button"
              aria-label="메인 차트와 첫 번째 지표 패널 높이 조절"
              className={`chart-pane-resizer chart-pane-resizer--overlay${
                activeResizerId === `main-${paneEntries[0].id}` ? " is-active" : ""
              }`}
              style={{
                top: mainPaneMetric.top + mainPaneMetric.height - RESIZER_HALF_HEIGHT,
                right: panePlotInsetRight,
              }}
              onPointerDown={(event) =>
                applyPaneResize(event, { kind: "main", bottomPaneId: paneEntries[0].id })
              }
            />
          ) : null}

          {paneEntries.map((pane, index) => {
            const metric = paneMetrics.find((item) => item.id === pane.id);
            if (!metric) return null;
            const nextPane = paneEntries[index + 1];
            const overlayResizerId = nextPane ? `${pane.id}-${nextPane.id}` : null;
            const isCompact = metric.height < 68;
            const isCramped = metric.height < 48;

            return (
              <div key={pane.id}>
                <div
                  aria-hidden="true"
                  className="chart-pane__separator chart-pane__separator--overlay"
                  style={{
                    top: metric.top,
                    right: panePlotInsetRight,
                  }}
                />
                <div
                  className={`chart-pane__label${isCompact ? " is-compact" : ""}${isCramped ? " is-cramped" : ""}`}
                  style={{ top: metric.top + 7 }}
                >
                  <span className="chart-pane__label-title" style={{ color: pane.color }}>
                    {pane.label}
                  </span>
                  {pane.summary.detail ? (
                    <span className="chart-pane__label-meta">({pane.summary.detail})</span>
                  ) : null}
                  <span className="chart-pane__label-value">{pane.summary.value}</span>
                  <button
                    type="button"
                    className="chart-indicator-close-badge"
                    aria-label={`${pane.label} 지표 비활성화`}
                    title={`${pane.label} 지표 비활성화`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDisableLowerPane(pane.id);
                    }}
                  >
                    x
                  </button>
                </div>

                {nextPane ? (
                  <button
                    type="button"
                    aria-label={`${pane.label}와 ${nextPane.label} 패널 높이 조절`}
                    className={`chart-pane-resizer chart-pane-resizer--overlay${
                      activeResizerId === overlayResizerId ? " is-active" : ""
                    }`}
                    style={{
                      top: metric.top + metric.height - RESIZER_HALF_HEIGHT,
                      right: panePlotInsetRight,
                    }}
                    onPointerDown={(event) =>
                      applyPaneResize(event, {
                        kind: "lower",
                        leftPaneId: pane.id,
                        rightPaneId: nextPane.id,
                      })
                    }
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="flex-1 min-h-0 grid gap-1 p-1 pt-4"
          style={{
            gridTemplateColumns: multiChartLayout === 4 ? "1fr 1fr" : "1fr 1fr",
            gridTemplateRows: multiChartLayout === 4 ? "1fr 1fr" : "1fr",
          }}
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
      )}
    </div>
  );
}
