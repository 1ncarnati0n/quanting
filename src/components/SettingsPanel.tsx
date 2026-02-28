import { useEffect, useState, type ReactNode } from "react";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useDrawingStore } from "../stores/useDrawingStore";
import { COLORS } from "../utils/constants";
import IndicatorSection from "./IndicatorSection";
import PeriodsInput from "./PeriodsInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  alerts: boolean;
};

const SETTINGS_SECTION_STORAGE_KEY = "quanting-settings-sections";

const DEFAULT_SECTION_STATE: SectionState = {
  appearance: true,
  layout: true,
  overlay: true,
  oscillators: true,
  quant: false,
  volume: false,
  alerts: false,
};

const LAYOUT_PRESETS = {
  balanced: {
    label: "균형",
    values: {
      priceAreaRatio: 0.62,
      volumeWeight: 1.2,
      rsiWeight: 1,
      macdWeight: 1.2,
      stochasticWeight: 1,
      obvWeight: 1,
      atrWeight: 1,
    },
  },
  oscillatorFocus: {
    label: "오실레이터 중심",
    values: {
      priceAreaRatio: 0.48,
      volumeWeight: 0.9,
      rsiWeight: 1.3,
      macdWeight: 1.5,
      stochasticWeight: 1.3,
      obvWeight: 0.8,
      atrWeight: 1.1,
    },
  },
  volumeFocus: {
    label: "거래량 중심",
    values: {
      priceAreaRatio: 0.54,
      volumeWeight: 2.1,
      rsiWeight: 0.9,
      macdWeight: 1.1,
      stochasticWeight: 0.9,
      obvWeight: 1.3,
      atrWeight: 1.2,
    },
  },
} as const;

type LayoutPresetKey = keyof typeof LAYOUT_PRESETS;
type SettingsTab = "indicators" | "layout" | "appearance";

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
        <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </span>
        <span className="font-mono text-[10px]" style={{ color: "var(--foreground)" }}>
          {formatValue ? formatValue(value) : step < 1 ? value.toFixed(1) : value}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(next) => onChange(next[0] ?? value)}
        className="w-full"
        aria-label={label}
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
      <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </label>
  );
}

