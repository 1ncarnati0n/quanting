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
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${interval !== iv ? "btn-ghost" : ""}`}
          style={{
            background: interval === iv ? "var(--accent-primary)" : "var(--bg-tertiary)",
            color: interval === iv ? "var(--accent-contrast)" : "var(--text-secondary)",
            border: `1px solid ${interval === iv ? "var(--accent-primary)" : "var(--border-color)"}`,
          }}
        >
          {iv}
        </button>
      ))}
    </div>
  );
}
