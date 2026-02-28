import { useSettingsStore } from "../stores/useSettingsStore";

interface SettingsPanelProps {
  onClose: () => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {label}
        </span>
        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
          {step < 1 ? value.toFixed(1) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
        style={{ height: "4px" }}
      />
    </div>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="w-1 self-stretch rounded-full" style={{ background: color }} />
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color }}
      >
        {title}
      </h3>
    </div>
  );
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    bbPeriod,
    bbMultiplier,
    rsiPeriod,
    theme,
    setBbPeriod,
    setBbMultiplier,
    setRsiPeriod,
    toggleTheme,
  } = useSettingsStore();

  return (
    <div
      className="flex w-72 flex-col border-l"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--border-color)" }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Settings
        </span>
        <button
          onClick={onClose}
          className="rounded p-1 text-xs transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Theme Section */}
        <div className="mb-5">
          <SectionHeader title="Theme" color="#60A5FA" />
          <div className="flex gap-2">
            <button
              onClick={() => theme !== "dark" && toggleTheme()}
              className="flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: theme === "dark" ? "#2563EB" : "var(--bg-tertiary)",
                color: theme === "dark" ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${theme === "dark" ? "#2563EB" : "var(--border-color)"}`,
              }}
            >
              Dark
            </button>
            <button
              onClick={() => theme !== "light" && toggleTheme()}
              className="flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: theme === "light" ? "#2563EB" : "var(--bg-tertiary)",
                color: theme === "light" ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${theme === "light" ? "#2563EB" : "var(--border-color)"}`,
              }}
            >
              Light
            </button>
          </div>
        </div>

        <div className="mb-5 h-px" style={{ background: "var(--border-color)" }} />

        {/* Bollinger Bands Section */}
        <div className="mb-5">
          <SectionHeader title="Bollinger Bands" color="#2563EB" />
          <SliderRow
            label="Period"
            value={bbPeriod}
            min={5}
            max={100}
            step={1}
            onChange={setBbPeriod}
          />
          <SliderRow
            label="Multiplier"
            value={bbMultiplier}
            min={0.5}
            max={4.0}
            step={0.1}
            onChange={setBbMultiplier}
          />
        </div>

        <div className="mb-5 h-px" style={{ background: "var(--border-color)" }} />

        {/* RSI Section */}
        <div>
          <SectionHeader title="RSI" color="#A78BFA" />
          <SliderRow
            label="Period"
            value={rsiPeriod}
            min={2}
            max={50}
            step={1}
            onChange={setRsiPeriod}
          />
        </div>
      </div>
    </div>
  );
}
