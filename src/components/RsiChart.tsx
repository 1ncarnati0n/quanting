import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
  ColorType,
  LineSeries,
} from "lightweight-charts";
import type { AnalysisResponse } from "../types";
import { COLORS, THEME_COLORS } from "../utils/constants";
import { useSettingsStore } from "../stores/useSettingsStore";

interface RsiChartProps {
  data: AnalysisResponse | null;
  onChartReady?: (chart: IChartApi, series: ISeriesApi<"Line">) => void;
}

export default function RsiChart({ data, onChartReady }: RsiChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const overboughtRef = useRef<ISeriesApi<"Line"> | null>(null);
  const oversoldRef = useRef<ISeriesApi<"Line"> | null>(null);

  const theme = useSettingsStore((s) => s.theme);
  const initialThemeRef = useRef(theme);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

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
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: tc.chartBorder,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: tc.chartBorder,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const rsiSeries = chart.addSeries(LineSeries, {
      color: COLORS.rsiLine,
      lineWidth: 2,
      priceLineVisible: false,
    });

    const overbought = chart.addSeries(LineSeries, {
      color: COLORS.rsiOverbought,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    const oversold = chart.addSeries(LineSeries, {
      color: COLORS.rsiOversold,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    rsiSeriesRef.current = rsiSeries;
    overboughtRef.current = overbought;
    oversoldRef.current = oversold;

    onChartReady?.(chart, rsiSeries);
  }, [onChartReady]);

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

  useEffect(() => {
    if (!data || !rsiSeriesRef.current || data.rsi.length === 0) return;

    const rsiData = data.rsi.map((r) => ({
      time: r.time as Time,
      value: r.value,
    }));

    rsiSeriesRef.current.setData(rsiData);

    // Overbought/Oversold reference lines spanning the data range
    const times = data.rsi.map((r) => r.time);
    const refLineData = (level: number) =>
      times.map((t) => ({ time: t as Time, value: level }));

    overboughtRef.current?.setData(refLineData(70));
    oversoldRef.current?.setData(refLineData(30));

    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return (
    <div ref={containerRef} className="h-full w-full" />
  );
}
