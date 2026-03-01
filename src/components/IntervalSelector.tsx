import { getIntervalsForMarket, type Interval } from "../utils/constants";
import { useSettingsStore } from "../stores/useSettingsStore";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectItem } from "@/components/ui/select";

const CORE_INTERVALS: readonly Interval[] = ["1d", "1w", "1M"];
const DROPDOWN_PLACEHOLDER = "__intraday__";
const INTERVAL_LABELS: Record<Interval, string> = {
  "1m": "1분",
  "3m": "3분",
  "5m": "5분",
  "10m": "10분",
  "15m": "15분",
  "30m": "30분",
  "1h": "1시간",
  "2h": "2시간",
  "4h": "4시간",
  "1d": "일봉",
  "1w": "주봉",
  "1M": "월봉",
};

function intervalLabel(interval: Interval): string {
  return INTERVAL_LABELS[interval] ?? interval;
}

export default function IntervalSelector() {
  const { interval, market, setInterval } = useSettingsStore();
  const intervals = getIntervalsForMarket(market);
  const coreIntervals = CORE_INTERVALS.filter((iv) => intervals.includes(iv));
  const intradayIntervals = intervals.filter((iv) => !coreIntervals.includes(iv));
  const dropdownValue = intradayIntervals.includes(interval)
    ? interval
    : DROPDOWN_PLACEHOLDER;

  return (
    <div className="flex items-center gap-2">
      {intradayIntervals.length > 0 && (
        <Select
          value={dropdownValue}
          size="md"
          onValueChange={(value) => {
            if (!value || value === DROPDOWN_PLACEHOLDER) return;
            setInterval(value as Interval);
          }}
          className="min-w-[124px] font-semibold"
          aria-label="분봉 및 시간봉 선택"
        >
          <SelectItem value={DROPDOWN_PLACEHOLDER}>분/시간봉 선택</SelectItem>
          {intradayIntervals.map((iv) => (
            <SelectItem key={iv} value={iv}>
              {intervalLabel(iv)}
            </SelectItem>
          ))}
        </Select>
      )}

      <ToggleGroup
        type="single"
        size="md"
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
            className="min-w-[58px] font-semibold"
          >
            {intervalLabel(iv)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
