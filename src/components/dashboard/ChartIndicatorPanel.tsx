import {
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/react/shallow";
import { Slider } from "@/components/ui/slider";
import { useSettingsStore, type IndicatorConfig } from "../../stores/useSettingsStore";
import { COLORS, MA_COLORS } from "../../utils/constants";

type IndicatorKey = Exclude<keyof IndicatorConfig, "layout" | "signalStrategies">;
type IndicatorGroup = "upper" | "lower";
type LayoutWeightKey = Exclude<keyof IndicatorConfig["layout"], "priceAreaRatio">;
type SignalStrategyBooleanKey = Exclude<
  keyof IndicatorConfig["signalStrategies"],
  "emaFastPeriod" | "emaSlowPeriod" | "divergenceSwingLength"
>;

interface IndicatorMetaItem {
  key: IndicatorKey;
  group: IndicatorGroup;
  label: string;
  description: string;
  color: string;
}

const UPPER_INDICATORS: readonly IndicatorKey[] = [
  "bb",
  "sma",
  "ema",
  "ichimoku",
  "vwap",
  "supertrend",
  "psar",
  "hma",
  "donchian",
  "keltner",
  "volumeProfile",
  "fundamentals",
  "signalZones",
  "smc",
  "anchoredVwap",
  "autoFib",
] as const;

const LOWER_INDICATORS: readonly IndicatorKey[] = [
  "volume",
  "rsi",
  "macd",
  "stochastic",
  "obv",
  "atr",
  "mfi",
  "cmf",
  "choppiness",
  "williamsR",
  "adx",
  "cvd",
  "rvol",
  "stc",
] as const;

const LOWER_INDICATOR_LAYOUT_MAP: Partial<Record<IndicatorKey, { key: LayoutWeightKey; label: string }>> = {
  volume: { key: "volumeWeight", label: "패널 높이" },
  rsi: { key: "rsiWeight", label: "패널 높이" },
  macd: { key: "macdWeight", label: "패널 높이" },
  stochastic: { key: "stochasticWeight", label: "패널 높이" },
  obv: { key: "obvWeight", label: "패널 높이" },
  atr: { key: "atrWeight", label: "패널 높이" },
  mfi: { key: "mfiWeight", label: "패널 높이" },
  cmf: { key: "cmfWeight", label: "패널 높이" },
  choppiness: { key: "chopWeight", label: "패널 높이" },
  williamsR: { key: "willrWeight", label: "패널 높이" },
  adx: { key: "adxWeight", label: "패널 높이" },
  cvd: { key: "cvdWeight", label: "패널 높이" },
  rvol: { key: "rvolWeight", label: "패널 높이" },
  stc: { key: "stcWeight", label: "패널 높이" },
};

const STRATEGY_LINKS: Partial<
  Record<IndicatorKey, Array<{ key: SignalStrategyBooleanKey; label: string }>>
> = {
  macd: [{ key: "macdHistReversal", label: "MACD 히스토그램 반전" }],
  rsi: [{ key: "rsiDivergence", label: "RSI 다이버전스" }],
  stochastic: [{ key: "stochRsiCombined", label: "스토캐스틱 + RSI" }],
  ema: [{ key: "emaCrossover", label: "EMA 교차" }],
  vwap: [{ key: "vwapBreakout", label: "VWAP 돌파" }],
  supertrend: [{ key: "supertrendAdx", label: "Supertrend + ADX" }],
  psar: [{ key: "parabolicSar", label: "파라볼릭 SAR" }],
};

const INDICATOR_META: Record<IndicatorKey, IndicatorMetaItem> = {
  bb: {
    key: "bb",
    group: "upper",
    label: "볼린저 밴드",
    description: "가격 변동성을 표준편차 밴드로 감싸서 추세와 과열 구간을 함께 봅니다.",
    color: COLORS.bbUpper,
  },
  sma: {
    key: "sma",
    group: "upper",
    label: "이동평균선",
    description: "단순 이동평균선을 여러 기간으로 겹쳐서 추세 방향과 지지·저항을 확인합니다.",
    color: MA_COLORS[0],
  },
  ema: {
    key: "ema",
    group: "upper",
    label: "지수이동평균선",
    description: "최근 가격에 더 큰 가중치를 둔 이동평균선입니다.",
    color: MA_COLORS[1],
  },
  ichimoku: {
    key: "ichimoku",
    group: "upper",
    label: "일목균형표",
    description: "구름대와 전환선·기준선으로 추세와 균형 구간을 함께 확인합니다.",
    color: "#F59E0B",
  },
  vwap: {
    key: "vwap",
    group: "upper",
    label: "VWAP",
    description: "거래량 가중 평균 가격으로 장중 평균 체결 가격의 기준선을 제공합니다.",
    color: "#06B6D4",
  },
  supertrend: {
    key: "supertrend",
    group: "upper",
    label: "슈퍼트렌드",
    description: "추세 방향을 색상과 밴드로 빠르게 보여주는 추세 추종 지표입니다.",
    color: "#22C55E",
  },
  psar: {
    key: "psar",
    group: "upper",
    label: "파라볼릭 SAR",
    description: "추세 전환 가능 지점을 점 형태로 표시합니다.",
    color: "#F97316",
  },
  hma: {
    key: "hma",
    group: "upper",
    label: "Hull 이동평균",
    description: "지연을 줄인 이동평균으로 추세 반응을 더 빠르게 확인합니다.",
    color: "#14B8A6",
  },
  donchian: {
    key: "donchian",
    group: "upper",
    label: "돈치안 채널",
    description: "최근 고가·저가 범위를 채널로 표시해서 돌파 구간을 확인합니다.",
    color: COLORS.donchianUpper,
  },
  keltner: {
    key: "keltner",
    group: "upper",
    label: "켈트너 채널",
    description: "EMA와 ATR 기반 밴드로 추세와 변동성을 함께 표시합니다.",
    color: COLORS.keltnerUpper,
  },
  volumeProfile: {
    key: "volumeProfile",
    group: "upper",
    label: "거래량 프로파일",
    description: "가격대별 체결량을 보여줘서 매물대와 거래 집중 영역을 파악합니다.",
    color: "#60A5FA",
  },
  fundamentals: {
    key: "fundamentals",
    group: "upper",
    label: "재무 오버레이",
    description: "재무·밸류에이션 관련 컨텍스트를 차트와 함께 표시합니다.",
    color: "#60A5FA",
  },
  signalZones: {
    key: "signalZones",
    group: "upper",
    label: "매수/매도 구간",
    description: "전략 신호에 따른 매수·매도 우세 구간을 차트 배경으로 표시합니다.",
    color: "#22C55E",
  },
  smc: {
    key: "smc",
    group: "upper",
    label: "매물대분석",
    description: "스마트머니 컨셉 기반 스윙 구조를 사용해 주요 구조 구간을 강조합니다.",
    color: COLORS.smcBosBull,
  },
  anchoredVwap: {
    key: "anchoredVwap",
    group: "upper",
    label: "앵커드 VWAP",
    description: "특정 기준 시점에서 시작한 VWAP으로 중기 기준 가격대를 확인합니다.",
    color: COLORS.anchoredVwap,
  },
  autoFib: {
    key: "autoFib",
    group: "upper",
    label: "오토 피보나치",
    description: "최근 스윙을 자동으로 감지해 피보나치 레벨을 표시합니다.",
    color: COLORS.autoFib,
  },
  volume: {
    key: "volume",
    group: "lower",
    label: "거래량",
    description: "봉별 거래량과 추세선을 하단 또는 메인 차트 하단에서 함께 보여줍니다.",
    color: COLORS.volumeUp,
  },
  rsi: {
    key: "rsi",
    group: "lower",
    label: "RSI",
    description: "과매수·과매도 구간을 추적하는 대표적인 모멘텀 오실레이터입니다.",
    color: COLORS.rsiLine,
  },
  macd: {
    key: "macd",
    group: "lower",
    label: "MACD",
    description: "추세 모멘텀과 시그널 교차를 함께 확인하는 오실레이터입니다.",
    color: COLORS.macdLine,
  },
  stochastic: {
    key: "stochastic",
    group: "lower",
    label: "스토캐스틱",
    description: "최근 종가가 범위 안에서 어느 위치에 있는지 확인합니다.",
    color: COLORS.stochK,
  },
  obv: {
    key: "obv",
    group: "lower",
    label: "OBV",
    description: "거래량 누적으로 가격 추세를 보조 확인합니다.",
    color: "#818CF8",
  },
  atr: {
    key: "atr",
    group: "lower",
    label: "ATR",
    description: "평균 진폭으로 시장 변동성 크기를 보여줍니다.",
    color: "#38BDF8",
  },
  mfi: {
    key: "mfi",
    group: "lower",
    label: "MFI",
    description: "가격과 거래량을 함께 반영한 자금 흐름 지표입니다.",
    color: COLORS.mfiLine,
  },
  cmf: {
    key: "cmf",
    group: "lower",
    label: "CMF",
    description: "누적 매수·매도 압력을 거래량과 함께 해석합니다.",
    color: COLORS.cmfLine,
  },
  choppiness: {
    key: "choppiness",
    group: "lower",
    label: "Choppiness",
    description: "시장 상태가 추세인지 횡보인지 판단하는 데 도움을 줍니다.",
    color: COLORS.chopLine,
  },
  williamsR: {
    key: "williamsR",
    group: "lower",
    label: "Williams %R",
    description: "최근 범위 대비 현재 가격 위치를 강하게 표현하는 모멘텀 지표입니다.",
    color: COLORS.willrLine,
  },
  adx: {
    key: "adx",
    group: "lower",
    label: "ADX",
    description: "추세의 강도만 분리해서 확인하는 지표입니다.",
    color: COLORS.adxLine,
  },
  cvd: {
    key: "cvd",
    group: "lower",
    label: "CVD",
    description: "체결 우위를 누적해서 매수·매도 압력의 방향을 추적합니다.",
    color: COLORS.cvdLine,
  },
  rvol: {
    key: "rvol",
    group: "lower",
    label: "상대 거래량",
    description: "평균 대비 현재 거래량이 얼마나 높은지 비교합니다.",
    color: COLORS.rvolHigh,
  },
  stc: {
    key: "stc",
    group: "lower",
    label: "STC",
    description: "MACD와 순환 주기를 결합한 추세 전환용 오실레이터입니다.",
    color: COLORS.stcLine,
  },
};

function CheckGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function PlusGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function clampValue(value: number, min?: number, max?: number) {
  let next = value;
  if (typeof min === "number") next = Math.max(min, next);
  if (typeof max === "number") next = Math.min(max, next);
  return next;
}

function updatePeriodAt(periods: number[], index: number, next: number) {
  return periods.map((period, itemIndex) => (itemIndex === index ? next : period));
}

function removePeriodAt(periods: number[], index: number) {
  if (periods.length <= 1) return periods;
  return periods.filter((_, itemIndex) => itemIndex !== index);
}

function buildNextPeriod(periods: number[]) {
  const last = periods[periods.length - 1] ?? 20;
  if (last < 10) return last + 5;
  if (last < 50) return last + 10;
  if (last < 100) return last + 20;
  return last + 50;
}

function IndicatorNumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="chart-indicator-panel__field">
      <span className="chart-indicator-panel__field-label">{label}</span>
      <span className="chart-indicator-panel__input-shell">
        <input
          type="number"
          inputMode="decimal"
          className="chart-indicator-panel__input"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            const nextValue = Number(event.target.value);
            if (!Number.isFinite(nextValue)) return;
            onChange(clampValue(nextValue, min, max));
          }}
        />
      </span>
    </label>
  );
}

