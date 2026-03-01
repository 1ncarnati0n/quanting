import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PeriodsInputProps {
  periods: number[];
  onChange: (periods: number[]) => void;
  max?: number;
}

export default function PeriodsInput({ periods, onChange, max = 7 }: PeriodsInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addPeriod = () => {
    const num = parseInt(inputValue.trim(), 10);
    if (!num || num < 1 || num > 500) return;
    if (periods.includes(num)) return;
    if (periods.length >= max) return;

    onChange([...periods, num].sort((a, b) => a - b));
    setInputValue("");
  };

  const removePeriod = (period: number) => {
    if (periods.length <= 1) return;
    onChange(periods.filter((p) => p !== period));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPeriod();
    }
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {periods.map((p) => (
          <span
            key={p}
            className="ds-type-caption inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium leading-none"
            style={{
              background: "var(--secondary)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            {p}
            {periods.length > 1 && (
              <button
                onClick={() => removePeriod(p)}
                className="ml-0.5 leading-none opacity-60 hover:opacity-100"
                style={{ color: "var(--muted-foreground)" }}
              >
                x
              </button>
            )}
          </span>
        ))}
      </div>
      {periods.length < max && (
        <div className="flex gap-1.5">
          <Input
            type="number"
            min={1}
            max={500}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="기간 추가"
            size="sm"
            className="w-20"
          />
          <Button
            onClick={addPeriod}
            title="기간 추가"
            variant="secondary"
            size="sm"
            className="ds-type-label px-2.5"
          >
            +
          </Button>
        </div>
      )}
    </div>
  );
}
