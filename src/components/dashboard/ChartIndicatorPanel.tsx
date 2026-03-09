import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/react/shallow";
import { Slider } from "@/components/ui/slider";
import {
  extractIndicatorStyleFields,
  getIndicatorDefaultConfig,
  useSettingsStore,
  type IndicatorConfig,
} from "../../stores/useSettingsStore";
import { CHART_COLOR_PRESETS, COLORS, MA_COLORS } from "../../utils/constants";
import { getLowerIndicatorDisplayColor, type LowerIndicatorPaneId } from "../../utils/lowerIndicatorPanes";
import { INDICATOR_GUIDE, type IndicatorGuide } from "../../utils/indicatorGuide";

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

const STYLE_PICKER_COLORS = [
  "#374151", "#3554C7", "#6B2D90", "#B12B2B", "#E16A1B", "#D48A29", "#2F6F71", "#357E4C",
  "#5A6273", "#4269E1", "#7E31B3", "#D03838", "#E98525", "#E7A33B", "#3F9090", "#479A5D",
  "#8B93A3", "#4E7BE8", "#9340C8", "#E05252", "#F0A02B", "#EDC04F", "#52A8A8", "#52B470",
  "#C8CDD5", "#74A0F0", "#B16AD8", "#E78E94", "#F1BE57", "#EED26E", "#7BC4C8", "#6DCB95",
] as const;

const STYLE_PICKER_WIDTHS = [1, 2, 3] as const;

const STYLE_PICKER_LINE_STYLES = [
  { value: 0, label: "실선", dasharray: "" },
  { value: 2, label: "대시", dasharray: "6,4" },
  { value: 1, label: "도트", dasharray: "2,3" },
] as const;

function toLowerPaneId(key: IndicatorKey): LowerIndicatorPaneId | null {
  switch (key) {
    case "volume":
    case "rsi":
    case "macd":
    case "obv":
    case "atr":
    case "mfi":
    case "cmf":
    case "adx":
    case "cvd":
    case "rvol":
    case "stc":
      return key;
    case "stochastic":
      return "stoch";
    case "choppiness":
      return "chop";
    case "williamsR":
      return "willr";
    default:
      return null;
  }
}

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

