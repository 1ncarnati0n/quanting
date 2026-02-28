import { useEffect, useState } from "react";
import { useSettingsStore } from "../stores/useSettingsStore";
import { COLORS } from "../utils/constants";
import IndicatorSection from "./IndicatorSection";
import PeriodsInput from "./PeriodsInput";

interface SettingsPanelProps {
  onClose: () => void;
  embedded?: boolean;
}

type SectionState = {
  appearance: boolean;
  layout: boolean;
  overlay: boolean;
  oscillators: boolean;
  quant: boolean;
  volume: boolean;
};

const SETTINGS_SECTION_STORAGE_KEY = "quanting-settings-sections";

const DEFAULT_SECTION_STATE: SectionState = {
  appearance: true,
  layout: true,
  overlay: true,
  oscillators: true,
  quant: false,
  volume: false,
};

const LAYOUT_PRESETS = {
  balanced: {
    label: "Balanced",
    values: {
      priceAreaRatio: 0.62,
      volumeWeight: 1.2,
      rsiWeight: 1,
      macdWeight: 1.2,
      stochasticWeight: 1,
      obvWeight: 1,
    },
  },
  oscillatorFocus: {
    label: "Oscillator Focus",
    values: {
      priceAreaRatio: 0.48,
      volumeWeight: 0.9,
      rsiWeight: 1.3,
      macdWeight: 1.5,
      stochasticWeight: 1.3,
      obvWeight: 0.8,
    },
  },
  volumeFocus: {
    label: "Volume Focus",
    values: {
      priceAreaRatio: 0.54,
      volumeWeight: 2.1,
      rsiWeight: 0.9,
      macdWeight: 1.1,
      stochasticWeight: 0.9,
      obvWeight: 1.3,
    },
  },
} as const;

type LayoutPresetKey = keyof typeof LAYOUT_PRESETS;

function loadSectionState(): SectionState {
  try {
    if (typeof window === "undefined") return DEFAULT_SECTION_STATE;
    const raw = localStorage.getItem(SETTINGS_SECTION_STORAGE_KEY);
    if (!raw) return DEFAULT_SECTION_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SECTION_STATE, ...parsed };
  } catch {
    return DEFAULT_SECTION_STATE;
  }
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  formatValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
          {label}
        </span>
        <span className="font-mono text-[10px]" style={{ color: "var(--text-primary)" }}>
          {formatValue ? formatValue(value) : step < 1 ? value.toFixed(1) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-label={label}
        style={{ height: "3px", accentColor: "var(--accent-primary)" }}
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="mb-2 flex cursor-pointer items-center justify-between gap-2">
      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative h-4 w-7 rounded-full transition-colors"
        aria-label={label}
        aria-pressed={checked}
        style={{ background: checked ? "var(--accent-primary)" : "var(--border-color)" }}
      >
        <span
          className="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform"
          style={{ transform: checked ? "translateX(13px)" : "translateX(2px)" }}
        />
      </button>
    </label>
  );
}

