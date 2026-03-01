import {
  getIntervalLabel,
  getIntervalsForMarket,
  type Interval,
} from "../utils/constants";
import { useSettingsStore } from "../stores/useSettingsStore";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CONTROL_CHIP_BUTTON_CLASS,
  CONTROL_CHIP_GROUP_CLASS,
} from "./patterns/controlTokens";

const CORE_INTERVALS: readonly Interval[] = ["1d", "1w", "1M"];

export default function IntervalSelector() {
  const { interval, market, setInterval } = useSettingsStore();
  const intervals = getIntervalsForMarket(market);
  const coreIntervals = CORE_INTERVALS.filter((iv) => intervals.includes(iv));
  const intradayIntervals = intervals.filter((iv) => !coreIntervals.includes(iv));
  const currentIntradayInterval = intradayIntervals.includes(interval) ? interval : null;
  const intradayLabel = currentIntradayInterval
    ? getIntervalLabel(currentIntradayInterval)
    : "분/시간";

  return (
    <div className="flex items-center gap-1">
      {intradayIntervals.length > 0 && (
        <DropdownMenu>
          <div className="relative">
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`${CONTROL_CHIP_BUTTON_CLASS} inline-flex h-[var(--control-height-sm)] min-w-[74px] items-center justify-center gap-1.5 border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]`}
                aria-label="분/시간 인터벌 선택"
                title="분/시간 인터벌 선택"
              >
                <span>{intradayLabel}</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-[90] max-h-64 min-w-[7.25rem] overflow-y-auto">
              {intradayIntervals.map((iv) => {
                const active = interval === iv;
                return (
                  <DropdownMenuItem
                    key={iv}
                    role="menuitemradio"
                    aria-checked={active}
                    data-dropdown-active={active ? "true" : undefined}
                    onSelect={() => setInterval(iv)}
                    className="justify-between"
                    style={{
                      background: active
                        ? "color-mix(in srgb, var(--primary) 14%, transparent)"
                        : undefined,
                      color: active ? "var(--primary)" : undefined,
                    }}
                  >
                    <span>{getIntervalLabel(iv)}</span>
                    {active && <span>✓</span>}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </div>
        </DropdownMenu>
      )}

      <ToggleGroup
        type="single"
        className={CONTROL_CHIP_GROUP_CLASS}
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
            className={`${CONTROL_CHIP_BUTTON_CLASS} min-w-[36px]`}
          >
            {getIntervalLabel(iv)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
