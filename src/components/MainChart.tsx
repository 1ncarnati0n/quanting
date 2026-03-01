import { useCallback, useEffect, useRef } from "react";
import {
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type SeriesType,
  type Time,
} from "lightweight-charts";
import type { AnalysisResponse, MarketType, SignalType } from "../types";
import {
  CHART_PRICE_SCALE_WIDTH,
  COLORS,
  MA_COLORS,
} from "../utils/constants";
import { formatPrice } from "../utils/formatters";
import { DEFAULTS } from "../utils/constants";
import {
  useSettingsStore,
  type ChartType,
  type PriceScaleMode,
} from "../stores/useSettingsStore";
import { useCrosshairStore } from "../stores/useCrosshairStore";
import { useReplayStore } from "../stores/useReplayStore";
import { fetchAnalysis } from "../services/tauriApi";

const SIGNAL_MARKERS: Record<
  SignalType,
  { position: "belowBar" | "aboveBar"; color: string; shape: "arrowUp" | "arrowDown"; text: string }
> = {
  strongBuy: { position: "belowBar", color: COLORS.strongBuy, shape: "arrowUp", text: "강" },
  weakBuy: { position: "belowBar", color: COLORS.weakBuy, shape: "arrowUp", text: "약" },
  strongSell: { position: "aboveBar", color: COLORS.strongSell, shape: "arrowDown", text: "강" },
  weakSell: { position: "aboveBar", color: COLORS.weakSell, shape: "arrowDown", text: "약" },
  macdBullish: { position: "belowBar", color: COLORS.macdBullish, shape: "arrowUp", text: "MACD 상승" },
  macdBearish: { position: "aboveBar", color: COLORS.macdBearish, shape: "arrowDown", text: "MACD 하락" },
  stochOversold: { position: "belowBar", color: COLORS.stochOversold, shape: "arrowUp", text: "스토캐스틱 과매도" },
  stochOverbought: { position: "aboveBar", color: COLORS.stochOverbought, shape: "arrowDown", text: "스토캐스틱 과매수" },
};

interface MainChartProps {
  data: AnalysisResponse | null;
  onChartReady?: (chart: IChartApi) => void;
  onMainSeriesReady?: (series: ISeriesApi<SeriesType> | null) => void;
}

function toHeikinAshi(candles: AnalysisResponse["candles"]): AnalysisResponse["candles"] {
  if (candles.length === 0) return [];

  const result: AnalysisResponse["candles"] = [];
  let prevHaOpen = (candles[0].open + candles[0].close) / 2;
  let prevHaClose =
    (candles[0].open + candles[0].high + candles[0].low + candles[0].close) / 4;

  for (let i = 0; i < candles.length; i += 1) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? prevHaOpen : (prevHaOpen + prevHaClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    result.push({
      ...c,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
    });

    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }

  return result;
}

function calculateBollingerFromCandles(
  candles: AnalysisResponse["candles"],
  period: number,
  multiplier: number,
) {
  const output: { time: number; upper: number; middle: number; lower: number }[] = [];
  if (period <= 1 || candles.length < period) return output;

  for (let i = period - 1; i < candles.length; i += 1) {
    const window = candles.slice(i - period + 1, i + 1);
    const closes = window.map((c) => c.close);
    const mean = closes.reduce((sum, value) => sum + value, 0) / period;
    const variance = closes.reduce((sum, value) => sum + (value - mean) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);

    output.push({
      time: candles[i].time,
      upper: mean + multiplier * stdDev,
      middle: mean,
      lower: mean - multiplier * stdDev,
    });
  }

  return output;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function makePriceFormatter(market: MarketType) {
  return (price: number) => formatPrice(price, market);
}

function mapPriceScaleMode(mode: PriceScaleMode): 0 | 1 | 2 {
  if (mode === "logarithmic") return 1;
  if (mode === "percentage") return 2;
  return 0;
}

function clipByTime<T extends { time: number }>(items: T[], maxTime: number): T[] {
  if (!items.length) return items;
  return items.filter((item) => item.time <= maxTime);
}

type ChartPalette = {
  background: string;
  foreground: string;
  grid: string;
  border: string;
};

function readChartPalette(): ChartPalette {
  if (typeof window === "undefined") {
    return {
      background: "#0d1421",
      foreground: "#9eb0c8",
      grid: "#1b273b",
      border: "#2a3a56",
    };
  }
  const styles = window.getComputedStyle(document.documentElement);
  const value = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    background: value("--chart-bg", "#0d1421"),
    foreground: value("--chart-foreground", "#9eb0c8"),
    grid: value("--chart-grid", "#1b273b"),
    border: value("--chart-border", "#2a3a56"),
  };
}

/** Determine whether a chart type uses OHLC data */
function isOhlcType(ct: ChartType): boolean {
  return ct === "candlestick" || ct === "heikinAshi" || ct === "bar";
}

