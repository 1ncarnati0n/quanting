import { useState } from "react";

const TIME_RANGES = [
  { label: "1D", days: 1 },
  { label: "5D", days: 5 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "YTD", days: -1 },
  { label: "1Y", days: 365 },
  { label: "5Y", days: 1825 },
  { label: "전체", days: 0 },
] as const;

export default function TimeRangeBar() {
  const [active, setActive] = useState<string>("전체");

  const handleClick = (range: typeof TIME_RANGES[number]) => {
    setActive(range.label);

    if (range.days === 0) {
      window.dispatchEvent(new CustomEvent("quanting:chart-set-time-range", { detail: null }));
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    let from: number;

    if (range.days === -1) {
      // YTD
      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      from = Math.floor(yearStart.getTime() / 1000);
    } else {
      from = now - range.days * 86400;
    }

    window.dispatchEvent(
      new CustomEvent("quanting:chart-set-time-range", { detail: { from, to: now } }),
    );
  };

  return (
    <div className="flex items-center gap-0.5">
      {TIME_RANGES.map((range) => (
        <button
          key={range.label}
          type="button"
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors"
          style={{
            background: active === range.label ? "var(--accent-soft)" : "transparent",
            color: active === range.label ? "var(--accent-primary)" : "var(--text-secondary)",
          }}
          onClick={() => handleClick(range)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
