import { getIntervalsForMarket, type Interval } from "../utils/constants";
import { useSettingsStore } from "../stores/useSettingsStore";

export default function IntervalSelector() {
  const { interval, market, setInterval } = useSettingsStore();
  const intervals = getIntervalsForMarket(market);

  return (
    <div className="segment-control">
      {intervals.map((iv) => (
        <button
          key={iv}
          onClick={() => setInterval(iv as Interval)}
          className={`segment-button ${interval === iv ? "active" : ""}`}
          style={{
            color: interval === iv ? "var(--accent-contrast)" : "var(--text-secondary)",
          }}
        >
          {iv}
        </button>
      ))}
    </div>
  );
}