export default function MainChart({ data, onChartReady, onMainSeriesReady }: MainChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbMiddleRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<"Line"> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const dynamicSeriesRef = useRef<Map<string, ISeriesApi<SeriesType>>>(new Map());
  const compareSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const alertLinesRef = useRef<IPriceLine[]>([]);
  const resizeRafRef = useRef<number | null>(null);
  const prevDataScopeRef = useRef<string | null>(null);
  const crosshairRafRef = useRef<number | null>(null);

  const theme = useSettingsStore((s) => s.theme);
  const chartType = useSettingsStore((s) => s.chartType);
  const market = useSettingsStore((s) => s.market);
  const indicators = useSettingsStore((s) => s.indicators);
  const priceScale = useSettingsStore((s) => s.priceScale);
  const compare = useSettingsStore((s) => s.compare);
  const priceAlerts = useSettingsStore((s) => s.priceAlerts);
  const replayEnabled = useReplayStore((s) => s.enabled);
  const replayIndex = useReplayStore((s) => s.currentIndex);

  const clearDynamicSeries = useCallback(() => {
    if (!chartRef.current) return;
    for (const series of dynamicSeriesRef.current.values()) {
      try {
        chartRef.current.removeSeries(series);
      } catch {}
    }
    dynamicSeriesRef.current.clear();
  }, []);

  const applyIndicatorScaleLayout = useCallback(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;

    const bandConfigs: { id: string; weight: number }[] = [];
    if (indicators.volume.enabled) {
      bandConfigs.push({ id: "volume", weight: Math.max(0.2, indicators.layout.volumeWeight) });
    }
    if (indicators.rsi.enabled) {
      bandConfigs.push({ id: "rsi", weight: Math.max(0.2, indicators.layout.rsiWeight) });
    }
    if (indicators.macd.enabled) {
      bandConfigs.push({ id: "macd", weight: Math.max(0.2, indicators.layout.macdWeight) });
    }
    if (indicators.stochastic.enabled) {
      bandConfigs.push({ id: "stoch", weight: Math.max(0.2, indicators.layout.stochasticWeight) });
    }
    if (indicators.obv.enabled) {
      bandConfigs.push({ id: "obv", weight: Math.max(0.2, indicators.layout.obvWeight) });
    }
    if (indicators.atr.enabled) {
      bandConfigs.push({ id: "atr", weight: Math.max(0.2, indicators.layout.atrWeight) });
    }
    if (indicators.mfi.enabled) {
      bandConfigs.push({ id: "mfi", weight: Math.max(0.2, indicators.layout.mfiWeight) });
    }
    if (indicators.cmf.enabled) {
      bandConfigs.push({ id: "cmf", weight: Math.max(0.2, indicators.layout.cmfWeight) });
    }
    if (indicators.choppiness.enabled) {
      bandConfigs.push({ id: "chop", weight: Math.max(0.2, indicators.layout.chopWeight) });
    }
    if (indicators.williamsR.enabled) {
      bandConfigs.push({ id: "willr", weight: Math.max(0.2, indicators.layout.willrWeight) });
    }
    if (indicators.adx.enabled) {
      bandConfigs.push({ id: "adx", weight: Math.max(0.2, indicators.layout.adxWeight) });
    }
    if (indicators.cvd.enabled) {
      bandConfigs.push({ id: "cvd", weight: Math.max(0.2, indicators.layout.cvdWeight) });
    }
    if (indicators.stc.enabled) {
      bandConfigs.push({ id: "stc", weight: Math.max(0.2, indicators.layout.stcWeight) });
    }

    if (bandConfigs.length === 0) {
      chart.priceScale("right").applyOptions({
        scaleMargins: { top: 0.03, bottom: 0.03 },
      });
      return;
    }

    const regionTop = clamp(indicators.layout.priceAreaRatio, 0.35, 0.85);
    const regionBottom = 0.02;
    const regionHeight = Math.max(0.08, 1 - regionTop - regionBottom);
    const totalWeight = bandConfigs.reduce((sum, band) => sum + band.weight, 0);

    chart.priceScale("right").applyOptions({
      scaleMargins: { top: 0.03, bottom: 1 - regionTop + 0.01 },
    });

    let cursorTop = regionTop;
    bandConfigs.forEach((band, idx) => {
      const isLast = idx === bandConfigs.length - 1;
      const bandHeight = isLast
        ? Math.max(0.01, 1 - regionBottom - cursorTop)
        : regionHeight * (band.weight / Math.max(0.0001, totalWeight));
      const top = clamp(cursorTop, 0.01, 0.95);
      const bottom = clamp(1 - (cursorTop + bandHeight), 0.01, 0.95);
      try {
        chart.priceScale(band.id).applyOptions({
          scaleMargins: { top, bottom },
        });
      } catch {}
      cursorTop += bandHeight;
    });
  }, [
    indicators.layout.macdWeight,
    indicators.layout.obvWeight,
    indicators.layout.priceAreaRatio,
    indicators.layout.rsiWeight,
    indicators.layout.stochasticWeight,
    indicators.layout.volumeWeight,
    indicators.layout.atrWeight,
    indicators.layout.mfiWeight,
    indicators.layout.cmfWeight,
    indicators.layout.chopWeight,
    indicators.layout.willrWeight,
    indicators.layout.adxWeight,
    indicators.layout.cvdWeight,
    indicators.layout.stcWeight,
    indicators.atr.enabled,
    indicators.macd.enabled,
    indicators.obv.enabled,
    indicators.rsi.enabled,
    indicators.stochastic.enabled,
    indicators.volume.enabled,
    indicators.mfi.enabled,
    indicators.cmf.enabled,
    indicators.choppiness.enabled,
    indicators.williamsR.enabled,
    indicators.adx.enabled,
    indicators.cvd.enabled,
    indicators.stc.enabled,
  ]);

  // Stable refs to break dependency chains — prevents chart recreation on indicator changes
  const applyLayoutRef = useRef(applyIndicatorScaleLayout);
  applyLayoutRef.current = applyIndicatorScaleLayout;

  const dataRef = useRef(data);
  dataRef.current = data;

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }
    dynamicSeriesRef.current.clear();
    compareSeriesRef.current = null;
    alertLinesRef.current = [];
    prevDataScopeRef.current = null;

    const palette = readChartPalette();
    const ps = useSettingsStore.getState().priceScale;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: palette.background },
        textColor: palette.foreground,
      },
      grid: {
        vertLines: { color: palette.grid },
        horzLines: { color: palette.grid },
      },
      crosshair: { mode: 0 },
      rightPriceScale: {
        borderColor: palette.border,
        minimumWidth: CHART_PRICE_SCALE_WIDTH,
        mode: mapPriceScaleMode(ps.mode),
        autoScale: ps.autoScale,
        invertScale: ps.invertScale,
      },
      leftPriceScale: { visible: false },
      timeScale: {
        visible: true,
        borderColor: palette.border,
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        priceFormatter: makePriceFormatter(useSettingsStore.getState().market),
      },
    });

    // Create main series based on chart type
    const currentChartType = useSettingsStore.getState().chartType;
    let mainSeries: ISeriesApi<SeriesType>;

    if (currentChartType === "line") {
      mainSeries = chart.addSeries(LineSeries, {
        color: COLORS.candleUp,
        lineWidth: 2,
        priceLineVisible: true,
        crosshairMarkerVisible: true,
      });
    } else if (currentChartType === "area") {
      mainSeries = chart.addSeries(AreaSeries, {
        lineColor: COLORS.candleUp,
        topColor: "rgba(34,197,94,0.4)",
        bottomColor: "rgba(34,197,94,0.04)",
        lineWidth: 2,
        priceLineVisible: true,
        crosshairMarkerVisible: true,
      });
    } else if (currentChartType === "bar") {
      mainSeries = chart.addSeries(BarSeries, {
        upColor: COLORS.candleUp,
        downColor: COLORS.candleDown,
      });
    } else {
      // candlestick or heikinAshi
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: COLORS.candleUp,
        downColor: COLORS.candleDown,
        borderUpColor: COLORS.candleUp,
        borderDownColor: COLORS.candleDown,
        wickUpColor: COLORS.candleUp,
        wickDownColor: COLORS.candleDown,
      });
    }

    const bbUpper = chart.addSeries(LineSeries, {
      color: COLORS.bbUpper,
      lineWidth: 1,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });
    const bbMiddle = chart.addSeries(LineSeries, {
      color: COLORS.bbMiddle,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });
    const bbLower = chart.addSeries(LineSeries, {
      color: COLORS.bbLower,
      lineWidth: 1,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    mainSeriesRef.current = mainSeries;
    onMainSeriesReady?.(mainSeries);
    bbUpperRef.current = bbUpper;
    bbMiddleRef.current = bbMiddle;
    bbLowerRef.current = bbLower;

    // Markers only for OHLC types
    if (isOhlcType(currentChartType)) {
      markersPluginRef.current = createSeriesMarkers(mainSeries as ISeriesApi<"Candlestick">);
    } else {
      markersPluginRef.current = null;
    }

    // Watermark disabled per user request

    // Crosshair subscription with RAF throttle
    const setCrosshairData = useCrosshairStore.getState().setData;
    chart.subscribeCrosshairMove((param) => {
      if (crosshairRafRef.current !== null) return;
      crosshairRafRef.current = requestAnimationFrame(() => {
        crosshairRafRef.current = null;
        if (!param.time || !param.seriesData) {
          // No crosshair — show last candle data
          const store = useCrosshairStore.getState();
          if (store.time === null) return;
          setCrosshairData({
            time: null,
            open: 0, high: 0, low: 0, close: 0, volume: 0,
            indicators: {},
          });
          return;
        }

        const mainData = param.seriesData.get(mainSeries);
        const indicatorValues: Record<string, string> = {};

        // Extract indicator values from dynamic series
        for (const [key, series] of dynamicSeriesRef.current) {
          const seriesData = param.seriesData.get(series);
          if (!seriesData) continue;
          if ("value" in seriesData && seriesData.value !== undefined) {
            indicatorValues[key] = (seriesData.value as number).toFixed(2);
          }
        }

        if (mainData) {
          if ("open" in mainData) {
            setCrosshairData({
              time: param.time as number,
              open: mainData.open as number,
              high: mainData.high as number,
              low: mainData.low as number,
              close: mainData.close as number,
              volume: 0, // volume from dynamic series
              indicators: indicatorValues,
            });
          } else if ("value" in mainData) {
            const val = mainData.value as number;
            setCrosshairData({
              time: param.time as number,
              open: val, high: val, low: val, close: val,
              volume: 0,
              indicators: indicatorValues,
            });
          }
        }
      });
    });

    applyLayoutRef.current();
    onChartReady?.(chart);
  }, [onChartReady, onMainSeriesReady, chartType]);

  // Chart lifecycle
  useEffect(() => {
    initChart();

    const container = containerRef.current;
    if (!container || !chartRef.current) return;

    const applySize = () => {
      if (!chartRef.current || !container) return;
      chartRef.current.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    const observer = new ResizeObserver(() => {
      if (resizeRafRef.current !== null) return;
      resizeRafRef.current = window.requestAnimationFrame(() => {
        resizeRafRef.current = null;
        applySize();
      });
    });
    observer.observe(container);
    applySize();

    // Custom event listeners for chart commands
    const onZoomIn = () => {
      if (!chartRef.current) return;
      const ts = chartRef.current.timeScale();
      const range = ts.getVisibleLogicalRange();
      if (!range) return;
      const span = range.to - range.from;
      const center = (range.from + range.to) / 2;
      const newSpan = span * 0.8;
      ts.setVisibleLogicalRange({ from: center - newSpan / 2, to: center + newSpan / 2 });
    };
    const onZoomOut = () => {
      if (!chartRef.current) return;
      const ts = chartRef.current.timeScale();
      const range = ts.getVisibleLogicalRange();
      if (!range) return;
      const span = range.to - range.from;
      const center = (range.from + range.to) / 2;
      const newSpan = span * 1.25;
      ts.setVisibleLogicalRange({ from: center - newSpan / 2, to: center + newSpan / 2 });
    };
    const onFitContent = () => {
      chartRef.current?.timeScale().fitContent();
    };
    const onScrollLeft = () => {
      if (!chartRef.current) return;
      const ts = chartRef.current.timeScale();
      const range = ts.getVisibleLogicalRange();
      if (!range) return;
      const shift = (range.to - range.from) * 0.1;
      ts.setVisibleLogicalRange({ from: range.from - shift, to: range.to - shift });
    };
    const onScrollRight = () => {
      if (!chartRef.current) return;
      const ts = chartRef.current.timeScale();
      const range = ts.getVisibleLogicalRange();
      if (!range) return;
      const shift = (range.to - range.from) * 0.1;
      ts.setVisibleLogicalRange({ from: range.from + shift, to: range.to + shift });
    };
    const onScreenshot = () => {
      if (!chartRef.current) return;
      const canvas = chartRef.current.takeScreenshot();
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const state = useSettingsStore.getState();
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `${state.symbol}_${state.interval}_${date}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    };
    const onSetTimeRange = (e: Event) => {
      if (!chartRef.current || !dataRef.current) return;
      const detail = (e as CustomEvent).detail as { from: number; to: number } | null;
      if (!detail) {
        chartRef.current.timeScale().fitContent();
        return;
      }
      const ts = chartRef.current.timeScale();
      const candles = dataRef.current.candles;
      if (candles.length === 0) return;

      // requested range보다 이전에만 데이터가 있으면 최근 데이터로 앵커링
      let toIdx = -1;
      for (let i = 0; i < candles.length; i++) {
        if (candles[candles.length - 1 - i].time <= detail.to) {
          toIdx = candles.length - 1 - i;
          break;
        }
      }
      if (toIdx < 0) {
        // 요청 범위가 데이터 시작 이전이면 가장 앞 구간으로 이동
        toIdx = 0;
      }

      let fromIdx = -1;
      for (let i = 0; i < candles.length; i++) {
        if (candles[i].time >= detail.from) {
          fromIdx = i;
          break;
        }
      }
      if (fromIdx < 0 || fromIdx > toIdx) {
        fromIdx = toIdx;
      }

      // 단일 봉만 잡히는 경우에도 최소 2봉은 보이게 보정
      const minBars = 2;
      if (toIdx - fromIdx + 1 < minBars) {
        fromIdx = Math.max(0, toIdx - (minBars - 1));
      }

      ts.setVisibleLogicalRange({
        from: fromIdx - 0.25,
        to: toIdx + 0.25,
      });
    };

    window.addEventListener("quanting:chart-zoom-in", onZoomIn);
    window.addEventListener("quanting:chart-zoom-out", onZoomOut);
    window.addEventListener("quanting:chart-fit", onFitContent);
    window.addEventListener("quanting:chart-scroll-left", onScrollLeft);
    window.addEventListener("quanting:chart-scroll-right", onScrollRight);
    window.addEventListener("quanting:chart-screenshot", onScreenshot);
    window.addEventListener("quanting:chart-set-time-range", onSetTimeRange);

    return () => {
      observer.disconnect();
      window.removeEventListener("quanting:chart-zoom-in", onZoomIn);
      window.removeEventListener("quanting:chart-zoom-out", onZoomOut);
      window.removeEventListener("quanting:chart-fit", onFitContent);
      window.removeEventListener("quanting:chart-scroll-left", onScrollLeft);
      window.removeEventListener("quanting:chart-scroll-right", onScrollRight);
      window.removeEventListener("quanting:chart-screenshot", onScreenshot);
      window.removeEventListener("quanting:chart-set-time-range", onSetTimeRange);
      if (resizeRafRef.current !== null) {
        window.cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
      if (crosshairRafRef.current !== null) {
        window.cancelAnimationFrame(crosshairRafRef.current);
        crosshairRafRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      onMainSeriesReady?.(null);
    };
  }, [initChart, onMainSeriesReady]);

  // Theme update
  useEffect(() => {
    if (!chartRef.current) return;
    const palette = readChartPalette();
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: palette.background },
        textColor: palette.foreground,
      },
      grid: {
        vertLines: { color: palette.grid },
        horzLines: { color: palette.grid },
      },
      rightPriceScale: { borderColor: palette.border },
      timeScale: { borderColor: palette.border },
    });
  }, [theme]);

  // Update priceFormatter when market changes
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      localization: { priceFormatter: makePriceFormatter(market) },
    });
  }, [market]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      rightPriceScale: {
        mode: mapPriceScaleMode(priceScale.mode),
        autoScale: priceScale.autoScale,
        invertScale: priceScale.invertScale,
      },
    });
  }, [priceScale.autoScale, priceScale.invertScale, priceScale.mode]);

  useEffect(() => {
    applyIndicatorScaleLayout();
  }, [applyIndicatorScaleLayout]);

  // Data effect
  useEffect(() => {
    if (!data || !chartRef.current || !mainSeriesRef.current) return;
    if (data.candles.length === 0) return;

    const chart = chartRef.current;

    // 뷰 상태 캡처 (setData/clearDynamicSeries 전)
    const savedRange = chart.timeScale().getVisibleLogicalRange();
    const currentScope = `${data.symbol}:${data.interval}:${chartType}:${replayEnabled ? "replay" : "live"}`;

    const cappedReplayIndex = replayEnabled
      ? Math.min(Math.max(replayIndex, 0), data.candles.length - 1)
      : data.candles.length - 1;
    const replayTime = data.candles[cappedReplayIndex]?.time ?? data.candles[data.candles.length - 1].time;
    const rawCandles = replayEnabled
      ? data.candles.slice(0, cappedReplayIndex + 1)
      : data.candles;
    const displayCandles = chartType === "heikinAshi" ? toHeikinAshi(rawCandles) : rawCandles;
    const filteredSignals = clipByTime(data.signals, replayTime);
    const filteredRsi = clipByTime(data.rsi, replayTime);
    const filteredSma = data.sma.map((ma) => ({ ...ma, data: clipByTime(ma.data, replayTime) }));
    const filteredEma = data.ema.map((ma) => ({ ...ma, data: clipByTime(ma.data, replayTime) }));
    const filteredMacd = data.macd
      ? { ...data.macd, data: clipByTime(data.macd.data, replayTime) }
      : null;
    const filteredStochastic = data.stochastic
      ? { ...data.stochastic, data: clipByTime(data.stochastic.data, replayTime) }
      : null;
    const filteredObv = data.obv
      ? { ...data.obv, data: clipByTime(data.obv.data, replayTime) }
      : null;
    const filteredVwap = data.vwap
      ? { ...data.vwap, data: clipByTime(data.vwap.data, replayTime) }
      : null;
    const filteredAtr = data.atr
      ? { ...data.atr, data: clipByTime(data.atr.data, replayTime) }
      : null;
    const filteredIchimoku = data.ichimoku
      ? { ...data.ichimoku, data: clipByTime(data.ichimoku.data, replayTime) }
      : null;
    const filteredSupertrend = data.supertrend
      ? { ...data.supertrend, data: clipByTime(data.supertrend.data, replayTime) }
      : null;
    const filteredPsar = data.parabolicSar
      ? { ...data.parabolicSar, data: clipByTime(data.parabolicSar.data, replayTime) }
      : null;
    const filteredDonchian = data.donchian
      ? { ...data.donchian, data: clipByTime(data.donchian.data, replayTime) }
      : null;
    const filteredKeltner = data.keltner
      ? { ...data.keltner, data: clipByTime(data.keltner.data, replayTime) }
      : null;
    const filteredHma = data.hma.map((ma) => ({ ...ma, data: clipByTime(ma.data, replayTime) }));
    const filteredMfi = data.mfi
      ? { ...data.mfi, data: clipByTime(data.mfi.data, replayTime) }
      : null;
    const filteredCmf = data.cmf
      ? { ...data.cmf, data: clipByTime(data.cmf.data, replayTime) }
      : null;
    const filteredChoppiness = data.choppiness
      ? { ...data.choppiness, data: clipByTime(data.choppiness.data, replayTime) }
      : null;
    const filteredWillr = data.williamsR
      ? { ...data.williamsR, data: clipByTime(data.williamsR.data, replayTime) }
      : null;
    const filteredAdx = data.adx
      ? { ...data.adx, data: clipByTime(data.adx.data, replayTime) }
      : null;
    const filteredCvd = data.cvd
      ? { ...data.cvd, data: clipByTime(data.cvd.data, replayTime) }
      : null;
    const filteredStc = data.stc
      ? { ...data.stc, data: clipByTime(data.stc.data, replayTime) }
      : null;
    const filteredSmc = data.smc
      ? { ...data.smc, data: clipByTime(data.smc.data, replayTime) }
      : null;
    const filteredAnchoredVwap = data.anchoredVwap
      ? { ...data.anchoredVwap, data: clipByTime(data.anchoredVwap.data, replayTime) }
      : null;

    // Set main series data based on chart type
    if (chartType === "line" || chartType === "area") {
      mainSeriesRef.current.setData(
        displayCandles.map((c) => ({
          time: c.time as Time,
          value: c.close,
        })),
      );
    } else {
      mainSeriesRef.current.setData(
        displayCandles.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })),
      );
    }

    const bollingerData =
      chartType === "heikinAshi"
        ? calculateBollingerFromCandles(
            displayCandles,
            indicators.bb.period,
            indicators.bb.multiplier,
          )
        : clipByTime(data.bollingerBands, replayTime);

    if (indicators.bb.enabled && bollingerData.length > 0) {
      bbUpperRef.current?.setData(
        bollingerData.map((b) => ({ time: b.time as Time, value: b.upper })),
      );
      bbMiddleRef.current?.setData(
        bollingerData.map((b) => ({ time: b.time as Time, value: b.middle })),
      );
      bbLowerRef.current?.setData(
        bollingerData.map((b) => ({ time: b.time as Time, value: b.lower })),
      );
    } else {
      bbUpperRef.current?.setData([]);
      bbMiddleRef.current?.setData([]);
      bbLowerRef.current?.setData([]);
    }

    clearDynamicSeries();

    if (indicators.sma.enabled && filteredSma.length > 0) {
      filteredSma.forEach((ma, idx) => {
        const series = chart.addSeries(LineSeries, {
          color: MA_COLORS[idx % MA_COLORS.length],
          lineWidth: 1,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          title: `SMA${ma.period}`,
        });
        series.setData(ma.data.map((p) => ({ time: p.time as Time, value: p.value })));
        dynamicSeriesRef.current.set(`sma-${ma.period}`, series as ISeriesApi<SeriesType>);
      });
    }

    if (indicators.ema.enabled && filteredEma.length > 0) {
      filteredEma.forEach((ma, idx) => {
        const series = chart.addSeries(LineSeries, {
          color: MA_COLORS[(idx + filteredSma.length) % MA_COLORS.length],
          lineWidth: 2,
          lineStyle: 0,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          title: `EMA${ma.period}`,
        });
        series.setData(ma.data.map((p) => ({ time: p.time as Time, value: p.value })));
        dynamicSeriesRef.current.set(`ema-${ma.period}`, series as ISeriesApi<SeriesType>);
      });
    }

    if (indicators.volume.enabled && displayCandles.length > 0) {
      const series = chart.addSeries(HistogramSeries, {
        priceScaleId: "volume",
        priceLineVisible: false,
        lastValueVisible: false,
      });
      series.setData(
        displayCandles.map((c) => ({
          time: c.time as Time,
          value: c.volume,
          color: c.close >= c.open ? COLORS.volumeUp : COLORS.volumeDown,
        })),
      );
      dynamicSeriesRef.current.set("volume", series as ISeriesApi<SeriesType>);
    }

    if (indicators.rsi.enabled && filteredRsi.length > 0) {
      const rsiSeries = chart.addSeries(LineSeries, {
        priceScaleId: "rsi",
        color: COLORS.rsiLine,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const overboughtSeries = chart.addSeries(LineSeries, {
        priceScaleId: "rsi",
        color: COLORS.rsiOverbought,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      const oversoldSeries = chart.addSeries(LineSeries, {
        priceScaleId: "rsi",
        color: COLORS.rsiOversold,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      rsiSeries.setData(filteredRsi.map((r) => ({ time: r.time as Time, value: r.value })));
      overboughtSeries.setData(filteredRsi.map((r) => ({ time: r.time as Time, value: 70 })));
      oversoldSeries.setData(filteredRsi.map((r) => ({ time: r.time as Time, value: 30 })));
      dynamicSeriesRef.current.set("rsi-line", rsiSeries as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("rsi-ob", overboughtSeries as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("rsi-os", oversoldSeries as ISeriesApi<SeriesType>);
    }

    if (indicators.macd.enabled && filteredMacd?.data.length) {
      const macdHist = chart.addSeries(HistogramSeries, {
        priceScaleId: "macd",
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const macdLine = chart.addSeries(LineSeries, {
        priceScaleId: "macd",
        color: COLORS.macdLine,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const signalLine = chart.addSeries(LineSeries, {
        priceScaleId: "macd",
        color: COLORS.macdSignal,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      macdHist.setData(
        filteredMacd.data.map((p) => ({
          time: p.time as Time,
          value: p.histogram,
          color: p.histogram >= 0 ? COLORS.macdHistUp : COLORS.macdHistDown,
        })),
      );
      macdLine.setData(filteredMacd.data.map((p) => ({ time: p.time as Time, value: p.macd })));
      signalLine.setData(filteredMacd.data.map((p) => ({ time: p.time as Time, value: p.signal })));
      dynamicSeriesRef.current.set("macd-h", macdHist as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("macd-l", macdLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("macd-s", signalLine as ISeriesApi<SeriesType>);
    }

    if (indicators.stochastic.enabled && filteredStochastic?.data.length) {
      const kLine = chart.addSeries(LineSeries, {
        priceScaleId: "stoch",
        color: COLORS.stochK,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const dLine = chart.addSeries(LineSeries, {
        priceScaleId: "stoch",
        color: COLORS.stochD,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const obLine = chart.addSeries(LineSeries, {
        priceScaleId: "stoch",
        color: COLORS.rsiOverbought,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      const osLine = chart.addSeries(LineSeries, {
        priceScaleId: "stoch",
        color: COLORS.rsiOversold,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      kLine.setData(filteredStochastic.data.map((p) => ({ time: p.time as Time, value: p.k })));
      dLine.setData(filteredStochastic.data.map((p) => ({ time: p.time as Time, value: p.d })));
      obLine.setData(filteredStochastic.data.map((p) => ({ time: p.time as Time, value: 80 })));
      osLine.setData(filteredStochastic.data.map((p) => ({ time: p.time as Time, value: 20 })));
      dynamicSeriesRef.current.set("stoch-k", kLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("stoch-d", dLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("stoch-ob", obLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("stoch-os", osLine as ISeriesApi<SeriesType>);
    }

    if (indicators.obv.enabled && filteredObv?.data.length) {
      const obvLine = chart.addSeries(LineSeries, {
        priceScaleId: "obv",
        color: "#14B8A6",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      obvLine.setData(filteredObv.data.map((p) => ({ time: p.time as Time, value: p.value })));
      dynamicSeriesRef.current.set("obv", obvLine as ISeriesApi<SeriesType>);
    }

    if (indicators.vwap.enabled && filteredVwap?.data.length) {
      const vwapLine = chart.addSeries(LineSeries, {
        color: "#06B6D4",
        lineWidth: 2,
        lineStyle: 2,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "VWAP",
      });
      vwapLine.setData(filteredVwap.data.map((p) => ({ time: p.time as Time, value: p.value })));
      dynamicSeriesRef.current.set("vwap", vwapLine as ISeriesApi<SeriesType>);
    }

    if (indicators.atr.enabled && filteredAtr?.data.length) {
      const atrLine = chart.addSeries(LineSeries, {
        priceScaleId: "atr",
        color: "#38BDF8",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        title: "ATR",
      });
      atrLine.setData(filteredAtr.data.map((p) => ({ time: p.time as Time, value: p.value })));
      dynamicSeriesRef.current.set("atr", atrLine as ISeriesApi<SeriesType>);
    }

    if (indicators.ichimoku.enabled && filteredIchimoku?.data.length) {
      const conversionLine = chart.addSeries(LineSeries, {
        color: "#F59E0B",
        lineWidth: 1,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "전환선",
      });
      const baseLine = chart.addSeries(LineSeries, {
        color: "#EF4444",
        lineWidth: 1,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "기준선",
      });
      const spanALine = chart.addSeries(LineSeries, {
        color: "rgba(34,197,94,0.8)",
        lineWidth: 1,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "선행A",
      });
      const spanBLine = chart.addSeries(LineSeries, {
        color: "rgba(239,68,68,0.8)",
        lineWidth: 1,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "선행B",
      });

      const conversionData = filteredIchimoku.data
        .filter((p) => p.conversion !== null)
        .map((p) => ({ time: p.time as Time, value: p.conversion as number }));
      const baseData = filteredIchimoku.data
        .filter((p) => p.base !== null)
        .map((p) => ({ time: p.time as Time, value: p.base as number }));
      const spanAData = filteredIchimoku.data
        .filter((p) => p.spanA !== null)
        .map((p) => ({ time: p.time as Time, value: p.spanA as number }));
      const spanBData = filteredIchimoku.data
        .filter((p) => p.spanB !== null)
        .map((p) => ({ time: p.time as Time, value: p.spanB as number }));

      conversionLine.setData(conversionData);
      baseLine.setData(baseData);
      spanALine.setData(spanAData);
      spanBLine.setData(spanBData);
      dynamicSeriesRef.current.set("ichi-conv", conversionLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("ichi-base", baseLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("ichi-a", spanALine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("ichi-b", spanBLine as ISeriesApi<SeriesType>);
    }

    if (indicators.supertrend.enabled && filteredSupertrend?.data.length) {
      const upLine = chart.addSeries(LineSeries, {
        color: "#22C55E",
        lineWidth: 2,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "Supertrend Up",
      });
      const downLine = chart.addSeries(LineSeries, {
        color: "#EF4444",
        lineWidth: 2,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "Supertrend Down",
      });

      const upData = filteredSupertrend.data.map((p) =>
        p.direction > 0
          ? ({ time: p.time as Time, value: p.value } as const)
          : ({ time: p.time as Time } as const),
      );
      const downData = filteredSupertrend.data.map((p) =>
        p.direction < 0
          ? ({ time: p.time as Time, value: p.value } as const)
          : ({ time: p.time as Time } as const),
      );

      upLine.setData(upData);
      downLine.setData(downData);
      dynamicSeriesRef.current.set("super-up", upLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("super-down", downLine as ISeriesApi<SeriesType>);
    }

    if (indicators.psar.enabled && filteredPsar?.data.length) {
      const psarLine = chart.addSeries(LineSeries, {
        color: "#F97316",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "PSAR",
      });
      psarLine.setData(
        filteredPsar.data.map((p) => ({ time: p.time as Time, value: p.value })),
      );
      dynamicSeriesRef.current.set("psar", psarLine as ISeriesApi<SeriesType>);
    }

    // --- Donchian Channels (Overlay, 3 lines) ---
    if (indicators.donchian.enabled && filteredDonchian?.data.length) {
      const donUpper = chart.addSeries(LineSeries, {
        color: COLORS.donchianUpper,
        lineWidth: 1,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "DC Upper",
      });
      const donMiddle = chart.addSeries(LineSeries, {
        color: COLORS.donchianMiddle,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "DC Mid",
      });
      const donLower = chart.addSeries(LineSeries, {
        color: COLORS.donchianLower,
        lineWidth: 1,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "DC Lower",
      });
      donUpper.setData(filteredDonchian.data.map((p) => ({ time: p.time as Time, value: p.upper })));
      donMiddle.setData(filteredDonchian.data.map((p) => ({ time: p.time as Time, value: p.middle })));
      donLower.setData(filteredDonchian.data.map((p) => ({ time: p.time as Time, value: p.lower })));
      dynamicSeriesRef.current.set("don-upper", donUpper as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("don-middle", donMiddle as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("don-lower", donLower as ISeriesApi<SeriesType>);
    }

    // --- Keltner Channels (Overlay, 3 lines) ---
    if (indicators.keltner.enabled && filteredKeltner?.data.length) {
      const kelUpper = chart.addSeries(LineSeries, {
        color: COLORS.keltnerUpper,
        lineWidth: 1,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "KC Upper",
      });
      const kelMiddle = chart.addSeries(LineSeries, {
        color: COLORS.keltnerMiddle,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "KC Mid",
      });
      const kelLower = chart.addSeries(LineSeries, {
        color: COLORS.keltnerLower,
        lineWidth: 1,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "KC Lower",
      });
      kelUpper.setData(filteredKeltner.data.map((p) => ({ time: p.time as Time, value: p.upper })));
      kelMiddle.setData(filteredKeltner.data.map((p) => ({ time: p.time as Time, value: p.middle })));
      kelLower.setData(filteredKeltner.data.map((p) => ({ time: p.time as Time, value: p.lower })));
      dynamicSeriesRef.current.set("kel-upper", kelUpper as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("kel-middle", kelMiddle as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("kel-lower", kelLower as ISeriesApi<SeriesType>);
    }

    // --- HMA (Overlay, same pattern as SMA/EMA) ---
    if (indicators.hma.enabled && filteredHma.length > 0) {
      filteredHma.forEach((ma, idx) => {
        const series = chart.addSeries(LineSeries, {
          color: MA_COLORS[(idx + filteredSma.length + filteredEma.length) % MA_COLORS.length],
          lineWidth: 2,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          title: `HMA${ma.period}`,
        });
        series.setData(ma.data.map((p) => ({ time: p.time as Time, value: p.value })));
        dynamicSeriesRef.current.set(`hma-${ma.period}`, series as ISeriesApi<SeriesType>);
      });
    }

    // --- MFI (Oscillator, 0-100) ---
    if (indicators.mfi.enabled && filteredMfi?.data.length) {
      const mfiLine = chart.addSeries(LineSeries, {
        priceScaleId: "mfi",
        color: COLORS.mfiLine,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const mfiOb = chart.addSeries(LineSeries, {
        priceScaleId: "mfi",
        color: COLORS.rsiOverbought,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      const mfiOs = chart.addSeries(LineSeries, {
        priceScaleId: "mfi",
        color: COLORS.rsiOversold,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      mfiLine.setData(filteredMfi.data.map((p) => ({ time: p.time as Time, value: p.value })));
      mfiOb.setData(filteredMfi.data.map((p) => ({ time: p.time as Time, value: 80 })));
      mfiOs.setData(filteredMfi.data.map((p) => ({ time: p.time as Time, value: 20 })));
      dynamicSeriesRef.current.set("mfi", mfiLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("mfi-ob", mfiOb as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("mfi-os", mfiOs as ISeriesApi<SeriesType>);
    }

    // --- CMF (Oscillator, -1~+1) ---
    if (indicators.cmf.enabled && filteredCmf?.data.length) {
      const cmfLine = chart.addSeries(LineSeries, {
        priceScaleId: "cmf",
        color: COLORS.cmfLine,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const cmfZero = chart.addSeries(LineSeries, {
        priceScaleId: "cmf",
        color: "#6B7280",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      cmfLine.setData(filteredCmf.data.map((p) => ({ time: p.time as Time, value: p.value })));
      cmfZero.setData(filteredCmf.data.map((p) => ({ time: p.time as Time, value: 0 })));
      dynamicSeriesRef.current.set("cmf", cmfLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("cmf-zero", cmfZero as ISeriesApi<SeriesType>);
    }

    // --- Choppiness Index (Oscillator, 0-100) ---
    if (indicators.choppiness.enabled && filteredChoppiness?.data.length) {
      const chopLine = chart.addSeries(LineSeries, {
        priceScaleId: "chop",
        color: COLORS.chopLine,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const chopHigh = chart.addSeries(LineSeries, {
        priceScaleId: "chop",
        color: "#6B7280",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      const chopLow = chart.addSeries(LineSeries, {
        priceScaleId: "chop",
        color: "#6B7280",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      chopLine.setData(filteredChoppiness.data.map((p) => ({ time: p.time as Time, value: p.value })));
      chopHigh.setData(filteredChoppiness.data.map((p) => ({ time: p.time as Time, value: 61.8 })));
      chopLow.setData(filteredChoppiness.data.map((p) => ({ time: p.time as Time, value: 38.2 })));
      dynamicSeriesRef.current.set("chop", chopLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("chop-hi", chopHigh as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("chop-lo", chopLow as ISeriesApi<SeriesType>);
    }

    // --- Williams %R (Oscillator, -100~0) ---
    if (indicators.williamsR.enabled && filteredWillr?.data.length) {
      const willrLine = chart.addSeries(LineSeries, {
        priceScaleId: "willr",
        color: COLORS.willrLine,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const willrOb = chart.addSeries(LineSeries, {
        priceScaleId: "willr",
        color: COLORS.rsiOverbought,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      const willrOs = chart.addSeries(LineSeries, {
        priceScaleId: "willr",
        color: COLORS.rsiOversold,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      willrLine.setData(filteredWillr.data.map((p) => ({ time: p.time as Time, value: p.value })));
      willrOb.setData(filteredWillr.data.map((p) => ({ time: p.time as Time, value: -20 })));
      willrOs.setData(filteredWillr.data.map((p) => ({ time: p.time as Time, value: -80 })));
      dynamicSeriesRef.current.set("willr", willrLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("willr-ob", willrOb as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("willr-os", willrOs as ISeriesApi<SeriesType>);
    }

    // --- ADX / DI+ / DI- (Oscillator, 3 lines) ---
    if (indicators.adx.enabled && filteredAdx?.data.length) {
      const adxLine = chart.addSeries(LineSeries, {
        priceScaleId: "adx",
        color: COLORS.adxLine,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "ADX",
      });
      const plusDiLine = chart.addSeries(LineSeries, {
        priceScaleId: "adx",
        color: COLORS.adxPlusDi,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "+DI",
      });
      const minusDiLine = chart.addSeries(LineSeries, {
        priceScaleId: "adx",
        color: COLORS.adxMinusDi,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "-DI",
      });
      const adx25 = chart.addSeries(LineSeries, {
        priceScaleId: "adx",
        color: "#6B7280",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      adxLine.setData(filteredAdx.data.map((p) => ({ time: p.time as Time, value: p.adx })));
      plusDiLine.setData(filteredAdx.data.map((p) => ({ time: p.time as Time, value: p.plusDi })));
      minusDiLine.setData(filteredAdx.data.map((p) => ({ time: p.time as Time, value: p.minusDi })));
      adx25.setData(filteredAdx.data.map((p) => ({ time: p.time as Time, value: 25 })));
      dynamicSeriesRef.current.set("adx", adxLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("adx-plus", plusDiLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("adx-minus", minusDiLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("adx-25", adx25 as ISeriesApi<SeriesType>);
    }

    // --- CVD (Oscillator, cumulative) ---
    if (indicators.cvd.enabled && filteredCvd?.data.length) {
      const cvdLine = chart.addSeries(LineSeries, {
        priceScaleId: "cvd",
        color: COLORS.cvdLine,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "CVD",
      });
      cvdLine.setData(filteredCvd.data.map((p) => ({ time: p.time as Time, value: p.value })));
      dynamicSeriesRef.current.set("cvd", cvdLine as ISeriesApi<SeriesType>);
    }

    // --- STC (Oscillator, 0-100) ---
    if (indicators.stc.enabled && filteredStc?.data.length) {
      const stcLine = chart.addSeries(LineSeries, {
        priceScaleId: "stc",
        color: COLORS.stcLine,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const stcHigh = chart.addSeries(LineSeries, {
        priceScaleId: "stc",
        color: "#6B7280",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      const stcLow = chart.addSeries(LineSeries, {
        priceScaleId: "stc",
        color: "#6B7280",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      stcLine.setData(filteredStc.data.map((p) => ({ time: p.time as Time, value: p.value })));
      stcHigh.setData(filteredStc.data.map((p) => ({ time: p.time as Time, value: 75 })));
      stcLow.setData(filteredStc.data.map((p) => ({ time: p.time as Time, value: 25 })));
      dynamicSeriesRef.current.set("stc", stcLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("stc-hi", stcHigh as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("stc-lo", stcLow as ISeriesApi<SeriesType>);
    }

    // --- SMC: BOS/CHoCH line segments ---
    if (indicators.smc.enabled && filteredSmc?.data.length) {
      filteredSmc.data.forEach((event, idx) => {
        const isBull = event.eventType.includes("bull");
        const isBos = event.eventType.startsWith("bos");
        const color = isBos
          ? (isBull ? COLORS.smcBosBull : COLORS.smcBosBear)
          : (isBull ? COLORS.smcChochBull : COLORS.smcChochBear);
        const line = chart.addSeries(LineSeries, {
          color,
          lineWidth: 2,
          lineStyle: isBos ? 0 : 2,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          title: idx === 0 ? (isBos ? "BOS" : "CHoCH") : "",
        });
        line.setData([
          { time: event.swingTime as Time, value: event.swingPrice },
          { time: event.time as Time, value: event.swingPrice },
        ]);
        dynamicSeriesRef.current.set(`smc-${idx}`, line as ISeriesApi<SeriesType>);
      });
    }

    // --- Anchored VWAP (Overlay line) ---
    if (indicators.anchoredVwap.enabled && filteredAnchoredVwap?.data.length) {
      const avwapLine = chart.addSeries(LineSeries, {
        color: COLORS.anchoredVwap,
        lineWidth: 2,
        lineStyle: 0,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: "AVWAP",
      });
      avwapLine.setData(
        filteredAnchoredVwap.data.map((p) => ({ time: p.time as Time, value: p.value })),
      );
      dynamicSeriesRef.current.set("avwap", avwapLine as ISeriesApi<SeriesType>);
    }

    // --- Auto Fibonacci (price lines on mainSeries) ---
    if (indicators.autoFib.enabled && data.autoFib && data.autoFib.levels.length > 0) {
      const fib = data.autoFib;
      // Draw fib levels as horizontal line series spanning from low_time to high_time
      const startTime = Math.min(fib.lowTime, fib.highTime);
      const endTime = Math.max(fib.lowTime, fib.highTime);
      const lastCandleTime = data.candles[data.candles.length - 1]?.time ?? endTime;
      const fibEnd = Math.max(endTime, lastCandleTime);

      fib.levels.forEach((level, idx) => {
        const alpha = level.ratio === 0 || level.ratio === 1 ? "CC" : "88";
        const fibLine = chart.addSeries(LineSeries, {
          color: COLORS.autoFib + alpha,
          lineWidth: level.ratio === 0.5 || level.ratio === 0.618 ? 2 : 1,
          lineStyle: 2,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          title: idx === 0 ? `Fib ${(level.ratio * 100).toFixed(1)}%` : `${(level.ratio * 100).toFixed(1)}%`,
        });
        fibLine.setData([
          { time: startTime as Time, value: level.price },
          { time: fibEnd as Time, value: level.price },
        ]);
        dynamicSeriesRef.current.set(`fib-${idx}`, fibLine as ISeriesApi<SeriesType>);
      });
    }

    applyIndicatorScaleLayout();

    if (markersPluginRef.current) {
      if (filteredSignals.length > 0) {
        const markers: SeriesMarker<Time>[] = filteredSignals
          .map((s) => {
            const config = SIGNAL_MARKERS[s.signalType];
            if (!config) return null;
            return {
              time: s.time as Time,
              position: config.position,
              color: config.color,
              shape: config.shape,
              text: config.text,
            } as SeriesMarker<Time>;
          })
          .filter((m): m is SeriesMarker<Time> => m !== null)
          .sort((a, b) => (a.time as number) - (b.time as number));
        markersPluginRef.current.setMarkers(markers);
      } else {
        markersPluginRef.current.setMarkers([]);
      }
    }

    // Set last candle to crosshair store
    const lastCandle = rawCandles[rawCandles.length - 1];
    if (lastCandle) {
      useCrosshairStore.getState().setData({
        time: null,
        open: lastCandle.open,
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close,
        volume: lastCandle.volume,
        indicators: {},
      });
    }

    const scopeChanged = prevDataScopeRef.current !== currentScope;
    prevDataScopeRef.current = currentScope;

    if (scopeChanged) {
      // symbol/interval 변경, replay 토글 → 전체 데이터 맞춤
      chart.timeScale().fitContent();
    } else if (savedRange) {
      // auto-refresh, WebSocket, indicator 변경 → 뷰 위치 복원
      const newBarCount = displayCandles.length;
      const wasAtTrailingEdge = savedRange.to >= newBarCount - 3;

      if (wasAtTrailingEdge) {
        // 최신 바를 보고 있었으면 → 새 바도 보이도록 shift
        const span = savedRange.to - savedRange.from;
        chart.timeScale().setVisibleLogicalRange({
          from: newBarCount - 1 - span,
          to: newBarCount - 1 + Math.max(0, savedRange.to - Math.floor(savedRange.to)),
        });
      } else {
        // 과거 영역을 보고 있었으면 → 정확히 같은 위치 복원
        chart.timeScale().setVisibleLogicalRange(savedRange);
      }
    }
  }, [
    applyIndicatorScaleLayout,
    chartType,
    clearDynamicSeries,
    data,
    indicators.bb.enabled,
    indicators.bb.multiplier,
    indicators.bb.period,
    indicators.ema.enabled,
    indicators.ichimoku.enabled,
    indicators.macd.enabled,
    indicators.obv.enabled,
    indicators.psar.enabled,
    indicators.rsi.enabled,
    indicators.sma.enabled,
    indicators.stochastic.enabled,
    indicators.supertrend.enabled,
    indicators.atr.enabled,
    indicators.volume.enabled,
    indicators.vwap.enabled,
    indicators.donchian.enabled,
    indicators.keltner.enabled,
    indicators.hma.enabled,
    indicators.mfi.enabled,
    indicators.cmf.enabled,
    indicators.choppiness.enabled,
    indicators.williamsR.enabled,
    indicators.adx.enabled,
    indicators.cvd.enabled,
    indicators.stc.enabled,
    indicators.smc.enabled,
    indicators.anchoredVwap.enabled,
    indicators.autoFib.enabled,
    replayEnabled,
    replayIndex,
  ]);

  useEffect(() => {
    const chart = chartRef.current;
    const mainSeries = mainSeriesRef.current;
    if (!chart || !mainSeries) return;

    for (const line of alertLinesRef.current) {
      try {
        mainSeries.removePriceLine(line);
      } catch {}
    }
    alertLinesRef.current = [];

    const currentSymbol = useSettingsStore.getState().symbol;
    const currentMarket = useSettingsStore.getState().market;
    const visibleAlerts = priceAlerts.filter(
      (alert) => alert.symbol === currentSymbol && alert.market === currentMarket,
    );

    for (const alert of visibleAlerts) {
      try {
        const line = mainSeries.createPriceLine({
          price: alert.price,
          color: alert.active ? "#F59E0B" : "rgba(148,163,184,0.9)",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: alert.active
            ? `알림 ${alert.condition === "above" ? "↑" : "↓"}`
            : "알림(완료)",
        });
        alertLinesRef.current.push(line);
      } catch {}
    }
  }, [priceAlerts]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !data) return;

    if (compareSeriesRef.current) {
      try {
        chart.removeSeries(compareSeriesRef.current);
      } catch {}
      compareSeriesRef.current = null;
    }

    if (!compare.enabled || !compare.symbol) return;
    if (compare.symbol === data.symbol && compare.market === market) return;

    let cancelled = false;

    const cappedReplayIndex = replayEnabled
      ? Math.min(Math.max(replayIndex, 0), data.candles.length - 1)
      : data.candles.length - 1;
    const replayMaxTime = data.candles[cappedReplayIndex]?.time ?? null;

    fetchAnalysis({
      symbol: compare.symbol,
      interval: data.interval,
      bbPeriod: DEFAULTS.bbPeriod,
      bbMultiplier: DEFAULTS.bbMultiplier,
      rsiPeriod: DEFAULTS.rsiPeriod,
      market: compare.market,
      smaPeriods: [],
      emaPeriods: [],
      macd: null,
      stochastic: null,
      showVolume: false,
      showObv: false,
      signalFilter: indicators.signalFilter,
    })
      .then((resp) => {
        if (cancelled || !chartRef.current) return;
        if (!resp.candles.length) return;
        const scopedCandles =
          replayMaxTime !== null
            ? resp.candles.filter((candle) => candle.time <= replayMaxTime)
            : resp.candles;
        if (!scopedCandles.length) return;

        const series = chartRef.current.addSeries(LineSeries, {
          color: "#94A3B8",
          lineWidth: 2,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          title: `비교:${compare.symbol}`,
          priceScaleId: compare.normalize ? "compare" : "right",
        });

        const base = scopedCandles[0].close;
        const compareData = scopedCandles.map((c) => ({
          time: c.time as Time,
          value:
            compare.normalize && Math.abs(base) > Number.EPSILON
              ? ((c.close - base) / base) * 100
              : c.close,
        }));
        series.setData(compareData);

        if (compare.normalize) {
          try {
            chartRef.current.priceScale("compare").applyOptions({
              visible: false,
              scaleMargins: { top: 0.03, bottom: 0.03 },
            });
          } catch {}
        }

        compareSeriesRef.current = series;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [
    compare.enabled,
    compare.market,
    compare.normalize,
    compare.symbol,
    data,
    indicators.signalFilter,
    market,
    replayEnabled,
    replayIndex,
  ]);

  return <div ref={containerRef} className="h-full w-full" />;
}
