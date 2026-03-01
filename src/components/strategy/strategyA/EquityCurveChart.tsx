import { useEffect, useRef } from "react";
import { createChart, LineSeries, type IChartApi, type ISeriesApi } from "lightweight-charts";
import type { EquityPoint } from "@/stores/useStrategyStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

interface EquityCurveChartProps {
  data: EquityPoint[];
}

function readPalette() {
  const s = getComputedStyle(document.documentElement);
  return {
    bg: s.getPropertyValue("--chart-bg").trim() || "#0d1421",
    fg: s.getPropertyValue("--chart-foreground").trim() || "#9eb0c8",
    grid: s.getPropertyValue("--chart-grid").trim() || "#1b273b",
    line: s.getPropertyValue("--primary").trim() || "#2f7cff",
  };
}

export default function EquityCurveChart({ data }: EquityCurveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    if (!containerRef.current) return;

    const palette = readPalette();
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: palette.bg },
        textColor: palette.fg,
        fontFamily: "ui-monospace, 'Cascadia Code', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: palette.grid },
        horzLines: { color: palette.grid },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
      },
      crosshair: {
        horzLine: { labelVisible: true },
        vertLine: { labelVisible: true },
      },
    });

    const series = chart.addSeries(LineSeries, {
      color: palette.line,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Sync theme
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;
    const palette = readPalette();
    chartRef.current.applyOptions({
      layout: {
        background: { color: palette.bg },
        textColor: palette.fg,
      },
      grid: {
        vertLines: { color: palette.grid },
        horzLines: { color: palette.grid },
      },
    });
    seriesRef.current.applyOptions({ color: palette.line });
  }, [theme]);

  // Update data
  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return;
    const lineData = data.map((p) => ({ time: p.time as number, value: p.value }));
    seriesRef.current.setData(lineData as any);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="h-[240px] w-full rounded-lg border border-[var(--border)] overflow-hidden sm:h-[300px]"
    />
  );
}
