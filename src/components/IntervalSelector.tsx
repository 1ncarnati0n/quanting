import { getIntervalsForMarket, type Interval } from "../utils/constants";
import { useSettingsStore } from "../stores/useSettingsStore";

export default function IntervalSelector() {
  const { interval, market, setInterval } = useSettingsStore();
  const intervals = getIntervalsForMarket(market);

  return (
    <div className="flex gap-1">
      {intervals.map((iv) => (
        <button
          key={iv}
          onClick={() => setInterval(iv as Interval)}
          className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
          style={{
            background: interval === iv ? "#2563EB" : "var(--bg-tertiary)",
            color: interval === iv ? "#fff" : "var(--text-secondary)",
            border: `1px solid ${interval === iv ? "#2563EB" : "var(--border-color)"}`,
          }}
        >
          {iv}
        </button>
      ))}
    </div>
  );
}
