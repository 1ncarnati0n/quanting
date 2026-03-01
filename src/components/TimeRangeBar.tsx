import { useEffect, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

const TIME_RANGE_STORAGE_KEY = "quanting-time-range";

function getSavedTimeRangeLabel(): string {
  try {
    const raw = localStorage.getItem(TIME_RANGE_STORAGE_KEY);
    if (!raw) return "전체";
    const exists = TIME_RANGES.some((item) => item.label === raw);
    return exists ? raw : "전체";
  } catch {
    return "전체";
  }
}

export default function TimeRangeBar() {
  const [active, setActive] = useState<string>(() => getSavedTimeRangeLabel());

  const handleClick = (range: typeof TIME_RANGES[number]) => {
    setActive(range.label);
    try {
      localStorage.setItem(TIME_RANGE_STORAGE_KEY, range.label);
    } catch {}

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

  useEffect(() => {
    const initial = TIME_RANGES.find((item) => item.label === active);
    if (!initial) return;
    const timer = window.setTimeout(() => {
      handleClick(initial);
    }, 120);
    return () => window.clearTimeout(timer);
    // 초기 1회만 저장된 기간을 차트에 재적용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ToggleGroup
      type="single"
      value={active}
      onValueChange={(value) => {
        if (!value) return;
        const range = TIME_RANGES.find((item) => item.label === value);
        if (range) handleClick(range);
      }}
      className="gap-0.5 p-0.5"
    >
      {TIME_RANGES.map((range) => (
        <ToggleGroupItem
          key={range.label}
          value={range.label}
          className="px-1.5 py-0.5 text-[10px]"
        >
          {range.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
