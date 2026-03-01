import { useEffect, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const TIME_RANGES = [
  { id: "1d", label: "1일", days: 1, legacyValues: ["1D"] },
  { id: "5d", label: "5일", days: 5, legacyValues: ["5D"] },
  { id: "1m", label: "1개월", days: 30, legacyValues: ["1M"] },
  { id: "3m", label: "3개월", days: 90, legacyValues: ["3M"] },
  { id: "6m", label: "6개월", days: 180, legacyValues: ["6M"] },
  { id: "ytd", label: "연초대비", days: -1, legacyValues: ["YTD"] },
  { id: "1y", label: "1년", days: 365, legacyValues: ["1Y"] },
  { id: "5y", label: "5년", days: 1825, legacyValues: ["5Y"] },
  { id: "all", label: "전체", days: 0, legacyValues: ["전체"] },
] as const;

const TIME_RANGE_STORAGE_KEY = "quanting-time-range";
const DEFAULT_TIME_RANGE_ID = "all";
type TimeRangeOption = (typeof TIME_RANGES)[number];
const TIME_RANGE_BUTTON_CLASS =
  "ds-type-caption h-auto whitespace-nowrap rounded-sm p-1 leading-none font-medium";

function getSavedTimeRangeId(): string {
  try {
    const raw = localStorage.getItem(TIME_RANGE_STORAGE_KEY);
    if (!raw) return DEFAULT_TIME_RANGE_ID;
    const matched = TIME_RANGES.find(
      (item) =>
        item.id === raw ||
        item.label === raw ||
        item.legacyValues.some((legacy) => legacy === raw),
    );
    return matched?.id ?? DEFAULT_TIME_RANGE_ID;
  } catch {
    return DEFAULT_TIME_RANGE_ID;
  }
}

export default function TimeRangeBar() {
  const [activeId, setActiveId] = useState<string>(() => getSavedTimeRangeId());

  const handleClick = (range: TimeRangeOption) => {
    setActiveId(range.id);
    try {
      localStorage.setItem(TIME_RANGE_STORAGE_KEY, range.id);
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
    const initial = TIME_RANGES.find((item) => item.id === activeId);
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
      size="sm"
      value={activeId}
      onValueChange={(value) => {
        if (!value) return;
        const range = TIME_RANGES.find((item) => item.id === value);
        if (range) handleClick(range);
      }}
    >
      {TIME_RANGES.map((range) => (
        <ToggleGroupItem
          key={range.id}
          value={range.id}
          className={TIME_RANGE_BUTTON_CLASS}
        >
          {range.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