function AccordionSection({
  value,
  title,
  subtitle,
  open,
  onOpenChange,
  sectionId,
  children,
}: {
  value: string;
  title: string;
  subtitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  children: ReactNode;
}) {
  return (
    <Accordion
      type="multiple"
      value={open ? [value] : []}
      onValueChange={(nextValue) => {
        const values = Array.isArray(nextValue)
          ? nextValue
          : nextValue
            ? [nextValue]
            : [];
        onOpenChange(values.includes(value));
      }}
      className="space-y-2"
    >
      <AccordionItem value={value} className="space-y-2">
        <AccordionTrigger
          id={`${sectionId}-header`}
          style={{
            borderColor: "var(--border)",
            background: "var(--muted)",
          }}
        >
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
              {title}
            </div>
            {subtitle && (
              <div className="mt-0.5 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                {subtitle}
              </div>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent
          id={`${sectionId}-content`}
          role="region"
          aria-labelledby={`${sectionId}-header`}
          className="rounded-md border p-2.5"
          style={{ borderColor: "var(--border)", background: "var(--muted)" }}
        >
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default function SettingsPanel({ onClose, embedded = false }: SettingsPanelProps) {
  const {
    theme,
    chartType,
    multiChartLayout,
    indicators,
    priceScale,
    compare,
    symbol,
    market,
    priceAlerts,
    alertHistory,
    toggleTheme,
    setChartType,
    setMultiChartLayout,
    setIndicator,
    toggleIndicator,
    setPriceScale,
    setCompare,
    addPriceAlert,
    removePriceAlert,
    togglePriceAlert,
    clearAlertHistory,
  } = useSettingsStore();
  const { drawings, setDrawings } = useDrawingStore();
  const quant = indicators.signalFilter;
  const layout = indicators.layout;
  const [openSections, setOpenSections] = useState<SectionState>(loadSectionState);
  const [activeTab, setActiveTab] = useState<SettingsTab>("indicators");
  const [alertInput, setAlertInput] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_SECTION_STORAGE_KEY, JSON.stringify(openSections));
    } catch {}
  }, [openSections]);

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
      Math.abs(layout.obvWeight - target.obvWeight) < eps &&
      Math.abs(layout.atrWeight - target.atrWeight) < eps
    );
  };

  const submitAlert = (condition: "above" | "below") => {
    const price = Number(alertInput.trim());
    if (!Number.isFinite(price) || price <= 0) return;
    addPriceAlert(price, condition);
    setAlertInput("");
  };

  const exportWorkspace = () => {
    const state = useSettingsStore.getState();
    const payload = {
      exportedAt: Date.now(),
      settings: {
        symbol: state.symbol,
        interval: state.interval,
        market: state.market,
        theme: state.theme,
        chartType: state.chartType,
        indicators: state.indicators,
        favorites: state.favorites,
        priceScale: state.priceScale,
        compare: state.compare,
        priceAlerts: state.priceAlerts,
      },
      drawings,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quanting-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importWorkspace = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const raw = await file.text();
        const parsed = JSON.parse(raw);
        const settings = parsed?.settings;
        if (!settings) return;

        useSettingsStore.setState((state) => ({
          ...state,
          symbol: settings.symbol ?? state.symbol,
          interval: settings.interval ?? state.interval,
          market: settings.market ?? state.market,
          theme: settings.theme ?? state.theme,
          chartType: settings.chartType ?? state.chartType,
          indicators: settings.indicators ?? state.indicators,
          favorites: settings.favorites ?? state.favorites,
          priceScale: settings.priceScale ?? state.priceScale,
          compare: settings.compare ?? state.compare,
          priceAlerts: settings.priceAlerts ?? state.priceAlerts,
        }));

        if (Array.isArray(parsed.drawings)) {
          setDrawings(parsed.drawings);
        }
      } catch (error) {
        console.warn("workspace import failed", error);
      }
    };
    input.click();
  };

  return (
    <div
      className={`flex h-full min-w-0 flex-col ${embedded ? "w-full rounded-lg border" : "w-[min(24rem,calc(100vw-1rem))] border-l"}`}
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          지표 설정
        </span>
        {!embedded && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-xs text-[var(--muted-foreground)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </Button>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as SettingsTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="border-b px-3 py-2" style={{ borderColor: "var(--border)" }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="indicators" aria-label="지표 탭">
              지표
            </TabsTrigger>
            <TabsTrigger value="layout" aria-label="레이아웃 탭">
              레이아웃
            </TabsTrigger>
            <TabsTrigger value="appearance" aria-label="화면 탭">
              화면
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
          {activeTab === "appearance" && (
            <AccordionSection
              value="appearance"
              title="화면"
              subtitle="테마 및 캔들 스타일"
              open={openSections.appearance}
              onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, appearance: open }))}
              sectionId="appearance"
            >
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                테마
              </div>
                  <div className="mb-3 flex gap-2">
                    <button
                      onClick={() => theme !== "dark" && toggleTheme()}
                      className="flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors"
                      style={{
                        background: theme === "dark" ? "var(--primary)" : "var(--secondary)",
                        color: theme === "dark" ? "var(--primary-foreground)" : "var(--muted-foreground)",
                        border: `1px solid ${theme === "dark" ? "var(--primary)" : "var(--border)"}`,
                      }}
                    >
                      다크
                    </button>
                    <button
                      onClick={() => theme !== "light" && toggleTheme()}
                      className="flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors"
                      style={{
                        background: theme === "light" ? "var(--primary)" : "var(--secondary)",
                        color: theme === "light" ? "var(--primary-foreground)" : "var(--muted-foreground)",
                        border: `1px solid ${theme === "light" ? "var(--primary)" : "var(--border)"}`,
                      }}
                    >
                      라이트
                    </button>
                  </div>

                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                    차트 타입
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { value: "candlestick" as const, label: "캔들스틱" },
                      { value: "heikinAshi" as const, label: "하이킨 아시" },
                      { value: "line" as const, label: "라인" },
                      { value: "area" as const, label: "영역" },
                      { value: "bar" as const, label: "바" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setChartType(opt.value)}
                        className="rounded px-2 py-1.5 text-[10px] font-medium transition-colors"
                        style={{
                          background: chartType === opt.value ? "var(--primary)" : "var(--secondary)",
                          color: chartType === opt.value ? "var(--primary-foreground)" : "var(--muted-foreground)",
                          border: `1px solid ${chartType === opt.value ? "var(--primary)" : "var(--border)"}`,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                    가격 스케일
                  </div>
                  <div className="mb-2 grid grid-cols-3 gap-1.5">
                    {([
                      { value: "normal" as const, label: "기본" },
                      { value: "logarithmic" as const, label: "로그" },
                      { value: "percentage" as const, label: "%" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPriceScale({ mode: opt.value })}
                        className="rounded px-2 py-1 text-[10px] font-medium transition-colors"
                        style={{
                          background: priceScale.mode === opt.value ? "var(--primary)" : "var(--secondary)",
                          color: priceScale.mode === opt.value ? "var(--primary-foreground)" : "var(--muted-foreground)",
                          border: `1px solid ${priceScale.mode === opt.value ? "var(--primary)" : "var(--border)"}`,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <ToggleRow
                    label="자동 스케일"
                    checked={priceScale.autoScale}
                    onChange={(checked) => setPriceScale({ autoScale: checked })}
                  />
                  <ToggleRow
                    label="역전 스케일"
                    checked={priceScale.invertScale}
                    onChange={(checked) => setPriceScale({ invertScale: checked })}
                  />

                  <div className="mt-3 mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                    차트 비교(Overlay)
                  </div>
                  <ToggleRow
                    label="비교선 표시"
                    checked={compare.enabled}
                    onChange={(checked) => setCompare({ enabled: checked })}
                  />
                  <div className="mb-2 grid grid-cols-2 gap-1.5">
                    <Input
                      type="text"
                      value={compare.symbol}
                      onChange={(e) => setCompare({ symbol: e.target.value })}
                      className="h-7 font-mono text-[10px]"
                      placeholder="비교 심볼"
                    />
                    <Select
                      value={compare.market}
                      onValueChange={(value) => setCompare({ market: value as typeof compare.market })}
                      className="h-7 text-[10px]"
                    >
                      <SelectItem value="usStock">US</SelectItem>
                      <SelectItem value="krStock">KR</SelectItem>
                      <SelectItem value="crypto">코인</SelectItem>
                      <SelectItem value="forex">FX</SelectItem>
                    </Select>
                  </div>
                  <ToggleRow
                    label="비교선 % 정규화"
                    checked={compare.normalize}
                    onChange={(checked) => setCompare({ normalize: checked })}
                  />

                  <div className="mt-3 mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                    멀티 차트 레이아웃
                  </div>
                  <div className="mb-2 grid grid-cols-3 gap-1.5">
                    {([
                      { value: 1 as const, label: "1분할" },
                      { value: 2 as const, label: "2분할" },
                      { value: 4 as const, label: "4분할" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMultiChartLayout(opt.value)}
                        className="rounded px-2 py-1 text-[10px] font-medium transition-colors"
                        style={{
                          background: multiChartLayout === opt.value ? "var(--primary)" : "var(--secondary)",
                          color: multiChartLayout === opt.value ? "var(--primary-foreground)" : "var(--muted-foreground)",
                          border: `1px solid ${multiChartLayout === opt.value ? "var(--primary)" : "var(--border)"}`,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                    워크스페이스
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-[10px] font-medium transition-colors"
                      style={{
                        background: "var(--secondary)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                      }}
                      onClick={exportWorkspace}
                    >
                      저장(Export)
                    </button>
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-[10px] font-medium transition-colors"
                      style={{
                        background: "var(--secondary)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                      }}
                      onClick={importWorkspace}
                    >
                      불러오기(Import)
                    </button>
                  </div>
            </AccordionSection>
          )}

          {activeTab === "layout" && (
            <AccordionSection
              value="layout"
              title="차트 레이아웃"
              subtitle="가격/지표 영역 비율"
              open={openSections.layout}
              onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, layout: open }))}
              sectionId="layout"
            >
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                프리셋
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
                          aria-label={`${preset.label} 레이아웃 프리셋 적용`}
                          style={{
                            background: active ? "var(--primary)" : "var(--card)",
                            color: active ? "var(--primary-foreground)" : "var(--muted-foreground)",
                            border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                          }}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  <SliderRow
                    label="가격 영역 높이"
                    value={layout.priceAreaRatio}
                    min={0.35}
                    max={0.85}
                    step={0.01}
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                    onChange={(v) => setIndicator("layout", { priceAreaRatio: v })}
                  />
                  <SliderRow
                    label="거래량 영역 비중"
                    value={layout.volumeWeight}
                    min={0.4}
                    max={3}
                    step={0.1}
                    formatValue={(v) => `${v.toFixed(1)}x`}
                    onChange={(v) => setIndicator("layout", { volumeWeight: v })}
                  />
                  <SliderRow
                    label="RSI 영역 비중"
                    value={layout.rsiWeight}
                    min={0.4}
                    max={3}
                    step={0.1}
                    formatValue={(v) => `${v.toFixed(1)}x`}
                    onChange={(v) => setIndicator("layout", { rsiWeight: v })}
                  />
                  <SliderRow
                    label="MACD 영역 비중"
                    value={layout.macdWeight}
                    min={0.4}
                    max={3}
                    step={0.1}
                    formatValue={(v) => `${v.toFixed(1)}x`}
                    onChange={(v) => setIndicator("layout", { macdWeight: v })}
                  />
                  <SliderRow
                    label="스토캐스틱 영역 비중"
                    value={layout.stochasticWeight}
                    min={0.4}
                    max={3}
                    step={0.1}
                    formatValue={(v) => `${v.toFixed(1)}x`}
                    onChange={(v) => setIndicator("layout", { stochasticWeight: v })}
                  />
                  <SliderRow
                    label="OBV 영역 비중"
                    value={layout.obvWeight}
                    min={0.4}
                    max={3}
                    step={0.1}
                    formatValue={(v) => `${v.toFixed(1)}x`}
                    onChange={(v) => setIndicator("layout", { obvWeight: v })}
                  />
                  <SliderRow
                    label="ATR 영역 비중"
                    value={layout.atrWeight}
                    min={0.4}
                    max={3}
                    step={0.1}
                    formatValue={(v) => `${v.toFixed(1)}x`}
                    onChange={(v) => setIndicator("layout", { atrWeight: v })}
                  />
                  <button
                    type="button"
                    className="mt-1 w-full rounded px-2 py-1 text-[10px] font-medium transition-colors"
                    style={{
                      color: "var(--muted-foreground)",
                      background: "var(--card)",
                      border: `1px solid var(--border)`,
                    }}
                    onClick={() => applyLayoutPreset("balanced")}
                  >
                    레이아웃 비율 초기화
                  </button>
            </AccordionSection>
          )}

          {activeTab === "indicators" && (
            <>
              <AccordionSection
                value="overlay"
                title="오버레이 지표"
                subtitle="밴드/추세선"
                open={openSections.overlay}
                onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, overlay: open }))}
                sectionId="overlay"
              >
                <IndicatorSection
                  title="볼린저 밴드"
                  color={COLORS.bbUpper}
                  enabled={indicators.bb.enabled}
                  onToggle={() => toggleIndicator("bb")}
                >
                  <SliderRow
                    label="기간"
                    value={indicators.bb.period}
                    min={5}
                    max={100}
                    step={1}
                    onChange={(v) => setIndicator("bb", { period: v })}
                  />
                  <SliderRow
                    label="승수"
                    value={indicators.bb.multiplier}
                    min={0.5}
                    max={4.0}
                    step={0.1}
                    onChange={(v) => setIndicator("bb", { multiplier: v })}
                  />
                </IndicatorSection>

                <IndicatorSection
                  title="재무 오버레이"
                  color="#60A5FA"
                  enabled={indicators.fundamentals.enabled}
                  onToggle={() => toggleIndicator("fundamentals")}
                />

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

                  <IndicatorSection
                    title="VWAP"
                    color="#06B6D4"
                    enabled={indicators.vwap.enabled}
                    onToggle={() => toggleIndicator("vwap")}
                  />

                  <IndicatorSection
                    title="Ichimoku"
                    color="#F59E0B"
                    enabled={indicators.ichimoku.enabled}
                    onToggle={() => toggleIndicator("ichimoku")}
                  />

                  <IndicatorSection
                    title="Supertrend"
                    color="#22C55E"
                    enabled={indicators.supertrend.enabled}
                    onToggle={() => toggleIndicator("supertrend")}
                  />

                <IndicatorSection
                  title="Parabolic SAR"
                  color="#F97316"
                  enabled={indicators.psar.enabled}
                  onToggle={() => toggleIndicator("psar")}
                />
              </AccordionSection>

              <AccordionSection
                value="oscillators"
                title="오실레이터"
                subtitle="모멘텀/반전 신호"
                open={openSections.oscillators}
                onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, oscillators: open }))}
                sectionId="oscillators"
              >
                <IndicatorSection
                  title="RSI"
                  color={COLORS.rsiLine}
                  enabled={indicators.rsi.enabled}
                  onToggle={() => toggleIndicator("rsi")}
                >
                  <SliderRow
                    label="기간"
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
                      label="단기 기간"
                      value={indicators.macd.fastPeriod}
                      min={2}
                      max={50}
                      step={1}
                      onChange={(v) => setIndicator("macd", { fastPeriod: v })}
                    />
                    <SliderRow
                      label="장기 기간"
                      value={indicators.macd.slowPeriod}
                      min={5}
                      max={100}
                      step={1}
                      onChange={(v) => setIndicator("macd", { slowPeriod: v })}
                    />
                    <SliderRow
                      label="시그널 기간"
                      value={indicators.macd.signalPeriod}
                      min={2}
                      max={50}
                      step={1}
                      onChange={(v) => setIndicator("macd", { signalPeriod: v })}
                    />
                  </IndicatorSection>

                  <IndicatorSection
                    title="스토캐스틱"
                    color={COLORS.stochK}
                    enabled={indicators.stochastic.enabled}
                    onToggle={() => toggleIndicator("stochastic")}
                  >
                    <SliderRow
                      label="%K 기간"
                      value={indicators.stochastic.kPeriod}
                      min={2}
                      max={50}
                      step={1}
                      onChange={(v) => setIndicator("stochastic", { kPeriod: v })}
                    />
                    <SliderRow
                      label="%D 기간"
                      value={indicators.stochastic.dPeriod}
                      min={2}
                      max={20}
                      step={1}
                      onChange={(v) => setIndicator("stochastic", { dPeriod: v })}
                    />
                    <SliderRow
                      label="스무딩"
                      value={indicators.stochastic.smooth}
                      min={1}
                      max={10}
                      step={1}
                      onChange={(v) => setIndicator("stochastic", { smooth: v })}
                    />
                  </IndicatorSection>

                <IndicatorSection
                  title="ATR"
                  color="#38BDF8"
                  enabled={indicators.atr.enabled}
                  onToggle={() => toggleIndicator("atr")}
                />
              </AccordionSection>

              <AccordionSection
                value="quant"
                title="퀀트 필터"
                subtitle="레짐/모멘텀/변동성"
                open={openSections.quant}
                onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, quant: open }))}
                sectionId="quant"
              >
                <IndicatorSection
                  title="매수/매도 구간 배경"
                  color="#22C55E"
                  enabled={indicators.signalZones.enabled}
                  onToggle={() => toggleIndicator("signalZones")}
                />

                <IndicatorSection
                  title="Quanting 신호 필터"
                  color="#06B6D4"
                  enabled={quant.enabled}
                  onToggle={() => toggleIndicator("signalFilter")}
                >
                  <ToggleRow
                    label="레짐 필터 적용"
                    checked={quant.applyRegimeFilter}
                    onChange={(checked) => setIndicator("signalFilter", { applyRegimeFilter: checked })}
                  />
                  <SliderRow
                    label="레짐 기간"
                    value={quant.regimePeriod}
                    min={20}
                    max={300}
                    step={1}
                    onChange={(v) => setIndicator("signalFilter", { regimePeriod: v })}
                  />
                  <SliderRow
                    label="레짐 버퍼"
                    value={quant.regimeBuffer}
                    min={0}
                    max={0.02}
                    step={0.001}
                    formatValue={(v) => v.toFixed(3)}
                    onChange={(v) => setIndicator("signalFilter", { regimeBuffer: v })}
                  />
                  <ToggleRow
                    label="모멘텀 필터 적용"
                    checked={quant.applyMomentumFilter}
                    onChange={(checked) => setIndicator("signalFilter", { applyMomentumFilter: checked })}
                  />
                  <SliderRow
                    label="모멘텀 기간"
                    value={quant.momentumPeriod}
                    min={10}
                    max={252}
                    step={1}
                    onChange={(v) => setIndicator("signalFilter", { momentumPeriod: v })}
                  />
                  <SliderRow
                    label="매수 최소 모멘텀"
                    value={quant.minMomentumForBuy}
                    min={-0.3}
                    max={0}
                    step={0.01}
                    formatValue={(v) => `${(v * 100).toFixed(1)}%`}
                    onChange={(v) => setIndicator("signalFilter", { minMomentumForBuy: v })}
                  />
                  <SliderRow
                    label="매도 최대 모멘텀"
                    value={quant.maxMomentumForSell}
                    min={0}
                    max={0.3}
                    step={0.01}
                    formatValue={(v) => `${(v * 100).toFixed(1)}%`}
                    onChange={(v) => setIndicator("signalFilter", { maxMomentumForSell: v })}
                  />
                  <ToggleRow
                    label="변동성 필터 적용"
                    checked={quant.applyVolatilityFilter}
                    onChange={(checked) => setIndicator("signalFilter", { applyVolatilityFilter: checked })}
                  />
                  <SliderRow
                    label="변동성 기간"
                    value={quant.volatilityPeriod}
                    min={5}
                    max={100}
                    step={1}
                    onChange={(v) => setIndicator("signalFilter", { volatilityPeriod: v })}
                  />
                  <SliderRow
                    label="변동성 랭크 기간"
                    value={quant.volatilityRankPeriod}
                    min={20}
                    max={252}
                    step={1}
                    onChange={(v) => setIndicator("signalFilter", { volatilityRankPeriod: v })}
                  />
                  <SliderRow
                    label="고변동성 분위수"
                    value={quant.highVolPercentile}
                    min={0.5}
                    max={0.99}
                    step={0.01}
                    formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                    onChange={(v) => setIndicator("signalFilter", { highVolPercentile: v })}
                  />
                  <ToggleRow
                    label="강한 역추세 신호 유지"
                    checked={quant.keepStrongCounterTrend}
                    onChange={(checked) => setIndicator("signalFilter", { keepStrongCounterTrend: checked })}
                  />
                  <ToggleRow
                    label="고변동성 강신호 유지"
                    checked={quant.keepStrongInHighVol}
                    onChange={(checked) => setIndicator("signalFilter", { keepStrongInHighVol: checked })}
                  />
                </IndicatorSection>
              </AccordionSection>

              <AccordionSection
                value="volume"
                title="거래량/자금흐름"
                subtitle="거래량/OBV 오버레이"
                open={openSections.volume}
                onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, volume: open }))}
                sectionId="volume"
              >
                <IndicatorSection
                  title="거래량"
                  color="var(--success)"
                  enabled={indicators.volume.enabled}
                  onToggle={() => toggleIndicator("volume")}
                />
                <IndicatorSection
                  title="OBV(온밸런스볼륨)"
                  color="#14B8A6"
                  enabled={indicators.obv.enabled}
                  onToggle={() => toggleIndicator("obv")}
                />
                <IndicatorSection
                  title="볼륨 프로파일"
                  color="#60A5FA"
                  enabled={indicators.volumeProfile.enabled}
                  onToggle={() => toggleIndicator("volumeProfile")}
                >
                  <SliderRow
                    label="가격 구간(Bins)"
                    value={indicators.volumeProfile.bins}
                    min={12}
                    max={60}
                    step={1}
                    onChange={(v) => setIndicator("volumeProfile", { bins: v })}
                  />
                </IndicatorSection>
              </AccordionSection>

              <AccordionSection
                value="alerts"
                title="알림"
                subtitle="가격 도달 알림 / 이력"
                open={openSections.alerts}
                onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, alerts: open }))}
                sectionId="alerts"
              >
                <div className="mb-2 flex items-center gap-1.5">
                    <Input
                      type="number"
                      step="any"
                      value={alertInput}
                      onChange={(e) => setAlertInput(e.target.value)}
                      placeholder={`${symbol} 알림 가격`}
                      className="h-7 flex-1 font-mono text-[10px]"
                    />
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-[10px] font-medium"
                      style={{ background: "#22C55E", color: "#052e16" }}
                      onClick={() => submitAlert("above")}
                    >
                      ↑ 위로
                    </button>
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-[10px] font-medium"
                      style={{ background: "#F97316", color: "#431407" }}
                      onClick={() => submitAlert("below")}
                    >
                      ↓ 아래로
                    </button>
                  </div>
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                    현재 알림 ({priceAlerts.filter((a) => a.symbol === symbol && a.market === market).length})
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {priceAlerts
                      .filter((a) => a.symbol === symbol && a.market === market)
                      .map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between rounded border px-2 py-1 text-[10px]"
                          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                        >
                          <div className="font-mono">
                            {alert.condition === "above" ? "↑" : "↓"} {alert.price.toFixed(4)}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="rounded px-1.5 py-0.5"
                              style={{
                                background: alert.active ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.15)",
                                color: alert.active ? "#22C55E" : "var(--muted-foreground)",
                              }}
                              onClick={() => togglePriceAlert(alert.id)}
                            >
                              {alert.active ? "활성" : "중지"}
                            </button>
                            <button
                              type="button"
                              className="rounded px-1.5 py-0.5"
                              style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}
                              onClick={() => removePriceAlert(alert.id)}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    {priceAlerts.filter((a) => a.symbol === symbol && a.market === market).length === 0 && (
                      <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                        등록된 알림이 없습니다.
                      </div>
                    )}
                  </div>

                  <div className="mt-2 mb-1 flex items-center justify-between">
                    <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                      알림 이력 ({alertHistory.length})
                    </div>
                    <button
                      type="button"
                      className="rounded px-1.5 py-0.5 text-[10px]"
                      style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                      onClick={clearAlertHistory}
                    >
                      이력 초기화
                    </button>
                  </div>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {alertHistory.slice(0, 20).map((item) => (
                    <div key={item.id} className="text-[10px] font-mono" style={{ color: "var(--muted-foreground)" }}>
                      {item.symbol} {item.condition === "above" ? "↑" : "↓"} {item.price.toFixed(4)} @{" "}
                      {item.triggeredPrice.toFixed(4)}
                    </div>
                  ))}
                  {alertHistory.length === 0 && (
                    <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                      발생 이력이 없습니다.
                    </div>
                  )}
                </div>
              </AccordionSection>
            </>
          )}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