function SectionHeader({
  title,
  subtitle,
  open,
  onToggle,
  sectionId,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  sectionId: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors"
      aria-expanded={open}
      aria-controls={`${sectionId}-content`}
      id={`${sectionId}-header`}
      style={{
        borderColor: "var(--border-color)",
        background: "var(--surface-elevated)",
      }}
    >
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
          {title}
        </div>
        {subtitle && (
          <div className="mt-0.5 text-[10px]" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </div>
        )}
      </div>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{
          color: "var(--text-secondary)",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 160ms ease",
        }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

export default function SettingsPanel({ onClose, embedded = false }: SettingsPanelProps) {
  const { theme, chartType, indicators, toggleTheme, setChartType, setIndicator, toggleIndicator } =
    useSettingsStore();
  const quant = indicators.signalFilter;
  const layout = indicators.layout;
  const [openSections, setOpenSections] = useState<SectionState>(loadSectionState);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_SECTION_STORAGE_KEY, JSON.stringify(openSections));
    } catch {}
  }, [openSections]);

  const toggleSection = (section: keyof SectionState) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const applyLayoutPreset = (presetKey: LayoutPresetKey) => {
    setIndicator("layout", LAYOUT_PRESETS[presetKey].values);
  };

  const isPresetActive = (presetKey: LayoutPresetKey) => {
    const target = LAYOUT_PRESETS[presetKey].values;
    const eps = 0.001;
    return (
      Math.abs(layout.priceAreaRatio - target.priceAreaRatio) < eps &&
      Math.abs(layout.volumeWeight - target.volumeWeight) < eps &&
      Math.abs(layout.rsiWeight - target.rsiWeight) < eps &&
      Math.abs(layout.macdWeight - target.macdWeight) < eps &&
      Math.abs(layout.stochasticWeight - target.stochasticWeight) < eps &&
      Math.abs(layout.obvWeight - target.obvWeight) < eps
    );
  };

  return (
    <div
      className={`flex h-full w-[min(24rem,calc(100vw-1rem))] min-w-0 flex-col ${embedded ? "rounded-lg border" : "border-l"}`}
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
        boxShadow: "var(--panel-shadow)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--border-color)" }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Indicators
        </span>
        {!embedded && (
          <button
            onClick={onClose}
            className="btn-ghost rounded p-1 text-xs transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          <SectionHeader
            title="Appearance"
            subtitle="Theme and candle style"
            open={openSections.appearance}
            onToggle={() => toggleSection("appearance")}
            sectionId="appearance"
          />
          {openSections.appearance && (
            <div
              id="appearance-content"
              role="region"
              aria-labelledby="appearance-header"
              className="rounded-md border p-2.5"
              style={{ borderColor: "var(--border-color)", background: "var(--surface-elevated)" }}
            >
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Theme
              </div>
              <div className="mb-3 flex gap-2">
                <button
                  onClick={() => theme !== "dark" && toggleTheme()}
                  className="flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: theme === "dark" ? "var(--accent-primary)" : "var(--bg-tertiary)",
                    color: theme === "dark" ? "var(--accent-contrast)" : "var(--text-secondary)",
                    border: `1px solid ${theme === "dark" ? "var(--accent-primary)" : "var(--border-color)"}`,
                  }}
                >
                  Dark
                </button>
                <button
                  onClick={() => theme !== "light" && toggleTheme()}
                  className="flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: theme === "light" ? "var(--accent-primary)" : "var(--bg-tertiary)",
                    color: theme === "light" ? "var(--accent-contrast)" : "var(--text-secondary)",
                    border: `1px solid ${theme === "light" ? "var(--accent-primary)" : "var(--border-color)"}`,
                  }}
                >
                  Light
                </button>
              </div>

              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Chart Type
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType("candlestick")}
                  className="flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: chartType === "candlestick" ? "var(--accent-primary)" : "var(--bg-tertiary)",
                    color: chartType === "candlestick" ? "var(--accent-contrast)" : "var(--text-secondary)",
                    border: `1px solid ${chartType === "candlestick" ? "var(--accent-primary)" : "var(--border-color)"}`,
                  }}
                >
                  Candlestick
                </button>
                <button
                  onClick={() => setChartType("heikinAshi")}
                  className="flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: chartType === "heikinAshi" ? "var(--accent-primary)" : "var(--bg-tertiary)",
                    color: chartType === "heikinAshi" ? "var(--accent-contrast)" : "var(--text-secondary)",
                    border: `1px solid ${chartType === "heikinAshi" ? "var(--accent-primary)" : "var(--border-color)"}`,
                  }}
                >
                  Heikin Ashi
                </button>
              </div>
            </div>
          )}

          <SectionHeader
            title="Chart Layout"
            subtitle="Price and indicator band ratios"
            open={openSections.layout}
            onToggle={() => toggleSection("layout")}
            sectionId="layout"
          />
          {openSections.layout && (
            <div
              id="layout-content"
              role="region"
              aria-labelledby="layout-header"
              className="rounded-md border p-2.5"
              style={{ borderColor: "var(--border-color)", background: "var(--surface-elevated)" }}
            >
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Presets
              </div>
              <div className="mb-3 grid grid-cols-3 gap-1">
                {(Object.keys(LAYOUT_PRESETS) as LayoutPresetKey[]).map((presetKey) => {
                  const preset = LAYOUT_PRESETS[presetKey];
                  const active = isPresetActive(presetKey);
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => applyLayoutPreset(presetKey)}
                      className="rounded px-1.5 py-1 text-[10px] font-medium transition-colors"
                      aria-label={`Apply ${preset.label} layout preset`}
                      style={{
                        background: active ? "var(--accent-primary)" : "var(--bg-secondary)",
                        color: active ? "var(--accent-contrast)" : "var(--text-secondary)",
                        border: `1px solid ${active ? "var(--accent-primary)" : "var(--border-color)"}`,
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <SliderRow
                label="Price Area Height"
                value={layout.priceAreaRatio}
                min={0.35}
                max={0.85}
                step={0.01}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => setIndicator("layout", { priceAreaRatio: v })}
              />
              <SliderRow
                label="Volume Band Weight"
                value={layout.volumeWeight}
                min={0.4}
                max={3}
                step={0.1}
                formatValue={(v) => `${v.toFixed(1)}x`}
                onChange={(v) => setIndicator("layout", { volumeWeight: v })}
              />
              <SliderRow
                label="RSI Band Weight"
                value={layout.rsiWeight}
                min={0.4}
                max={3}
                step={0.1}
                formatValue={(v) => `${v.toFixed(1)}x`}
                onChange={(v) => setIndicator("layout", { rsiWeight: v })}
              />
              <SliderRow
                label="MACD Band Weight"
                value={layout.macdWeight}
                min={0.4}
                max={3}
                step={0.1}
                formatValue={(v) => `${v.toFixed(1)}x`}
                onChange={(v) => setIndicator("layout", { macdWeight: v })}
              />
              <SliderRow
                label="Stoch Band Weight"
                value={layout.stochasticWeight}
                min={0.4}
                max={3}
                step={0.1}
                formatValue={(v) => `${v.toFixed(1)}x`}
                onChange={(v) => setIndicator("layout", { stochasticWeight: v })}
              />
              <SliderRow
                label="OBV Band Weight"
                value={layout.obvWeight}
                min={0.4}
                max={3}
                step={0.1}
                formatValue={(v) => `${v.toFixed(1)}x`}
                onChange={(v) => setIndicator("layout", { obvWeight: v })}
              />
              <button
                type="button"
                className="mt-1 w-full rounded px-2 py-1 text-[10px] font-medium transition-colors"
                style={{
                  color: "var(--text-secondary)",
                  background: "var(--bg-secondary)",
                  border: `1px solid var(--border-color)`,
                }}
                onClick={() => applyLayoutPreset("balanced")}
              >
                Reset Layout Ratios
              </button>
            </div>
          )}

          <SectionHeader
            title="Overlay Indicators"
            subtitle="Bands and trend lines"
            open={openSections.overlay}
            onToggle={() => toggleSection("overlay")}
            sectionId="overlay"
          />
          {openSections.overlay && (
            <div
              id="overlay-content"
              role="region"
              aria-labelledby="overlay-header"
              className="rounded-md border p-2.5"
              style={{ borderColor: "var(--border-color)", background: "var(--surface-elevated)" }}
            >
              <IndicatorSection
                title="Bollinger Bands"
                color={COLORS.bbUpper}
                enabled={indicators.bb.enabled}
                onToggle={() => toggleIndicator("bb")}
              >
                <SliderRow
                  label="Period"
                  value={indicators.bb.period}
                  min={5}
                  max={100}
                  step={1}
                  onChange={(v) => setIndicator("bb", { period: v })}
                />
                <SliderRow
                  label="Multiplier"
                  value={indicators.bb.multiplier}
                  min={0.5}
                  max={4.0}
                  step={0.1}
                  onChange={(v) => setIndicator("bb", { multiplier: v })}
                />
              </IndicatorSection>

              <IndicatorSection
                title="SMA"
                color="#F59E0B"
                enabled={indicators.sma.enabled}
                onToggle={() => toggleIndicator("sma")}
              >
                <PeriodsInput
                  periods={indicators.sma.periods}
                  onChange={(periods) => setIndicator("sma", { periods })}
                />
              </IndicatorSection>

              <IndicatorSection
                title="EMA"
                color="#8B5CF6"
                enabled={indicators.ema.enabled}
                onToggle={() => toggleIndicator("ema")}
              >
                <PeriodsInput
                  periods={indicators.ema.periods}
                  onChange={(periods) => setIndicator("ema", { periods })}
                />
              </IndicatorSection>
            </div>
          )}

          <SectionHeader
            title="Oscillators"
            subtitle="Momentum and reversal signals"
            open={openSections.oscillators}
            onToggle={() => toggleSection("oscillators")}
            sectionId="oscillators"
          />
          {openSections.oscillators && (
            <div
              id="oscillators-content"
              role="region"
              aria-labelledby="oscillators-header"
              className="rounded-md border p-2.5"
              style={{ borderColor: "var(--border-color)", background: "var(--surface-elevated)" }}
            >
              <IndicatorSection
                title="RSI"
                color={COLORS.rsiLine}
                enabled={indicators.rsi.enabled}
                onToggle={() => toggleIndicator("rsi")}
              >
                <SliderRow
                  label="Period"
                  value={indicators.rsi.period}
                  min={2}
                  max={50}
                  step={1}
                  onChange={(v) => setIndicator("rsi", { period: v })}
                />
              </IndicatorSection>

              <IndicatorSection
                title="MACD"
                color={COLORS.macdLine}
                enabled={indicators.macd.enabled}
                onToggle={() => toggleIndicator("macd")}
              >
                <SliderRow
                  label="Fast Period"
                  value={indicators.macd.fastPeriod}
                  min={2}
                  max={50}
                  step={1}
                  onChange={(v) => setIndicator("macd", { fastPeriod: v })}
                />
                <SliderRow
                  label="Slow Period"
                  value={indicators.macd.slowPeriod}
                  min={5}
                  max={100}
                  step={1}
                  onChange={(v) => setIndicator("macd", { slowPeriod: v })}
                />
                <SliderRow
                  label="Signal Period"
                  value={indicators.macd.signalPeriod}
                  min={2}
                  max={50}
                  step={1}
                  onChange={(v) => setIndicator("macd", { signalPeriod: v })}
                />
              </IndicatorSection>

              <IndicatorSection
                title="Stochastic"
                color={COLORS.stochK}
                enabled={indicators.stochastic.enabled}
                onToggle={() => toggleIndicator("stochastic")}
              >
                <SliderRow
                  label="%K Period"
                  value={indicators.stochastic.kPeriod}
                  min={2}
                  max={50}
                  step={1}
                  onChange={(v) => setIndicator("stochastic", { kPeriod: v })}
                />
                <SliderRow
                  label="%D Period"
                  value={indicators.stochastic.dPeriod}
                  min={2}
                  max={20}
                  step={1}
                  onChange={(v) => setIndicator("stochastic", { dPeriod: v })}
                />
                <SliderRow
                  label="Smooth"
                  value={indicators.stochastic.smooth}
                  min={1}
                  max={10}
                  step={1}
                  onChange={(v) => setIndicator("stochastic", { smooth: v })}
                />
              </IndicatorSection>
            </div>
          )}

          <SectionHeader
            title="Quant Filter"
            subtitle="Regime, momentum, volatility"
            open={openSections.quant}
            onToggle={() => toggleSection("quant")}
            sectionId="quant"
          />
          {openSections.quant && (
            <div
              id="quant-content"
              role="region"
              aria-labelledby="quant-header"
              className="rounded-md border p-2.5"
              style={{ borderColor: "var(--border-color)", background: "var(--surface-elevated)" }}
            >
              <IndicatorSection
                title="Quanting Signal Filter"
                color="#06B6D4"
                enabled={quant.enabled}
                onToggle={() => toggleIndicator("signalFilter")}
              >
                <ToggleRow
                  label="Apply Regime Filter"
                  checked={quant.applyRegimeFilter}
                  onChange={(checked) => setIndicator("signalFilter", { applyRegimeFilter: checked })}
                />
                <SliderRow
                  label="Regime Period"
                  value={quant.regimePeriod}
                  min={20}
                  max={300}
                  step={1}
                  onChange={(v) => setIndicator("signalFilter", { regimePeriod: v })}
                />
                <SliderRow
                  label="Regime Buffer"
                  value={quant.regimeBuffer}
                  min={0}
                  max={0.02}
                  step={0.001}
                  formatValue={(v) => v.toFixed(3)}
                  onChange={(v) => setIndicator("signalFilter", { regimeBuffer: v })}
                />
                <ToggleRow
                  label="Apply Momentum Filter"
                  checked={quant.applyMomentumFilter}
                  onChange={(checked) => setIndicator("signalFilter", { applyMomentumFilter: checked })}
                />
                <SliderRow
                  label="Momentum Period"
                  value={quant.momentumPeriod}
                  min={10}
                  max={252}
                  step={1}
                  onChange={(v) => setIndicator("signalFilter", { momentumPeriod: v })}
                />
                <SliderRow
                  label="Min Momentum For Buy"
                  value={quant.minMomentumForBuy}
                  min={-0.3}
                  max={0}
                  step={0.01}
                  formatValue={(v) => `${(v * 100).toFixed(1)}%`}
                  onChange={(v) => setIndicator("signalFilter", { minMomentumForBuy: v })}
                />
                <SliderRow
                  label="Max Momentum For Sell"
                  value={quant.maxMomentumForSell}
                  min={0}
                  max={0.3}
                  step={0.01}
                  formatValue={(v) => `${(v * 100).toFixed(1)}%`}
                  onChange={(v) => setIndicator("signalFilter", { maxMomentumForSell: v })}
                />
                <ToggleRow
                  label="Apply Volatility Filter"
                  checked={quant.applyVolatilityFilter}
                  onChange={(checked) => setIndicator("signalFilter", { applyVolatilityFilter: checked })}
                />
                <SliderRow
                  label="Volatility Period"
                  value={quant.volatilityPeriod}
                  min={5}
                  max={100}
                  step={1}
                  onChange={(v) => setIndicator("signalFilter", { volatilityPeriod: v })}
                />
                <SliderRow
                  label="Volatility Rank Period"
                  value={quant.volatilityRankPeriod}
                  min={20}
                  max={252}
                  step={1}
                  onChange={(v) => setIndicator("signalFilter", { volatilityRankPeriod: v })}
                />
                <SliderRow
                  label="High Vol Percentile"
                  value={quant.highVolPercentile}
                  min={0.5}
                  max={0.99}
                  step={0.01}
                  formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                  onChange={(v) => setIndicator("signalFilter", { highVolPercentile: v })}
                />
                <ToggleRow
                  label="Keep Strong Counter-Trend"
                  checked={quant.keepStrongCounterTrend}
                  onChange={(checked) => setIndicator("signalFilter", { keepStrongCounterTrend: checked })}
                />
                <ToggleRow
                  label="Keep Strong In High Vol"
                  checked={quant.keepStrongInHighVol}
                  onChange={(checked) => setIndicator("signalFilter", { keepStrongInHighVol: checked })}
                />
              </IndicatorSection>
            </div>
          )}

          <SectionHeader
            title="Volume & Flow"
            subtitle="Volume and OBV overlays"
            open={openSections.volume}
            onToggle={() => toggleSection("volume")}
            sectionId="volume"
          />
          {openSections.volume && (
            <div
              id="volume-content"
              role="region"
              aria-labelledby="volume-header"
              className="rounded-md border p-2.5"
              style={{ borderColor: "var(--border-color)", background: "var(--surface-elevated)" }}
            >
              <IndicatorSection
                title="Volume"
                color="var(--success-color)"
                enabled={indicators.volume.enabled}
                onToggle={() => toggleIndicator("volume")}
              />
              <IndicatorSection
                title="OBV (On-Balance Volume)"
                color="#14B8A6"
                enabled={indicators.obv.enabled}
                onToggle={() => toggleIndicator("obv")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
