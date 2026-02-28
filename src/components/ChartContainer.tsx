import MainChart from "./MainChart";
import { useChartStore } from "../stores/useChartStore";
import { useSettingsStore } from "../stores/useSettingsStore";

export default function ChartContainer() {
  const { data, isLoading, error } = useChartStore();
  const symbol = useSettingsStore((s) => s.symbol);
  const chartType = useSettingsStore((s) => s.chartType);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border p-6" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <div className="text-center">
          <p className="mb-2 text-sm" style={{ color: "var(--danger-color)" }}>
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
      <div className="flex h-full w-full items-center justify-center rounded-lg border p-6" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <div className="text-center">
          <div
            className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Loading data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-lg border"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-secondary)",
      }}
    >
      {isLoading && (
        <div
          className="h-0.5 w-full overflow-hidden"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <div
            className="h-full animate-pulse"
            style={{ background: "var(--accent-primary)", width: "40%" }}
          />
        </div>
      )}
      <span
        className="absolute left-3 top-2 z-10 rounded px-1.5 py-0.5 text-[10px] font-medium pointer-events-none"
        style={{
          color: "var(--text-secondary)",
          background: "var(--surface-elevated)",
        }}
      >
        {symbol} · {chartType === "heikinAshi" ? "Heikin Ashi" : "Candlestick"}
      </span>
      <div className="flex-1 min-h-0">
        <MainChart data={data} />
      </div>
    </div>
  );
}
