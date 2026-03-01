import { useEffect, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CONTROL_CHIP_BUTTON_CLASS,
  CONTROL_CHIP_GROUP_CLASS,
} from "./patterns/controlTokens";
import {
  TIME_RANGES,
  TIME_RANGE_STORAGE_KEY,
  buildTimeRangeDetail,
  readSavedTimeRangeId,
  type TimeRangeOption,
} from "../utils/timeRange";

export default function TimeRangeBar() {
  const [activeId, setActiveId] = useState<TimeRangeOption["id"]>(() => readSavedTimeRangeId());

  const handleClick = (range: TimeRangeOption) => {
    setActiveId(range.id);
    try {
      localStorage.setItem(TIME_RANGE_STORAGE_KEY, range.id);
    } catch {}

    const detail = buildTimeRangeDetail(range.id);
    window.dispatchEvent(
      new CustomEvent("quanting:chart-set-time-range", {
        detail: { id: range.id, range: detail },
      }),
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
      className={CONTROL_CHIP_GROUP_CLASS}
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
          className={`${CONTROL_CHIP_BUTTON_CLASS} min-w-[32px]`}
        >
          {range.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
