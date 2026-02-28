import { useRef, useCallback } from "react";
import type { IChartApi, ISeriesApi, LogicalRange, SeriesType } from "lightweight-charts";
import MainChart from "./MainChart";
import RsiChart from "./RsiChart";
import { useChartStore } from "../stores/useChartStore";

interface ChartInfo {
  chart: IChartApi;
  series: ISeriesApi<SeriesType>;
}

export default function ChartContainer() {
  const { data, isLoading, error } = useChartStore();
  const mainInfoRef = useRef<ChartInfo | null>(null);
  const rsiInfoRef = useRef<ChartInfo | null>(null);
  const isSyncing = useRef(false);

  const syncCharts = useCallback(
    (source: ChartInfo, target: ChartInfo) => {
      source.chart
        .timeScale()
        .subscribeVisibleLogicalRangeChange((range: LogicalRange | null) => {
          if (isSyncing.current || !range) return;
          isSyncing.current = true;
          target.chart.timeScale().setVisibleLogicalRange(range);
          isSyncing.current = false;
        });

      source.chart.subscribeCrosshairMove((param) => {
        if (isSyncing.current) return;
        isSyncing.current = true;
        if (param.time) {
          target.chart.setCrosshairPosition(NaN, param.time, target.series);
        }
        isSyncing.current = false;
      });
    },
    [],
  );

  const handleMainChartReady = useCallback(
    (chart: IChartApi, series: ISeriesApi<"Candlestick">) => {
      mainInfoRef.current = { chart, series };
      if (rsiInfoRef.current) {
        syncCharts(mainInfoRef.current, rsiInfoRef.current);
        syncCharts(rsiInfoRef.current, mainInfoRef.current);
      }
    },
    [syncCharts],
  );

  const handleRsiChartReady = useCallback(
    (chart: IChartApi, series: ISeriesApi<"Line">) => {
      rsiInfoRef.current = { chart, series };
      if (mainInfoRef.current) {
        syncCharts(mainInfoRef.current, rsiInfoRef.current);
        syncCharts(rsiInfoRef.current, mainInfoRef.current);
      }
    },
    [syncCharts],
  );

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-sm" style={{ color: "#EF4444" }}>
            {error}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Check the symbol name or network connection
          </p>
        </div>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div
            className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "#2563EB", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Loading data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {isLoading && (
        <div
          className="h-0.5 w-full overflow-hidden"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <div
            className="h-full animate-pulse"
            style={{ background: "#2563EB", width: "40%" }}
          />
        </div>
      )}
      <div className="flex-[7] min-h-0">
        <MainChart data={data} onChartReady={handleMainChartReady} />
      </div>
      <div
        className="h-px"
        style={{ background: "var(--border-color)" }}
      />
      <div className="flex-[3] min-h-0">
        <RsiChart data={data} onChartReady={handleRsiChartReady} />
      </div>
    </div>
  );
}
