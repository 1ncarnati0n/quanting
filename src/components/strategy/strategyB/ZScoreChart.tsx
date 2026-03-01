import { useEffect, useRef } from "react";
import { createChart, LineSeries, type IChartApi, type ISeriesApi } from "lightweight-charts";
import { useSettingsStore } from "@/stores/useSettingsStore";

interface ZScoreChartProps {
  data: { time: number; value: number }[];
}

function readPalette() {
  const s = getComputedStyle(document.documentElement);
  return {
    bg: s.getPropertyValue("--chart-bg").trim() || "#0d1421",
    fg: s.getPropertyValue("--chart-foreground").trim() || "#9eb0c8",
    grid: s.getPropertyValue("--chart-grid").trim() || "#1b273b",
  };
}

export default function ZScoreChart({ data }: ZScoreChartProps) {
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
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });

    const series = chart.addSeries(LineSeries, {
      color: "#a78bfa",
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
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    const palette = readPalette();
    chartRef.current.applyOptions({
      layout: { background: { color: palette.bg }, textColor: palette.fg },
      grid: { vertLines: { color: palette.grid }, horzLines: { color: palette.grid } },
    });
  }, [theme]);

  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return;
    // Color-code by zone
    const colored = data.map((p) => {
      let color = "#a78bfa"; // default purple
      if (p.value > 3.5 || p.value < -3.5) color = "#f59e0b"; // stoploss yellow
      else if (p.value > 2) color = "#ef4444"; // sell red
      else if (p.value < -2) color = "#22c55e"; // buy green
      return { time: p.time as number, value: p.value, color };
    });
    seriesRef.current.setData(colored as any);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <span className="ds-type-caption font-semibold text-[var(--foreground)]">Z-Score</span>
        <div className="flex gap-2">
          {[
            { label: "±2.0 신호", color: "#a78bfa" },
            { label: "±3.5 손절", color: "#f59e0b" },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1 ds-type-caption text-[var(--muted-foreground)]">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        className="h-[200px] w-full rounded-lg border border-[var(--border)] overflow-hidden"
      />
    </div>
  );
}
