import { useState, type KeyboardEvent } from "react";

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
      <div className="mb-1.5 flex flex-wrap gap-1">
        {periods.map((p) => (
          <span
            key={p}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
            }}
          >
            {p}
            {periods.length > 1 && (
              <button
                onClick={() => removePeriod(p)}
                className="ml-0.5 leading-none opacity-60 hover:opacity-100"
                style={{ color: "var(--text-secondary)" }}
              >
                x
              </button>
            )}
          </span>
        ))}
      </div>
      {periods.length < max && (
        <div className="flex gap-1">
          <input
            type="number"
            min={1}
            max={500}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="기간 추가"
            className="w-20 rounded border px-1.5 py-0.5 text-xs"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={addPeriod}
            title="기간 추가"
            className="btn-ghost rounded px-2 py-0.5 text-xs"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