function IndicatorInfoNote({ children }: { children: string }) {
  return <div className="chart-indicator-panel__note">{children}</div>;
}

function IndicatorSectionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="chart-indicator-panel__section-block">
      <div className="chart-indicator-panel__section-title">{title}</div>
      {children}
    </section>
  );
}

function IndicatorToggleChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`chart-indicator-panel__toggle-chip${active ? " is-active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function IndicatorPeriodsEditor({
  labelPrefix,
  periods,
  onChange,
}: {
  labelPrefix: string;
  periods: number[];
  onChange: (next: number[]) => void;
}) {
  return (
    <div className="chart-indicator-panel__period-editor">
      {periods.map((period, index) => (
        <div key={`${labelPrefix}-${index}-${period}`} className="chart-indicator-panel__period-row">
          <span className="chart-indicator-panel__field-label">{`${labelPrefix}${index + 1}`}</span>
          <span className="chart-indicator-panel__style-pill">
            <span
              className="chart-indicator-panel__style-swatch"
              style={{ background: MA_COLORS[index % MA_COLORS.length] }}
            />
            1px
          </span>
          <span className="chart-indicator-panel__input-shell">
            <input
              type="number"
              inputMode="numeric"
              className="chart-indicator-panel__input"
              value={period}
              min={1}
              step={1}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                if (!Number.isFinite(nextValue)) return;
                onChange(updatePeriodAt(periods, index, clampValue(Math.round(nextValue), 1)));
              }}
            />
          </span>
          <button
            type="button"
            className="chart-indicator-panel__remove-button"
            onClick={() => onChange(removePeriodAt(periods, index))}
            aria-label={`${labelPrefix}${index + 1} 제거`}
            disabled={periods.length <= 1}
          >
            <CloseGlyph />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="chart-indicator-panel__add-button"
        onClick={() => onChange([...periods, buildNextPeriod(periods)])}
      >
        <PlusGlyph />
        <span>기간 추가</span>
      </button>
    </div>
  );
}

interface ChartIndicatorPanelProps {
  anchorRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  panelRef?: RefObject<HTMLDivElement | null>;
}

export default function ChartIndicatorPanel({
  anchorRef,
  onClose,
  panelRef,
}: ChartIndicatorPanelProps) {
  const { indicators, setIndicator, toggleIndicator } = useSettingsStore(
    useShallow((state) => ({
      indicators: state.indicators,
      setIndicator: state.setIndicator,
      toggleIndicator: state.toggleIndicator,
    })),
  );

  const initialSelection = useMemo<IndicatorKey>(() => {
    const activeKey = [...UPPER_INDICATORS, ...LOWER_INDICATORS].find((key) => indicators[key].enabled);
    return activeKey ?? "bb";
  }, [indicators]);
  const [selectedKey, setSelectedKey] = useState<IndicatorKey>(initialSelection);

  const selectedMeta = INDICATOR_META[selectedKey];
  const selectedIndicator = indicators[selectedKey];
  const upperActiveCount = UPPER_INDICATORS.filter((key) => indicators[key].enabled).length;
  const lowerActiveCount = LOWER_INDICATORS.filter((key) => indicators[key].enabled).length;
  const selectedLayoutWeightConfig = LOWER_INDICATOR_LAYOUT_MAP[selectedKey];
  const selectedStrategyLinks = STRATEGY_LINKS[selectedKey] ?? [];
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor || typeof window === "undefined") return;

      const rect = anchor.getBoundingClientRect();
      const gap = 10;
      const viewportPadding = 16;
      const preferredWidth = Math.min(672, window.innerWidth - viewportPadding * 2);
      const nextLeft = Math.min(
        Math.max(viewportPadding, rect.left),
        Math.max(viewportPadding, window.innerWidth - preferredWidth - viewportPadding),
      );
      const nextTop = rect.bottom + gap;
      const nextHeight = Math.max(320, Math.min(624, window.innerHeight - nextTop - viewportPadding));

      setPanelStyle({
        top: nextTop,
        left: nextLeft,
        height: nextHeight,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef]);

  const renderLowerIndicatorLayoutControl = () => {
    if (!selectedLayoutWeightConfig) return null;
    const currentValue = indicators.layout[selectedLayoutWeightConfig.key];
    return (
      <IndicatorSectionBlock title="패널 배치">
        <div className="chart-indicator-panel__weight-header">
          <span className="chart-indicator-panel__field-label">{selectedLayoutWeightConfig.label}</span>
          <span className="chart-indicator-panel__weight-value">{currentValue.toFixed(1)}x</span>
        </div>
        <Slider
          min={0.2}
          max={3}
          step={0.1}
          value={[currentValue]}
          onValueChange={(next) =>
            setIndicator("layout", {
              [selectedLayoutWeightConfig.key]: next[0] ?? currentValue,
            } as Partial<IndicatorConfig["layout"]>)
          }
          aria-label={`${selectedMeta.label} 패널 높이`}
          className="chart-indicator-panel__slider"
        />
      </IndicatorSectionBlock>
    );
  };

  const renderStrategyLinks = () => {
    if (selectedStrategyLinks.length === 0) return null;
    return (
      <IndicatorSectionBlock title="관련 시그널">
        <div className="chart-indicator-panel__toggle-grid">
          {selectedStrategyLinks.map((item) => {
            const active = indicators.signalStrategies[item.key];
            return (
              <IndicatorToggleChip
                key={item.key}
                active={active}
                label={item.label}
                onClick={() =>
                  setIndicator("signalStrategies", {
                    [item.key]: !active,
                  } as Partial<IndicatorConfig["signalStrategies"]>)
                }
              />
            );
          })}
        </div>
      </IndicatorSectionBlock>
    );
  };

  const renderSelectedSettings = () => {
    switch (selectedKey) {
      case "bb":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="기간"
              value={indicators.bb.period}
              min={5}
              max={100}
              onChange={(value) => setIndicator("bb", { period: Math.round(value) })}
            />
            <IndicatorNumberField
              label="표준편차"
              value={indicators.bb.multiplier}
              min={0.5}
              max={4}
              step={0.1}
              onChange={(value) => setIndicator("bb", { multiplier: value })}
            />
          </div>
        );
      case "sma":
        return <IndicatorPeriodsEditor labelPrefix="기간" periods={indicators.sma.periods} onChange={(periods) => setIndicator("sma", { periods })} />;
      case "ema":
        return <IndicatorPeriodsEditor labelPrefix="기간" periods={indicators.ema.periods} onChange={(periods) => setIndicator("ema", { periods })} />;
      case "hma":
        return <IndicatorPeriodsEditor labelPrefix="기간" periods={indicators.hma.periods} onChange={(periods) => setIndicator("hma", { periods })} />;
      case "donchian":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="채널 기간"
              value={indicators.donchian.period}
              min={5}
              max={100}
              onChange={(value) => setIndicator("donchian", { period: Math.round(value) })}
            />
          </div>
        );
      case "keltner":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="EMA 기간"
              value={indicators.keltner.emaPeriod}
              min={5}
              max={50}
              onChange={(value) => setIndicator("keltner", { emaPeriod: Math.round(value) })}
            />
            <IndicatorNumberField
              label="ATR 기간"
              value={indicators.keltner.atrPeriod}
              min={5}
              max={50}
              onChange={(value) => setIndicator("keltner", { atrPeriod: Math.round(value) })}
            />
            <IndicatorNumberField
              label="ATR 배수"
              value={indicators.keltner.atrMultiplier}
              min={0.5}
              max={4}
              step={0.1}
              onChange={(value) => setIndicator("keltner", { atrMultiplier: value })}
            />
          </div>
        );
      case "volumeProfile":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="가격 구간 수"
              value={indicators.volumeProfile.bins}
              min={8}
              max={80}
              onChange={(value) => setIndicator("volumeProfile", { bins: Math.round(value) })}
            />
          </div>
        );
      case "smc":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="스윙 길이"
              value={indicators.smc.swingLength}
              min={2}
              max={20}
              onChange={(value) => setIndicator("smc", { swingLength: Math.round(value) })}
            />
          </div>
        );
      case "anchoredVwap":
        return (
          <div className="chart-indicator-panel__stack">
            <IndicatorInfoNote>
              앵커 기준점은 차트 상에서 지정됩니다. 아래 버튼으로 저장된 기준 시점을 초기화할 수 있습니다.
            </IndicatorInfoNote>
            <div className="chart-indicator-panel__inline-actions">
              <button
                type="button"
                className="chart-indicator-panel__secondary-button"
                onClick={() => setIndicator("anchoredVwap", { anchorTime: null })}
              >
                기준 시점 초기화
              </button>
            </div>
          </div>
        );
      case "autoFib":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="조회 기간"
              value={indicators.autoFib.lookback}
              min={20}
              max={500}
              step={10}
              onChange={(value) => setIndicator("autoFib", { lookback: Math.round(value) })}
            />
            <IndicatorNumberField
              label="스윙 길이"
              value={indicators.autoFib.swingLength}
              min={2}
              max={20}
              onChange={(value) => setIndicator("autoFib", { swingLength: Math.round(value) })}
            />
          </div>
        );
      case "rsi":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="RSI 기간"
              value={indicators.rsi.period}
              min={2}
              max={50}
              onChange={(value) => setIndicator("rsi", { period: Math.round(value) })}
            />
          </div>
        );
      case "macd":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="단기 EMA"
              value={indicators.macd.fastPeriod}
              min={2}
              max={50}
              onChange={(value) => setIndicator("macd", { fastPeriod: Math.round(value) })}
            />
            <IndicatorNumberField
              label="장기 EMA"
              value={indicators.macd.slowPeriod}
              min={5}
              max={100}
              onChange={(value) => setIndicator("macd", { slowPeriod: Math.round(value) })}
            />
            <IndicatorNumberField
              label="시그널"
              value={indicators.macd.signalPeriod}
              min={2}
              max={50}
              onChange={(value) => setIndicator("macd", { signalPeriod: Math.round(value) })}
            />
          </div>
        );
      case "stochastic":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="%K 기간"
              value={indicators.stochastic.kPeriod}
              min={2}
              max={50}
              onChange={(value) => setIndicator("stochastic", { kPeriod: Math.round(value) })}
            />
            <IndicatorNumberField
              label="%D 기간"
              value={indicators.stochastic.dPeriod}
              min={2}
              max={20}
              onChange={(value) => setIndicator("stochastic", { dPeriod: Math.round(value) })}
            />
            <IndicatorNumberField
              label="스무딩"
              value={indicators.stochastic.smooth}
              min={1}
              max={10}
              onChange={(value) => setIndicator("stochastic", { smooth: Math.round(value) })}
            />
          </div>
        );
      case "mfi":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="기간"
              value={indicators.mfi.period}
              min={2}
              max={50}
              onChange={(value) => setIndicator("mfi", { period: Math.round(value) })}
            />
          </div>
        );
      case "cmf":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="기간"
              value={indicators.cmf.period}
              min={2}
              max={50}
              onChange={(value) => setIndicator("cmf", { period: Math.round(value) })}
            />
          </div>
        );
      case "choppiness":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="기간"
              value={indicators.choppiness.period}
              min={2}
              max={50}
              onChange={(value) => setIndicator("choppiness", { period: Math.round(value) })}
            />
          </div>
        );
      case "williamsR":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="기간"
              value={indicators.williamsR.period}
              min={2}
              max={50}
              onChange={(value) => setIndicator("williamsR", { period: Math.round(value) })}
            />
          </div>
        );
      case "adx":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="기간"
              value={indicators.adx.period}
              min={2}
              max={50}
              onChange={(value) => setIndicator("adx", { period: Math.round(value) })}
            />
          </div>
        );
      case "rvol":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="비교 기간"
              value={indicators.rvol.period}
              min={2}
              max={100}
              onChange={(value) => setIndicator("rvol", { period: Math.round(value) })}
            />
          </div>
        );
      case "stc":
        return (
          <div className="chart-indicator-panel__field-grid">
            <IndicatorNumberField
              label="TC 기간"
              value={indicators.stc.tcLen}
              min={2}
              max={30}
              onChange={(value) => setIndicator("stc", { tcLen: Math.round(value) })}
            />
            <IndicatorNumberField
              label="단기 MA"
              value={indicators.stc.fastMa}
              min={5}
              max={50}
              onChange={(value) => setIndicator("stc", { fastMa: Math.round(value) })}
            />
            <IndicatorNumberField
              label="장기 MA"
              value={indicators.stc.slowMa}
              min={20}
              max={100}
              onChange={(value) => setIndicator("stc", { slowMa: Math.round(value) })}
            />
          </div>
        );
      case "volume":
      case "obv":
      case "atr":
      case "vwap":
      case "ichimoku":
      case "supertrend":
      case "psar":
      case "fundamentals":
      case "signalZones":
      case "cvd":
        return (
          <IndicatorInfoNote>
            이 지표는 현재 버전에서 표시 여부만 바로 조정할 수 있습니다. 세부 파라미터는 기본값으로 동작합니다.
          </IndicatorInfoNote>
        );
      default:
        return null;
    }
  };

  const renderGroup = (title: string, subtitle: string, items: readonly IndicatorKey[]) => (
    <section className="chart-indicator-panel__group">
      <div className="chart-indicator-panel__group-header">
        <div className="chart-indicator-panel__group-title">{title}</div>
        <div className="chart-indicator-panel__group-subtitle">{subtitle}</div>
      </div>
      <div className="chart-indicator-panel__group-items">
        {items.map((key) => {
          const meta = INDICATOR_META[key];
          const enabled = indicators[key].enabled;
          const selected = selectedKey === key;
          return (
            <button
              key={key}
              type="button"
              className={`chart-indicator-panel__nav-item${selected ? " is-active" : ""}`}
              onClick={() => setSelectedKey(key)}
            >
              <span className="chart-indicator-panel__nav-copy">
                <span className="chart-indicator-panel__nav-title">{meta.label}</span>
              </span>
              <button
                type="button"
                className={`chart-indicator-panel__nav-status${enabled ? " is-enabled" : ""}`}
                aria-label={enabled ? `${meta.label} 비활성화` : `${meta.label} 활성화`}
                aria-pressed={enabled}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleIndicator(key);
                }}
              >
                {enabled ? <CheckGlyph /> : null}
              </button>
            </button>
          );
        })}
      </div>
    </section>
  );

  if (typeof document === "undefined" || panelStyle === null) {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      className="chart-indicator-panel"
      role="dialog"
      aria-modal="false"
      aria-label="보조지표 설정"
      style={{
        top: panelStyle.top,
        left: panelStyle.left,
        height: panelStyle.height,
      }}
    >
      <div className="chart-indicator-panel__sidebar">
        <div className="chart-indicator-panel__summary">
          <span className="chart-indicator-panel__summary-chip">상단 {upperActiveCount}</span>
          <span className="chart-indicator-panel__summary-chip">하단 {lowerActiveCount}</span>
        </div>
        {renderGroup("상단 지표", "차트 위 오버레이", UPPER_INDICATORS)}
        {renderGroup("하단 지표", "오실레이터 / 거래량", LOWER_INDICATORS)}
      </div>

      <div className="chart-indicator-panel__details">
        <div className="chart-indicator-panel__details-header">
          <div className="chart-indicator-panel__details-copy">
            <div className="chart-indicator-panel__details-title-row">
              <span
                className="chart-indicator-panel__details-swatch"
                style={{ background: selectedMeta.color }}
                aria-hidden="true"
              />
              <h3 className="chart-indicator-panel__details-title">{selectedMeta.label}</h3>
            </div>
            <p className="chart-indicator-panel__details-description">{selectedMeta.description}</p>
          </div>
          <div className="chart-indicator-panel__details-actions">
            <button
              type="button"
              className="chart-indicator-panel__icon-button"
              onClick={onClose}
              aria-label="보조지표 패널 닫기"
            >
              <CloseGlyph />
            </button>
          </div>
        </div>

        <div className="chart-indicator-panel__content">
          {!selectedIndicator.enabled ? (
            <IndicatorInfoNote>
              현재는 비활성 상태입니다. 왼쪽 목록의 체크 버튼을 누르면 바로 차트에 표시됩니다.
            </IndicatorInfoNote>
          ) : null}
          {renderLowerIndicatorLayoutControl()}
          {renderStrategyLinks()}
          {renderSelectedSettings()}
        </div>
      </div>
    </div>,
    document.body,
  );
}
