import { getIntervalsForMarket, type Interval } from "../utils/constants";
import { useSettingsStore } from "../stores/useSettingsStore";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function IntervalSelector() {
  const { interval, market, setInterval } = useSettingsStore();
  const intervals = getIntervalsForMarket(market);

  return (
    <ToggleGroup
      type="single"
      value={interval}
      onValueChange={(value) => {
        if (!value) return;
        setInterval(value as Interval);
      }}
    >
      {intervals.map((iv) => (
        <ToggleGroupItem
          key={iv}
          value={iv}
        >
          {iv}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