const INDICATOR_GUIDE_KEY_MAP: Partial<Record<IndicatorKey, string>> = {
  bb: "볼린저 밴드", sma: "SMA", ema: "EMA", ichimoku: "Ichimoku",
  vwap: "VWAP", supertrend: "Supertrend", psar: "Parabolic SAR",
  hma: "HMA", donchian: "Donchian Channels", keltner: "Keltner Channels",
  volumeProfile: "볼륨 프로파일", signalZones: "Quanting 신호 필터",
  smc: "SMC (스마트머니)", anchoredVwap: "Anchored VWAP", autoFib: "Auto Fibonacci",
  volume: "거래량", rsi: "RSI", macd: "MACD", stochastic: "스토캐스틱",
  obv: "OBV(온밸런스볼륨)", atr: "ATR", mfi: "MFI", cmf: "CMF",
  choppiness: "Choppiness Index", williamsR: "Williams %R", adx: "ADX",
  cvd: "CVD(누적거래량델타)", rvol: "거래량 비율(RVOL)", stc: "STC",
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

const FIELD_LABEL_MAP: Partial<Record<string, string>> = {
  period: "기간",
  periods: "기간 목록",
  multiplier: "표준편차",
  lineColor: "선 색상",
  lineWidth: "선 굵기",
  lineStyle: "선 유형",
  fillOpacity: "밴드 채우기",
  color: "색상",
  macdColor: "MACD 색상",
  signalColor: "시그널 색상",
  histogramOpacity: "히스토그램 투명도",
  macdLineWidth: "MACD 굵기",
  signalLineWidth: "시그널 굵기",
  macdLineStyle: "MACD 선 유형",
  signalLineStyle: "시그널 선 유형",
  kPeriod: "%K 기간",
  dPeriod: "%D 기간",
  smooth: "스무딩",
  kColor: "%K 색상",
  dColor: "%D 색상",
  kLineWidth: "%K 굵기",
  dLineWidth: "%D 굵기",
  kLineStyle: "%K 선 유형",
  dLineStyle: "%D 선 유형",
  opacity: "봉 투명도",
  bins: "가격 구간 수",
  emaPeriod: "EMA 기간",
  atrPeriod: "ATR 기간",
  atrMultiplier: "ATR 배수",
  plusDiColor: "+DI 색상",
  minusDiColor: "-DI 색상",
  diLineWidth: "DI 굵기",
  diLineStyle: "DI 선 유형",
  highColor: "강한 거래량 색상",
  neutralColor: "중립 거래량 색상",
  lowColor: "약한 거래량 색상",
  tcLen: "TC 기간",
  fastMa: "단기 MA",
  slowMa: "장기 MA",
  swingLength: "스윙 길이",
  lookback: "조회 기간",
  anchorTime: "앵커 시점",
};

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${key}:${stableSerialize(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function areValuesEqual(a: unknown, b: unknown): boolean {
  return stableSerialize(a) === stableSerialize(b);
}

function getChangedFieldLabels(
  current: Record<string, unknown>,
  defaults: Record<string, unknown>,
): Array<{ key: string; label: string }> {
  return Object.keys({ ...defaults, ...current })
    .filter((key) => key !== "enabled")
    .filter((key) => !areValuesEqual(current[key], defaults[key]))
    .map((key) => ({
      key,
      label: FIELD_LABEL_MAP[key] ?? key,
    }));
}

function matchesIndicatorSearch(meta: IndicatorMetaItem, query: string): boolean {
  if (!query) return true;
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return `${meta.label} ${meta.description}`.toLowerCase().includes(normalized);
}

function colorWithOpacity(hex: string, opacity: number): string {
  const alpha = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  return `${hex}${alpha}`;
}

function getPanelHeightBounds(top: number) {
  if (typeof window === "undefined") {
    return { minHeight: 320, maxHeight: 624, defaultHeight: 624 };
  }
  const minHeight = 320;
  const maxHeight = Math.max(minHeight, Math.min(780, window.innerHeight - top - 16));
  const defaultHeight = Math.max(minHeight, Math.min(624, maxHeight));
  return { minHeight, maxHeight, defaultHeight };
}

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

function lineStyleToDasharray(style: number): string {
  switch (style) {
    case 1: return "2,3";
    case 2: return "6,4";
    case 3: return "8,6";
    case 4: return "2,5";
    default: return "";
  }
}

function IndicatorStylePicker({
  label,
  value,
  onChange,
  lineWidth,
  onLineWidthChange,
  lineStyle,
  onLineStyleChange,
  hideColorPicker,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  lineWidth?: number;
  onLineWidthChange?: (value: number) => void;
  lineStyle?: number;
  onLineStyleChange?: (value: number) => void;
  hideColorPicker?: boolean;
}) {
  const colorTriggerRef = useRef<HTMLButtonElement | null>(null);
  const styleTriggerRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const nativeColorRef = useRef<HTMLInputElement | null>(null);
  const [openPanel, setOpenPanel] = useState<"color" | "style" | null>(null);
  const [popupStyle, setPopupStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const [hexInput, setHexInput] = useState("");
  const selectedColor = value.startsWith("#") ? value.slice(0, 7).toUpperCase() : value.toUpperCase();

  useEffect(() => {
    if (openPanel === "color") {
      setHexInput(selectedColor.replace("#", ""));
    }
  }, [openPanel, selectedColor]);
  const hasStyle = typeof lineWidth === "number" && onLineWidthChange;

  useLayoutEffect(() => {
    if (!openPanel) return;

    const updatePosition = () => {
      const trigger = openPanel === "style" ? styleTriggerRef.current : colorTriggerRef.current;
      if (!trigger || typeof window === "undefined") return;
      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 16;
      const popupWidth = Math.min(openPanel === "color" ? 318 : 232, window.innerWidth - viewportPadding * 2);
      const preferredLeft = rect.left;
      const left = Math.min(
        Math.max(viewportPadding, preferredLeft),
        Math.max(viewportPadding, window.innerWidth - popupWidth - viewportPadding),
      );
      const hasLineStyleSection = openPanel === "style" && typeof lineStyle === "number" && onLineStyleChange;
      const estimatedHeight = openPanel === "color" ? 280 : hasLineStyleSection ? 310 : 154;
      const nextTop =
        rect.bottom + estimatedHeight + 12 <= window.innerHeight - viewportPadding
          ? rect.bottom + 10
          : Math.max(viewportPadding, rect.top - estimatedHeight - 10);

      setPopupStyle({ top: nextTop, left, width: popupWidth });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [openPanel, lineStyle, onLineStyleChange]);

  useEffect(() => {
    if (!openPanel) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (colorTriggerRef.current?.contains(target)) return;
      if (styleTriggerRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      setOpenPanel(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPanel(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openPanel]);

  const currentDasharray = lineStyleToDasharray(lineStyle ?? 0);

  return (
    <label className="chart-indicator-panel__field">
      <span className="chart-indicator-panel__field-label">{label}</span>
      <div className="chart-indicator-panel__style-controls">
        {!hideColorPicker && (
          <button
            ref={colorTriggerRef}
            type="button"
            className={`chart-indicator-panel__style-trigger${openPanel === "color" ? " is-open" : ""}`}
            onClick={() => setOpenPanel((prev) => (prev === "color" ? null : "color"))}
            aria-label={`${label} 색상 선택`}
            aria-expanded={openPanel === "color"}
          >
            <span
              className="chart-indicator-panel__style-trigger-swatch"
              style={{ background: value }}
              aria-hidden="true"
            />
            <span className="chart-indicator-panel__style-trigger-copy">
              <span className="chart-indicator-panel__style-trigger-value">색상</span>
              <span className="chart-indicator-panel__style-trigger-meta">{selectedColor}</span>
            </span>
          </button>
        )}
        {hasStyle ? (
          <button
            ref={styleTriggerRef}
            type="button"
            className={`chart-indicator-panel__style-trigger chart-indicator-panel__style-trigger--width${openPanel === "style" ? " is-open" : ""}`}
            onClick={() => setOpenPanel((prev) => (prev === "style" ? null : "style"))}
            aria-label={`${label} 스타일 선택`}
            aria-expanded={openPanel === "style"}
          >
            <svg width="28" height="12" viewBox="0 0 28 12" aria-hidden="true" className="chart-indicator-panel__style-trigger-svg">
              <line x1="0" y1="6" x2="28" y2="6" stroke="currentColor" strokeWidth={lineWidth} strokeDasharray={currentDasharray} />
            </svg>
            <span className="chart-indicator-panel__style-trigger-copy">
              <span className="chart-indicator-panel__style-trigger-value">스타일</span>
              <span className="chart-indicator-panel__style-trigger-meta">{lineWidth}px</span>
            </span>
          </button>
        ) : null}
      </div>
      {openPanel && popupStyle && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={popupRef}
              className="chart-indicator-panel__style-popup"
              style={{
                top: popupStyle.top,
                left: popupStyle.left,
                width: popupStyle.width,
              }}
            >
              {openPanel === "color" ? (
                <div className="chart-indicator-panel__style-popup-section">
                  <div className="chart-indicator-panel__style-popup-title">컬러</div>
                  <div className="chart-indicator-panel__style-grid">
                    {STYLE_PICKER_COLORS.map((color) => (
                      <button
                        key={`${label}-${color}`}
                        type="button"
                        className={`chart-indicator-panel__style-color${selectedColor === color ? " is-selected" : ""}`}
                        style={{ background: color }}
                        aria-label={`${label} 색상 ${color}`}
                        onClick={() => {
                          onChange(color);
                          setOpenPanel(null);
                        }}
                      />
                    ))}
                  </div>
                  <div className="chart-indicator-panel__hex-row">
                    <span
                      className="chart-indicator-panel__hex-preview"
                      style={{ background: /^[0-9A-Fa-f]{6}$/.test(hexInput) ? `#${hexInput}` : value }}
                    />
                    <span className="chart-indicator-panel__hex-prefix">#</span>
                    <input
                      type="text"
                      className="chart-indicator-panel__hex-input"
                      value={hexInput}
                      maxLength={6}
                      spellCheck={false}
                      onChange={(e) => setHexInput(e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6))}
                      onBlur={() => {
                        if (/^[0-9A-Fa-f]{6}$/.test(hexInput)) {
                          onChange(`#${hexInput.toUpperCase()}`);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && /^[0-9A-Fa-f]{6}$/.test(hexInput)) {
                          onChange(`#${hexInput.toUpperCase()}`);
                          setOpenPanel(null);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="chart-indicator-panel__color-pick-btn"
                      aria-label="OS 컬러 피커 열기"
                      onClick={() => nativeColorRef.current?.click()}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a10 10 0 1 0 0 20 2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H5.1A10 10 0 0 1 12 2Z" />
                        <circle cx="8" cy="10" r="1.2" fill="currentColor" /><circle cx="12" cy="7" r="1.2" fill="currentColor" /><circle cx="16" cy="10" r="1.2" fill="currentColor" />
                      </svg>
                    </button>
                    <input
                      ref={nativeColorRef}
                      type="color"
                      value={selectedColor}
                      style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
                      onChange={(e) => {
                        const hex = e.target.value.toUpperCase();
                        onChange(hex);
                        setHexInput(hex.replace("#", ""));
                      }}
                    />
                  </div>
                </div>
              ) : hasStyle ? (
                <>
                  <div className="chart-indicator-panel__style-preview">
                    <svg width="100%" height="16" viewBox="0 0 200 16" preserveAspectRatio="none">
                      <line x1="8" y1="8" x2="192" y2="8" stroke={value} strokeWidth={lineWidth} strokeDasharray={currentDasharray} />
                    </svg>
                  </div>
                  <div className="chart-indicator-panel__style-popup-section">
                    <div className="chart-indicator-panel__style-popup-title">굵기</div>
                    <div className="chart-indicator-panel__style-width-grid">
                      {STYLE_PICKER_WIDTHS.map((width) => (
                        <button
                          key={`${label}-w${width}`}
                          type="button"
                          className={`chart-indicator-panel__style-width${lineWidth === width ? " is-selected" : ""}`}
                          onClick={() => onLineWidthChange(width)}
                        >
                          <span
                            className="chart-indicator-panel__style-width-line"
                            style={{ height: width }}
                            aria-hidden="true"
                          />
                          <span className="chart-indicator-panel__style-width-label">{width}px</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {typeof lineStyle === "number" && onLineStyleChange ? (
                    <div className="chart-indicator-panel__style-popup-section">
                      <div className="chart-indicator-panel__style-popup-title">선 유형</div>
                      <div className="chart-indicator-panel__style-linestyle-grid">
                        {STYLE_PICKER_LINE_STYLES.map((ls) => (
                          <button
                            key={`${label}-ls${ls.value}`}
                            type="button"
                            className={`chart-indicator-panel__style-linestyle${lineStyle === ls.value ? " is-selected" : ""}`}
                            onClick={() => onLineStyleChange(ls.value)}
                          >
                            <svg width="32" height="10" viewBox="0 0 32 10" aria-hidden="true">
                              <line x1="0" y1="5" x2="32" y2="5" stroke={value} strokeWidth={lineWidth ?? 2} strokeDasharray={ls.dasharray} />
                            </svg>
                            <span className="chart-indicator-panel__style-linestyle-label">{ls.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>,
            document.body,
          )
        : null}
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
  const {
    indicators, chartColorStyle, setIndicator, toggleIndicator,
    resetIndicator, resetIndicatorStyle, stylePresets, saveStylePreset, loadStylePreset, deleteStylePreset,
  } = useSettingsStore(
    useShallow((state) => ({
      indicators: state.indicators,
      chartColorStyle: state.chartColorStyle,
      setIndicator: state.setIndicator,
      toggleIndicator: state.toggleIndicator,
      resetIndicator: state.resetIndicator,
      resetIndicatorStyle: state.resetIndicatorStyle,
      stylePresets: state.stylePresets,
      saveStylePreset: state.saveStylePreset,
      loadStylePreset: state.loadStylePreset,
      deleteStylePreset: state.deleteStylePreset,
    })),
  );

  const [presetFormOpen, setPresetFormOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userHeight, setUserHeight] = useState<number | null>(null);
  const resizeStateRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const getComparableDefaultConfig = (key: IndicatorKey): Record<string, unknown> => {
    const base = getIndicatorDefaultConfig(key) as Record<string, unknown>;
    const palette = CHART_COLOR_PRESETS[chartColorStyle];

    if (key === "volume") {
      const volumeBase = base as IndicatorConfig["volume"];
      return {
        ...volumeBase,
        upColor: colorWithOpacity(palette.up, volumeBase.opacity),
        downColor: colorWithOpacity(palette.down, volumeBase.opacity),
      };
    }

    if (key === "macd") {
      const macdBase = base as IndicatorConfig["macd"];
      return {
        ...macdBase,
        histogramUpColor: colorWithOpacity(palette.up, macdBase.histogramOpacity),
        histogramDownColor: colorWithOpacity(palette.down, macdBase.histogramOpacity),
      };
    }

    return base;
  };

  const initialSelection = useMemo<IndicatorKey>(() => {
    const activeKey = [...UPPER_INDICATORS, ...LOWER_INDICATORS].find((key) => indicators[key].enabled);
    return activeKey ?? "bb";
  }, [indicators]);
  const [selectedKey, setSelectedKey] = useState<IndicatorKey>(initialSelection);

  const selectedMeta = INDICATOR_META[selectedKey];
  const selectedGuide: IndicatorGuide | undefined =
    INDICATOR_GUIDE[INDICATOR_GUIDE_KEY_MAP[selectedKey] ?? ""];
  const selectedIndicator = indicators[selectedKey];
  const selectedDefault = getComparableDefaultConfig(selectedKey);
  const selectedIndicatorRecord = selectedIndicator as Record<string, unknown>;
  const selectedStyleSnapshot = extractIndicatorStyleFields(selectedIndicatorRecord);
  const selectedDefaultStyleSnapshot = extractIndicatorStyleFields(selectedDefault);
  const selectedChangedFields = useMemo(
    () => getChangedFieldLabels(selectedIndicatorRecord, selectedDefault),
    [selectedIndicatorRecord, selectedDefault],
  );
  const selectedChangedStyleFields = useMemo(
    () => getChangedFieldLabels(selectedStyleSnapshot, selectedDefaultStyleSnapshot),
    [selectedStyleSnapshot, selectedDefaultStyleSnapshot],
  );
  const hasCustomChanges = selectedChangedFields.length > 0;
  const hasStyleChanges = selectedChangedStyleFields.length > 0;
  const selectedPaneId = toLowerPaneId(selectedKey);
  const selectedAccentColor =
    selectedMeta.group === "lower" && selectedPaneId
      ? getLowerIndicatorDisplayColor(indicators, selectedPaneId)
      : selectedMeta.color;
  const upperActiveCount = UPPER_INDICATORS.filter((key) => indicators[key].enabled).length;
  const lowerActiveCount = LOWER_INDICATORS.filter((key) => indicators[key].enabled).length;
  const selectedLayoutWeightConfig = LOWER_INDICATOR_LAYOUT_MAP[selectedKey];
  const selectedStrategyLinks = STRATEGY_LINKS[selectedKey] ?? [];
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; height: number } | null>(null);
  const customizedCount = useMemo(
    () =>
      [...UPPER_INDICATORS, ...LOWER_INDICATORS].filter((key) => {
        const current = indicators[key] as Record<string, unknown>;
        const defaults = getComparableDefaultConfig(key);
        return getChangedFieldLabels(current, defaults).length > 0;
      }).length,
    [chartColorStyle, indicators],
  );
  const filteredUpperIndicators = useMemo(
    () => UPPER_INDICATORS.filter((key) => matchesIndicatorSearch(INDICATOR_META[key], searchQuery)),
    [searchQuery],
  );
  const filteredLowerIndicators = useMemo(
    () => LOWER_INDICATORS.filter((key) => matchesIndicatorSearch(INDICATOR_META[key], searchQuery)),
    [searchQuery],
  );

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
      const { minHeight, maxHeight, defaultHeight } = getPanelHeightBounds(nextTop);
      const nextHeight = Math.min(maxHeight, Math.max(minHeight, userHeight ?? defaultHeight));

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
  }, [anchorRef, userHeight]);

  useEffect(() => {
    setPresetFormOpen(false);
    setPresetName("");
  }, [selectedKey]);

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      const resizeState = resizeStateRef.current;
      const currentPanelStyle = panelStyle;
      if (!resizeState || !currentPanelStyle) return;
      const { minHeight, maxHeight } = getPanelHeightBounds(currentPanelStyle.top);
      const deltaY = event.clientY - resizeState.startY;
      const nextHeight = Math.min(maxHeight, Math.max(minHeight, resizeState.startHeight + deltaY));
      setUserHeight(nextHeight);
    };

    const handlePointerUp = () => {
      resizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [panelStyle]);

  const handleResizeStart = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (!panelStyle) return;
    event.preventDefault();
    resizeStateRef.current = {
      startY: event.clientY,
      startHeight: panelStyle.height,
    };
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  };

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

  const renderLowerIndicatorStyleControls = () => {
    switch (selectedKey) {
      case "volume":
        return (
          <IndicatorSectionBlock title="스타일">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorNumberField
                label="봉 투명도"
                value={indicators.volume.opacity}
                min={0.1}
                max={1}
                step={0.05}
                onChange={(value) => setIndicator("volume", { opacity: value })}
              />
            </div>
            <IndicatorInfoNote>거래량 색상은 해외식/한국식 등락 색상 프리셋을 따르며, 여기서는 투명도만 조정합니다.</IndicatorInfoNote>
          </IndicatorSectionBlock>
        );
      case "rsi":
        return (
          <IndicatorSectionBlock title="스타일">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorStylePicker
                label="선 스타일"
                value={indicators.rsi.color}
                onChange={(value) => setIndicator("rsi", { color: value })}
                lineWidth={indicators.rsi.lineWidth}
                onLineWidthChange={(value) => setIndicator("rsi", { lineWidth: value })}
                lineStyle={indicators.rsi.lineStyle}
                onLineStyleChange={(value) => setIndicator("rsi", { lineStyle: value })}
              />
            </div>
          </IndicatorSectionBlock>
        );
      case "macd":
        return (
          <IndicatorSectionBlock title="스타일">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorStylePicker
                label="MACD 스타일"
                value={indicators.macd.macdColor}
                onChange={(value) => setIndicator("macd", { macdColor: value })}
                lineWidth={indicators.macd.macdLineWidth}
                onLineWidthChange={(value) => setIndicator("macd", { macdLineWidth: value })}
                lineStyle={indicators.macd.macdLineStyle}
                onLineStyleChange={(value) => setIndicator("macd", { macdLineStyle: value })}
              />
              <IndicatorStylePicker
                label="시그널 스타일"
                value={indicators.macd.signalColor}
                onChange={(value) => setIndicator("macd", { signalColor: value })}
                lineWidth={indicators.macd.signalLineWidth}
                onLineWidthChange={(value) => setIndicator("macd", { signalLineWidth: value })}
                lineStyle={indicators.macd.signalLineStyle}
                onLineStyleChange={(value) => setIndicator("macd", { signalLineStyle: value })}
              />
              <IndicatorNumberField
                label="히스토그램 투명도"
                value={indicators.macd.histogramOpacity}
                min={0.1}
                max={1}
                step={0.05}
                onChange={(value) => setIndicator("macd", { histogramOpacity: value })}
              />
            </div>
            <IndicatorInfoNote>MACD 히스토그램 색상은 해외식/한국식 등락 색상 프리셋을 따르며, 여기서는 투명도만 조정합니다.</IndicatorInfoNote>
          </IndicatorSectionBlock>
        );
      case "stochastic":
        return (
          <IndicatorSectionBlock title="스타일">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorStylePicker
                label="%K 스타일"
                value={indicators.stochastic.kColor}
                onChange={(value) => setIndicator("stochastic", { kColor: value })}
                lineWidth={indicators.stochastic.kLineWidth}
                onLineWidthChange={(value) => setIndicator("stochastic", { kLineWidth: value })}
                lineStyle={indicators.stochastic.kLineStyle}
                onLineStyleChange={(value) => setIndicator("stochastic", { kLineStyle: value })}
              />
              <IndicatorStylePicker
                label="%D 스타일"
                value={indicators.stochastic.dColor}
                onChange={(value) => setIndicator("stochastic", { dColor: value })}
                lineWidth={indicators.stochastic.dLineWidth}
                onLineWidthChange={(value) => setIndicator("stochastic", { dLineWidth: value })}
                lineStyle={indicators.stochastic.dLineStyle}
                onLineStyleChange={(value) => setIndicator("stochastic", { dLineStyle: value })}
              />
            </div>
          </IndicatorSectionBlock>
        );
      case "obv":
      case "atr":
      case "mfi":
      case "cmf":
      case "choppiness":
      case "williamsR":
      case "cvd":
      case "stc": {
        const config = indicators[selectedKey];
        if (!("color" in config) || !("lineWidth" in config)) return null;
        const hasLs = "lineStyle" in config;
        return (
          <IndicatorSectionBlock title="스타일">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorStylePicker
                label="선 스타일"
                value={config.color}
                onChange={(value) =>
                  setIndicator(selectedKey, { color: value } as Partial<IndicatorConfig[typeof selectedKey]>)
                }
                lineWidth={config.lineWidth}
                onLineWidthChange={(value) =>
                  setIndicator(selectedKey, { lineWidth: value } as Partial<IndicatorConfig[typeof selectedKey]>)
                }
                lineStyle={hasLs ? (config as { lineStyle: number }).lineStyle : undefined}
                onLineStyleChange={hasLs ? (value) =>
                  setIndicator(selectedKey, { lineStyle: value } as Partial<IndicatorConfig[typeof selectedKey]>)
                : undefined}
              />
            </div>
          </IndicatorSectionBlock>
        );
      }
      case "adx":
        return (
          <IndicatorSectionBlock title="스타일">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorStylePicker
                label="ADX 스타일"
                value={indicators.adx.color}
                onChange={(value) => setIndicator("adx", { color: value })}
                lineWidth={indicators.adx.lineWidth}
                onLineWidthChange={(value) => setIndicator("adx", { lineWidth: value })}
                lineStyle={indicators.adx.lineStyle}
                onLineStyleChange={(value) => setIndicator("adx", { lineStyle: value })}
              />
              <IndicatorStylePicker
                label="+DI 스타일"
                value={indicators.adx.plusDiColor}
                onChange={(value) => setIndicator("adx", { plusDiColor: value })}
                lineWidth={indicators.adx.diLineWidth}
                onLineWidthChange={(value) => setIndicator("adx", { diLineWidth: value })}
                lineStyle={indicators.adx.diLineStyle}
                onLineStyleChange={(value) => setIndicator("adx", { diLineStyle: value })}
              />
              <IndicatorStylePicker
                label="-DI 스타일"
                value={indicators.adx.minusDiColor}
                onChange={(value) => setIndicator("adx", { minusDiColor: value })}
                lineWidth={indicators.adx.diLineWidth}
                onLineWidthChange={(value) => setIndicator("adx", { diLineWidth: value })}
                lineStyle={indicators.adx.diLineStyle}
                onLineStyleChange={(value) => setIndicator("adx", { diLineStyle: value })}
              />
            </div>
          </IndicatorSectionBlock>
        );
      case "rvol":
        return (
          <IndicatorSectionBlock title="스타일">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorStylePicker
                label="강한 거래량"
                value={indicators.rvol.highColor}
                onChange={(value) => setIndicator("rvol", { highColor: value })}
              />
              <IndicatorStylePicker
                label="중립 거래량"
                value={indicators.rvol.neutralColor}
                onChange={(value) => setIndicator("rvol", { neutralColor: value })}
              />
              <IndicatorStylePicker
                label="약한 거래량"
                value={indicators.rvol.lowColor}
                onChange={(value) => setIndicator("rvol", { lowColor: value })}
              />
            </div>
          </IndicatorSectionBlock>
        );
      default:
        return null;
    }
  };

  const renderSelectedSettings = () => {
    switch (selectedKey) {
      case "bb":
        return (
          <>
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
            <IndicatorSectionBlock title="스타일">
              <div className="chart-indicator-panel__field-grid">
                <IndicatorStylePicker
                  label="선 스타일"
                  value={indicators.bb.lineColor}
                  onChange={(value) => setIndicator("bb", { lineColor: value })}
                  lineWidth={indicators.bb.lineWidth}
                  onLineWidthChange={(value) => setIndicator("bb", { lineWidth: value })}
                  lineStyle={indicators.bb.lineStyle}
                  onLineStyleChange={(value) => setIndicator("bb", { lineStyle: value })}
                />
                <IndicatorNumberField
                  label="밴드 채우기"
                  value={indicators.bb.fillOpacity}
                  min={0}
                  max={0.5}
                  step={0.01}
                  onChange={(value) => setIndicator("bb", { fillOpacity: value })}
                />
              </div>
              <IndicatorInfoNote>밴드 채우기는 상단-하단 밴드 사이 영역의 투명도입니다. 0이면 채우기 없음.</IndicatorInfoNote>
            </IndicatorSectionBlock>
          </>
        );
      case "sma":
        return (
          <>
            <IndicatorPeriodsEditor labelPrefix="기간" periods={indicators.sma.periods} onChange={(periods) => setIndicator("sma", { periods })} />
            <IndicatorSectionBlock title="스타일">
              <div className="chart-indicator-panel__field-grid">
                <IndicatorStylePicker
                  label="선 스타일"
                  value="#000000"
                  onChange={() => {}}
                  hideColorPicker
                  lineWidth={indicators.sma.lineWidth}
                  onLineWidthChange={(value) => setIndicator("sma", { lineWidth: value })}
                  lineStyle={indicators.sma.lineStyle}
                  onLineStyleChange={(value) => setIndicator("sma", { lineStyle: value })}
                />
              </div>
              <IndicatorInfoNote>SMA 색상은 기간별로 자동 배정됩니다. 굵기와 선 유형은 모든 기간에 공통 적용됩니다.</IndicatorInfoNote>
            </IndicatorSectionBlock>
          </>
        );
      case "ema":
        return (
          <>
            <IndicatorPeriodsEditor labelPrefix="기간" periods={indicators.ema.periods} onChange={(periods) => setIndicator("ema", { periods })} />
            <IndicatorSectionBlock title="스타일">
              <div className="chart-indicator-panel__field-grid">
                <IndicatorStylePicker
                  label="선 스타일"
                  value="#000000"
                  onChange={() => {}}
                  hideColorPicker
                  lineWidth={indicators.ema.lineWidth}
                  onLineWidthChange={(value) => setIndicator("ema", { lineWidth: value })}
                  lineStyle={indicators.ema.lineStyle}
                  onLineStyleChange={(value) => setIndicator("ema", { lineStyle: value })}
                />
              </div>
              <IndicatorInfoNote>EMA 색상은 기간별로 자동 배정됩니다. 굵기와 선 유형은 모든 기간에 공통 적용됩니다.</IndicatorInfoNote>
            </IndicatorSectionBlock>
          </>
        );
      case "hma":
        return (
          <>
            <IndicatorPeriodsEditor labelPrefix="기간" periods={indicators.hma.periods} onChange={(periods) => setIndicator("hma", { periods })} />
            <IndicatorSectionBlock title="스타일">
              <div className="chart-indicator-panel__field-grid">
                <IndicatorStylePicker
                  label="선 스타일"
                  value="#000000"
                  onChange={() => {}}
                  hideColorPicker
                  lineWidth={indicators.hma.lineWidth}
                  onLineWidthChange={(value) => setIndicator("hma", { lineWidth: value })}
                  lineStyle={indicators.hma.lineStyle}
                  onLineStyleChange={(value) => setIndicator("hma", { lineStyle: value })}
                />
              </div>
              <IndicatorInfoNote>HMA 색상은 기간별로 자동 배정됩니다. 굵기와 선 유형은 모든 기간에 공통 적용됩니다.</IndicatorInfoNote>
            </IndicatorSectionBlock>
          </>
        );
      case "vwap":
        return (
          <IndicatorSectionBlock title="스타일">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorStylePicker
                label="선 스타일"
                value={indicators.vwap.color}
                onChange={(value) => setIndicator("vwap", { color: value })}
                lineWidth={indicators.vwap.lineWidth}
                onLineWidthChange={(value) => setIndicator("vwap", { lineWidth: value })}
                lineStyle={indicators.vwap.lineStyle}
                onLineStyleChange={(value) => setIndicator("vwap", { lineStyle: value })}
              />
            </div>
          </IndicatorSectionBlock>
        );
      case "supertrend":
        return (
          <IndicatorSectionBlock title="스타일">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorStylePicker
                label="선 굵기"
                value="#000000"
                onChange={() => {}}
                hideColorPicker
                lineWidth={indicators.supertrend.lineWidth}
                onLineWidthChange={(value) => setIndicator("supertrend", { lineWidth: value })}
              />
            </div>
            <IndicatorInfoNote>Supertrend 색상은 방향(상승/하락)에 따라 자동 결정됩니다.</IndicatorInfoNote>
          </IndicatorSectionBlock>
        );
      case "psar":
        return (
          <IndicatorSectionBlock title="스타일">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorStylePicker
                label="선 스타일"
                value={indicators.psar.color}
                onChange={(value) => setIndicator("psar", { color: value })}
                lineWidth={indicators.psar.lineWidth}
                onLineWidthChange={(value) => setIndicator("psar", { lineWidth: value })}
              />
            </div>
          </IndicatorSectionBlock>
        );
      case "donchian":
        return (
          <>
            <div className="chart-indicator-panel__field-grid">
              <IndicatorNumberField
                label="채널 기간"
                value={indicators.donchian.period}
                min={5}
                max={100}
                onChange={(value) => setIndicator("donchian", { period: Math.round(value) })}
              />
            </div>
            <IndicatorSectionBlock title="스타일">
              <div className="chart-indicator-panel__field-grid">
                <IndicatorStylePicker
                  label="밴드 스타일"
                  value={indicators.donchian.lineColor}
                  onChange={(value) => setIndicator("donchian", { lineColor: value })}
                  lineWidth={indicators.donchian.lineWidth}
                  onLineWidthChange={(value) => setIndicator("donchian", { lineWidth: value })}
                />
              </div>
            </IndicatorSectionBlock>
          </>
        );
      case "keltner":
        return (
          <>
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
            <IndicatorSectionBlock title="스타일">
              <div className="chart-indicator-panel__field-grid">
                <IndicatorStylePicker
                  label="밴드 스타일"
                  value={indicators.keltner.lineColor}
                  onChange={(value) => setIndicator("keltner", { lineColor: value })}
                  lineWidth={indicators.keltner.lineWidth}
                  onLineWidthChange={(value) => setIndicator("keltner", { lineWidth: value })}
                />
              </div>
            </IndicatorSectionBlock>
          </>
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
          <div className="chart-indicator-panel__stack">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorNumberField
                label="RSI 기간"
                value={indicators.rsi.period}
                min={2}
                max={50}
                onChange={(value) => setIndicator("rsi", { period: Math.round(value) })}
              />
            </div>
            {renderLowerIndicatorStyleControls()}
          </div>
        );
      case "macd":
        return (
          <div className="chart-indicator-panel__stack">
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
            {renderLowerIndicatorStyleControls()}
          </div>
        );
      case "stochastic":
        return (
          <div className="chart-indicator-panel__stack">
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
            {renderLowerIndicatorStyleControls()}
          </div>
        );
      case "mfi":
        return (
          <div className="chart-indicator-panel__stack">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorNumberField
                label="기간"
                value={indicators.mfi.period}
                min={2}
                max={50}
                onChange={(value) => setIndicator("mfi", { period: Math.round(value) })}
              />
            </div>
            {renderLowerIndicatorStyleControls()}
          </div>
        );
      case "cmf":
        return (
          <div className="chart-indicator-panel__stack">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorNumberField
                label="기간"
                value={indicators.cmf.period}
                min={2}
                max={50}
                onChange={(value) => setIndicator("cmf", { period: Math.round(value) })}
              />
            </div>
            {renderLowerIndicatorStyleControls()}
          </div>
        );
      case "choppiness":
        return (
          <div className="chart-indicator-panel__stack">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorNumberField
                label="기간"
                value={indicators.choppiness.period}
                min={2}
                max={50}
                onChange={(value) => setIndicator("choppiness", { period: Math.round(value) })}
              />
            </div>
            {renderLowerIndicatorStyleControls()}
          </div>
        );
      case "williamsR":
        return (
          <div className="chart-indicator-panel__stack">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorNumberField
                label="기간"
                value={indicators.williamsR.period}
                min={2}
                max={50}
                onChange={(value) => setIndicator("williamsR", { period: Math.round(value) })}
              />
            </div>
            {renderLowerIndicatorStyleControls()}
          </div>
        );
      case "adx":
        return (
          <div className="chart-indicator-panel__stack">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorNumberField
                label="기간"
                value={indicators.adx.period}
                min={2}
                max={50}
                onChange={(value) => setIndicator("adx", { period: Math.round(value) })}
              />
            </div>
            {renderLowerIndicatorStyleControls()}
          </div>
        );
      case "rvol":
        return (
          <div className="chart-indicator-panel__stack">
            <div className="chart-indicator-panel__field-grid">
              <IndicatorNumberField
                label="비교 기간"
                value={indicators.rvol.period}
                min={2}
                max={100}
                onChange={(value) => setIndicator("rvol", { period: Math.round(value) })}
              />
            </div>
            {renderLowerIndicatorStyleControls()}
          </div>
        );
      case "stc":
        return (
          <div className="chart-indicator-panel__stack">
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
            {renderLowerIndicatorStyleControls()}
          </div>
        );
      case "volume":
        return (
          <div className="chart-indicator-panel__stack">
            <IndicatorInfoNote>
              거래량 막대 색상을 상승/하락 봉 기준으로 따로 조절할 수 있습니다.
            </IndicatorInfoNote>
            {renderLowerIndicatorStyleControls()}
          </div>
        );
      case "obv":
      case "atr":
      case "ichimoku":
      case "fundamentals":
      case "signalZones":
      case "cvd":
        return (
          <div className="chart-indicator-panel__stack">
            <IndicatorInfoNote>
              이 지표는 현재 버전에서 표시 여부와 스타일만 바로 조정할 수 있습니다.
            </IndicatorInfoNote>
            {renderLowerIndicatorStyleControls()}
          </div>
        );
      default:
        return null;
    }
  };

  const NO_STYLE_INDICATORS = new Set<IndicatorKey>([
    "signalZones", "volumeProfile", "fundamentals",
    "ichimoku", "smc", "anchoredVwap", "autoFib",
  ]);

  const renderPresetControls = () => {
    if (NO_STYLE_INDICATORS.has(selectedKey)) return null;

    const filteredPresets = stylePresets.filter((p) => p.indicatorKey === selectedKey);
    const canSavePreset = hasStyleChanges;

    return (
      <IndicatorSectionBlock title="스타일 프리셋">
        {filteredPresets.length > 0 ? (
          <div className="chart-indicator-panel__preset-list">
            {filteredPresets.map((preset) => (
              <div key={preset.id} className="chart-indicator-panel__preset-item">
                <span className="chart-indicator-panel__preset-name">{preset.name}</span>
                <button
                  type="button"
                  className="chart-indicator-panel__preset-apply"
                  onClick={() => loadStylePreset(preset.id)}
                >
                  적용
                </button>
                <button
                  type="button"
                  className="chart-indicator-panel__preset-delete"
                  onClick={() => deleteStylePreset(preset.id)}
                  aria-label={`${preset.name} 삭제`}
                >
                  <CloseGlyph />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {presetFormOpen ? (
          <div className="chart-indicator-panel__preset-save-form">
            <input
              type="text"
              className="chart-indicator-panel__hex-input"
              placeholder="프리셋 이름"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && presetName.trim() && canSavePreset) {
                  saveStylePreset(selectedKey, presetName.trim());
                  setPresetName("");
                  setPresetFormOpen(false);
                }
              }}
              style={{ flex: 1, width: "auto" }}
            />
            <button
              type="button"
              className="chart-indicator-panel__preset-apply"
              disabled={!presetName.trim() || !canSavePreset}
              onClick={() => {
                if (presetName.trim() && canSavePreset) {
                  saveStylePreset(selectedKey, presetName.trim());
                  setPresetName("");
                  setPresetFormOpen(false);
                }
              }}
            >
              저장
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="chart-indicator-panel__secondary-button"
            onClick={() => setPresetFormOpen(true)}
            disabled={!canSavePreset}
          >
            스타일 저장
          </button>
        )}
        {!canSavePreset ? (
          <IndicatorInfoNote>기본 스타일과 동일한 상태라서 지금은 저장할 프리셋이 없습니다.</IndicatorInfoNote>
        ) : null}
      </IndicatorSectionBlock>
    );
  };

  const renderCustomizationSummary = () => {
    if (!hasCustomChanges) {
      return (
        <IndicatorInfoNote>
          현재 선택한 지표는 기본값을 그대로 사용 중입니다. 필요하면 값이나 스타일을 바꾼 뒤 프리셋으로 저장할 수 있습니다.
        </IndicatorInfoNote>
      );
    }

    return (
      <IndicatorSectionBlock title="변경 요약">
        <div className="chart-indicator-panel__change-summary">
          {selectedChangedFields.map((field) => (
            <span key={field.key} className="chart-indicator-panel__change-chip">
              {field.label}
            </span>
          ))}
        </div>
        {hasStyleChanges ? (
          <div className="chart-indicator-panel__note">
            스타일 변경: {selectedChangedStyleFields.map((field) => field.label).join(", ")}
          </div>
        ) : null}
      </IndicatorSectionBlock>
    );
  };

  const renderGroup = (title: string, subtitle: string, items: readonly IndicatorKey[]) => (
    <section className="chart-indicator-panel__group">
      <div className="chart-indicator-panel__group-header">
        <div className="chart-indicator-panel__group-title">{title}</div>
        <div className="chart-indicator-panel__group-subtitle">{subtitle}</div>
      </div>
      <div className="chart-indicator-panel__group-items">
        {items.length === 0 ? (
          <div className="chart-indicator-panel__group-empty">검색 조건에 맞는 지표가 없습니다.</div>
        ) : null}
        {items.map((key) => {
          const meta = INDICATOR_META[key];
          const enabled = indicators[key].enabled;
          const selected = selectedKey === key;
          const current = indicators[key] as Record<string, unknown>;
          const defaults = getComparableDefaultConfig(key);
          const isCustomized = getChangedFieldLabels(current, defaults).length > 0;
          return (
            <div
              key={key}
              className={`chart-indicator-panel__nav-item${selected ? " is-active" : ""}`}
            >
              <button
                type="button"
                className="chart-indicator-panel__nav-select"
                onClick={() => setSelectedKey(key)}
              >
                <span className="chart-indicator-panel__nav-copy">
                  <span>
                    <span className="chart-indicator-panel__nav-title">{meta.label}</span>
                    <span className="chart-indicator-panel__nav-subtitle">
                      {enabled ? "차트 표시 중" : "비활성"}
                      {isCustomized ? " · 커스텀" : ""}
                    </span>
                  </span>
                </span>
              </button>
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
            </div>
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
          <span className="chart-indicator-panel__summary-chip">커스텀 {customizedCount}</span>
        </div>
        <label className="chart-indicator-panel__search">
          <span className="chart-indicator-panel__field-label">지표 찾기</span>
          <span className="chart-indicator-panel__input-shell">
            <input
              type="text"
              className="chart-indicator-panel__input"
              value={searchQuery}
              placeholder="예: RSI, 볼린저, 거래량"
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </span>
        </label>
        {renderGroup("상단 지표", "차트 위 오버레이", filteredUpperIndicators)}
        {renderGroup("하단 지표", "오실레이터 / 거래량", filteredLowerIndicators)}
      </div>

      <div className="chart-indicator-panel__details">
        <div className="chart-indicator-panel__details-header">
          <div className="chart-indicator-panel__details-copy">
            <div className="chart-indicator-panel__details-title-row">
              <span
                className="chart-indicator-panel__details-swatch"
                style={{ background: selectedAccentColor }}
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
          {selectedGuide && (
            <div className="chart-indicator-panel__guide">
              <div>
                <span className="chart-indicator-panel__guide-label">요약</span>
                <p className="chart-indicator-panel__guide-text">{selectedGuide.summary}</p>
              </div>
              <div>
                <span className="chart-indicator-panel__guide-label">활용 팁</span>
                <p className="chart-indicator-panel__guide-text">{selectedGuide.tip}</p>
              </div>
            </div>
          )}
          {!selectedIndicator.enabled ? (
            <IndicatorInfoNote>
              현재는 비활성 상태입니다. 왼쪽 목록의 체크 버튼을 누르면 바로 차트에 표시됩니다.
            </IndicatorInfoNote>
          ) : null}
          {renderCustomizationSummary()}
          {renderLowerIndicatorLayoutControl()}
          {renderStrategyLinks()}
          {renderSelectedSettings()}
          {renderPresetControls()}
          <div className="chart-indicator-panel__footer-actions">
            {hasStyleChanges ? (
              <button
                type="button"
                className="chart-indicator-panel__secondary-button"
                onClick={() => resetIndicatorStyle(selectedKey)}
              >
                스타일만 초기화
              </button>
            ) : null}
            <button
              type="button"
              className="chart-indicator-panel__secondary-button"
              onClick={() => resetIndicator(selectedKey)}
              disabled={!hasCustomChanges}
            >
              초기화
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="chart-indicator-panel__resize-handle"
        onMouseDown={handleResizeStart}
        aria-label="보조지표 설정창 높이 조절"
      />
    </div>,
    document.body,
  );
}
