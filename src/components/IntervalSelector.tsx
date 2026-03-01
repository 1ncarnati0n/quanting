import { useEffect, useMemo, useState } from "react";
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
  const fallbackIntradayInterval = useMemo(() => {
    if (intradayIntervals.length === 0) return null;
    if (intradayIntervals.includes("1h")) return "1h";
    return intradayIntervals[0];
  }, [intradayIntervals]);
  const [lastIntradayInterval, setLastIntradayInterval] = useState<Interval | null>(
    fallbackIntradayInterval,
  );
  const primaryIntradayInterval = lastIntradayInterval ?? fallbackIntradayInterval;
  const intradayLabel = primaryIntradayInterval
    ? getIntervalLabel(primaryIntradayInterval)
    : "분";
  const intradayActive = Boolean(currentIntradayInterval);

  useEffect(() => {
    if (currentIntradayInterval) {
      setLastIntradayInterval(currentIntradayInterval);
      return;
    }
    if (
      !lastIntradayInterval ||
      !intradayIntervals.includes(lastIntradayInterval)
    ) {
      setLastIntradayInterval(fallbackIntradayInterval);
    }
  }, [
    currentIntradayInterval,
    fallbackIntradayInterval,
    intradayIntervals,
    lastIntradayInterval,
  ]);

  const handlePrimaryIntradayClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!primaryIntradayInterval) return;
    if (interval !== primaryIntradayInterval) {
      event.preventDefault();
      setInterval(primaryIntradayInterval);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {intradayIntervals.length > 0 && (
        <DropdownMenu>
          <div className="relative">
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`${CONTROL_CHIP_BUTTON_CLASS} inline-flex items-center justify-center gap-1.5 border ${
                  intradayActive
                    ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
                }`}
                onClick={handlePrimaryIntradayClick}
                aria-label="분 인터벌 선택"
                title="분 인터벌 선택"
              >
                <span>{intradayLabel}</span>
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
