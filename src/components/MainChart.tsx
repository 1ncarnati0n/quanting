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
  THEME_COLORS,
} from "../utils/constants";
import { formatPrice } from "../utils/formatters";
import { useSettingsStore, type ChartType } from "../stores/useSettingsStore";
import { useCrosshairStore } from "../stores/useCrosshairStore";

const SIGNAL_MARKERS: Record<
  SignalType,
  { position: "belowBar" | "aboveBar"; color: string; shape: "arrowUp" | "arrowDown"; text: string }
> = {
  strongBuy: { position: "belowBar", color: COLORS.strongBuy, shape: "arrowUp", text: "강매수" },
  weakBuy: { position: "belowBar", color: COLORS.weakBuy, shape: "arrowUp", text: "약매수" },
  strongSell: { position: "aboveBar", color: COLORS.strongSell, shape: "arrowDown", text: "강매도" },
  weakSell: { position: "aboveBar", color: COLORS.weakSell, shape: "arrowDown", text: "약매도" },
  macdBullish: { position: "belowBar", color: COLORS.macdBullish, shape: "arrowUp", text: "MACD 상승" },
  macdBearish: { position: "aboveBar", color: COLORS.macdBearish, shape: "arrowDown", text: "MACD 하락" },
  stochOversold: { position: "belowBar", color: COLORS.stochOversold, shape: "arrowUp", text: "스토캐스틱 과매도" },
  stochOverbought: { position: "aboveBar", color: COLORS.stochOverbought, shape: "arrowDown", text: "스토캐스틱 과매수" },
};

