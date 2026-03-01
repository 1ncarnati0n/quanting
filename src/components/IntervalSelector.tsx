import {
  getIntervalLabel,
  getIntervalsForMarket,
  type Interval,
} from "../utils/constants";
import { useSettingsStore } from "../stores/useSettingsStore";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectItem } from "@/components/ui/select";

const CORE_INTERVALS: readonly Interval[] = ["1d", "1w", "1M"];
const DROPDOWN_PLACEHOLDER = "__intraday__";
const INTERVAL_BUTTON_CLASS =
  "ds-type-caption h-auto whitespace-nowrap rounded-sm p-1 leading-none font-medium";

export default function IntervalSelector() {
  const { interval, market, setInterval } = useSettingsStore();
  const intervals = getIntervalsForMarket(market);
  const coreIntervals = CORE_INTERVALS.filter((iv) => intervals.includes(iv));
  const intradayIntervals = intervals.filter((iv) => !coreIntervals.includes(iv));
  const dropdownValue = intradayIntervals.includes(interval)
    ? interval
    : DROPDOWN_PLACEHOLDER;

  return (
    <div className="flex items-center gap-1">
      {intradayIntervals.length > 0 && (
        <Select
          value={dropdownValue}
          size="sm"
          onValueChange={(value) => {
            if (!value || value === DROPDOWN_PLACEHOLDER) return;
            setInterval(value as Interval);
          }}
          className={`${INTERVAL_BUTTON_CLASS} min-w-[96px]`}
          aria-label="분 인터벌 선택"
        >
          <SelectItem value={DROPDOWN_PLACEHOLDER}>분 선택</SelectItem>
          {intradayIntervals.map((iv) => (
            <SelectItem key={iv} value={iv}>
              {getIntervalLabel(iv)}
            </SelectItem>
          ))}
        </Select>
      )}

      <ToggleGroup
        type="single"
        size="sm"
        value={coreIntervals.includes(interval) ? interval : ""}
        onValueChange={(value) => {
          if (!value) return;
          setInterval(value as Interval);
        }}
      >
        {coreIntervals.map((iv) => (
          <ToggleGroupItem
            key={iv}
            value={iv}
            className={`${INTERVAL_BUTTON_CLASS} min-w-[48px]`}
          >
            {getIntervalLabel(iv)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
