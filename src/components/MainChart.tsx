import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  ColorType,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";
import type { AnalysisResponse, SignalType } from "../types";
import { COLORS, THEME_COLORS } from "../utils/constants";
import { useSettingsStore } from "../stores/useSettingsStore";

const SIGNAL_MARKERS: Record<
  SignalType,
  { position: "belowBar" | "aboveBar"; color: string; shape: "arrowUp" | "arrowDown"; text: string }
> = {
  strongBuy: { position: "belowBar", color: COLORS.strongBuy, shape: "arrowUp", text: "Strong Buy" },
  weakBuy: { position: "belowBar", color: COLORS.weakBuy, shape: "arrowUp", text: "Weak Buy" },
  strongSell: { position: "aboveBar", color: COLORS.strongSell, shape: "arrowDown", text: "Strong Sell" },
  weakSell: { position: "aboveBar", color: COLORS.weakSell, shape: "arrowDown", text: "Weak Sell" },
};

interface MainChartProps {
  data: AnalysisResponse | null;
  onChartReady?: (chart: IChartApi, series: ISeriesApi<"Candlestick">) => void;
}

export default function MainChart({ data, onChartReady }: MainChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbMiddleRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<"Line"> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  const theme = useSettingsStore((s) => s.theme);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const tc = THEME_COLORS[theme];

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: tc.chartBg },
        textColor: tc.chartText,
      },
      grid: {
        vertLines: { color: tc.chartGrid },
        horzLines: { color: tc.chartGrid },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: tc.chartBorder,
      },
      timeScale: {
        borderColor: tc.chartBorder,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: COLORS.candleUp,
      downColor: COLORS.candleDown,
      borderUpColor: COLORS.candleUp,
      borderDownColor: COLORS.candleDown,
      wickUpColor: COLORS.candleUp,
      wickDownColor: COLORS.candleDown,
    });

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

    const markersPlugin = createSeriesMarkers(candleSeries);

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    bbUpperRef.current = bbUpper;
    bbMiddleRef.current = bbMiddle;
    bbLowerRef.current = bbLower;
    markersPluginRef.current = markersPlugin;

    onChartReady?.(chart, candleSeries);
  }, [onChartReady, theme]);

  // Initialize chart
  useEffect(() => {
    initChart();

    const container = containerRef.current;
    if (!container || !chartRef.current) return;

    const observer = new ResizeObserver(() => {
      if (chartRef.current && container) {
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initChart]);

  // Apply theme without re-creating chart
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

  // Update data
  useEffect(() => {
    if (!data || !candleSeriesRef.current) return;

    const candleData = data.candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeriesRef.current.setData(candleData);

    if (bbUpperRef.current && data.bollingerBands.length > 0) {
      bbUpperRef.current.setData(
        data.bollingerBands.map((b) => ({ time: b.time as Time, value: b.upper })),
      );
      bbMiddleRef.current?.setData(
        data.bollingerBands.map((b) => ({ time: b.time as Time, value: b.middle })),
      );
      bbLowerRef.current?.setData(
        data.bollingerBands.map((b) => ({ time: b.time as Time, value: b.lower })),
      );
    }

    // Signal markers via plugin
    if (markersPluginRef.current) {
      if (data.signals.length > 0) {
        const markers: SeriesMarker<Time>[] = data.signals
          .map((s) => {
            const config = SIGNAL_MARKERS[s.signalType];
            return {
              time: s.time as Time,
              position: config.position,
              color: config.color,
              shape: config.shape,
              text: config.text,
            } as SeriesMarker<Time>;
          })
          .sort((a, b) => (a.time as number) - (b.time as number));

        markersPluginRef.current.setMarkers(markers);
      } else {
        markersPluginRef.current.setMarkers([]);
      }
    }

    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return (
    <div ref={containerRef} className="h-full w-full" />
  );
}