interface MainChartProps {
  data: AnalysisResponse | null;
  onChartReady?: (chart: IChartApi) => void;
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

/** Determine whether a chart type uses OHLC data */
function isOhlcType(ct: ChartType): boolean {
  return ct === "candlestick" || ct === "heikinAshi" || ct === "bar";
}

export default function MainChart({ data, onChartReady }: MainChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbMiddleRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<"Line"> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const dynamicSeriesRef = useRef<Map<string, ISeriesApi<SeriesType>>>(new Map());
  const resizeRafRef = useRef<number | null>(null);
  const fittedScopeRef = useRef<string | null>(null);
  const crosshairRafRef = useRef<number | null>(null);

  const theme = useSettingsStore((s) => s.theme);
  const chartType = useSettingsStore((s) => s.chartType);
  const market = useSettingsStore((s) => s.market);
  const indicators = useSettingsStore((s) => s.indicators);
  const initialThemeRef = useRef(theme);

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
    indicators.macd.enabled,
    indicators.obv.enabled,
    indicators.rsi.enabled,
    indicators.stochastic.enabled,
    indicators.volume.enabled,
  ]);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }
    dynamicSeriesRef.current.clear();

    const tc = THEME_COLORS[initialThemeRef.current];
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: tc.chartBg },
        textColor: tc.chartText,
      },
      grid: {
        vertLines: { color: tc.chartGrid },
        horzLines: { color: tc.chartGrid },
      },
      crosshair: { mode: 0 },
      rightPriceScale: {
        borderColor: tc.chartBorder,
        minimumWidth: CHART_PRICE_SCALE_WIDTH,
      },
      leftPriceScale: { visible: false },
      timeScale: {
        visible: true,
        borderColor: tc.chartBorder,
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

    applyIndicatorScaleLayout();
    onChartReady?.(chart);
  }, [applyIndicatorScaleLayout, onChartReady, chartType]);

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
      if (!chartRef.current || !data) return;
      const detail = (e as CustomEvent).detail as { from: number; to: number } | null;
      if (!detail) {
        chartRef.current.timeScale().fitContent();
        return;
      }
      const ts = chartRef.current.timeScale();
      // Find logical indices for time range
      const candles = data.candles;
      let fromIdx = 0;
      let toIdx = candles.length - 1;
      for (let i = 0; i < candles.length; i++) {
        if (candles[i].time >= detail.from) { fromIdx = i; break; }
      }
      for (let i = candles.length - 1; i >= 0; i--) {
        if (candles[i].time <= detail.to) { toIdx = i; break; }
      }
      ts.setVisibleLogicalRange({ from: fromIdx, to: toIdx });
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
    };
  }, [initChart, data]);

  // Theme update
  useEffect(() => {
    if (!chartRef.current) return;
    const tc = THEME_COLORS[theme];
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: tc.chartBg },
        textColor: tc.chartText,
      },
      grid: {
        vertLines: { color: tc.chartGrid },
        horzLines: { color: tc.chartGrid },
      },
      rightPriceScale: { borderColor: tc.chartBorder },
      timeScale: { borderColor: tc.chartBorder },
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
    applyIndicatorScaleLayout();
  }, [applyIndicatorScaleLayout]);

  // Data effect
  useEffect(() => {
    if (!data || !chartRef.current || !mainSeriesRef.current) return;

    const chart = chartRef.current;
    const displayCandles =
      chartType === "heikinAshi" ? toHeikinAshi(data.candles) : data.candles;

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
        : data.bollingerBands;

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

    if (indicators.sma.enabled && data.sma.length > 0) {
      data.sma.forEach((ma, idx) => {
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

    if (indicators.ema.enabled && data.ema.length > 0) {
      data.ema.forEach((ma, idx) => {
        const series = chart.addSeries(LineSeries, {
          color: MA_COLORS[(idx + data.sma.length) % MA_COLORS.length],
          lineWidth: 1,
          lineStyle: 2,
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

    if (indicators.rsi.enabled && data.rsi.length > 0) {
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
      rsiSeries.setData(data.rsi.map((r) => ({ time: r.time as Time, value: r.value })));
      overboughtSeries.setData(data.rsi.map((r) => ({ time: r.time as Time, value: 70 })));
      oversoldSeries.setData(data.rsi.map((r) => ({ time: r.time as Time, value: 30 })));
      dynamicSeriesRef.current.set("rsi-line", rsiSeries as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("rsi-ob", overboughtSeries as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("rsi-os", oversoldSeries as ISeriesApi<SeriesType>);
    }

    if (indicators.macd.enabled && data.macd?.data.length) {
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
        data.macd.data.map((p) => ({
          time: p.time as Time,
          value: p.histogram,
          color: p.histogram >= 0 ? COLORS.macdHistUp : COLORS.macdHistDown,
        })),
      );
      macdLine.setData(data.macd.data.map((p) => ({ time: p.time as Time, value: p.macd })));
      signalLine.setData(data.macd.data.map((p) => ({ time: p.time as Time, value: p.signal })));
      dynamicSeriesRef.current.set("macd-h", macdHist as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("macd-l", macdLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("macd-s", signalLine as ISeriesApi<SeriesType>);
    }

    if (indicators.stochastic.enabled && data.stochastic?.data.length) {
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
      kLine.setData(data.stochastic.data.map((p) => ({ time: p.time as Time, value: p.k })));
      dLine.setData(data.stochastic.data.map((p) => ({ time: p.time as Time, value: p.d })));
      obLine.setData(data.stochastic.data.map((p) => ({ time: p.time as Time, value: 80 })));
      osLine.setData(data.stochastic.data.map((p) => ({ time: p.time as Time, value: 20 })));
      dynamicSeriesRef.current.set("stoch-k", kLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("stoch-d", dLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("stoch-ob", obLine as ISeriesApi<SeriesType>);
      dynamicSeriesRef.current.set("stoch-os", osLine as ISeriesApi<SeriesType>);
    }

    if (indicators.obv.enabled && data.obv?.data.length) {
      const obvLine = chart.addSeries(LineSeries, {
        priceScaleId: "obv",
        color: "#14B8A6",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      obvLine.setData(data.obv.data.map((p) => ({ time: p.time as Time, value: p.value })));
      dynamicSeriesRef.current.set("obv", obvLine as ISeriesApi<SeriesType>);
    }

    applyIndicatorScaleLayout();

    if (markersPluginRef.current) {
      if (data.signals.length > 0) {
        const markers: SeriesMarker<Time>[] = data.signals
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
    const lastCandle = data.candles[data.candles.length - 1];
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

    const fitScope = `${data.symbol}:${data.interval}:${chartType}`;
    if (fittedScopeRef.current !== fitScope) {
      chart.timeScale().fitContent();
      fittedScopeRef.current = fitScope;
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
    indicators.macd.enabled,
    indicators.obv.enabled,
    indicators.rsi.enabled,
    indicators.sma.enabled,
    indicators.stochastic.enabled,
    indicators.volume.enabled,
  ]);

  return <div ref={containerRef} className="h-full w-full" />;
}
