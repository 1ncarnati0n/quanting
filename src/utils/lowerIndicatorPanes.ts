import type { AnalysisResponse } from "../types";
import type { IndicatorConfig } from "../stores/useSettingsStore";
import { COLORS } from "./constants";
import { formatCompactNumber } from "./marketView";
import { calculateRvol } from "./rvol";

export type LowerIndicatorPaneId =
  | "volume"
  | "rsi"
  | "macd"
  | "stoch"
  | "obv"
  | "atr"
  | "mfi"
  | "cmf"
  | "chop"
  | "willr"
  | "adx"
  | "cvd"
  | "rvol"
  | "stc";

type LowerIndicatorLayoutKey =
  | "volumeWeight"
  | "rsiWeight"
  | "macdWeight"
  | "stochasticWeight"
  | "obvWeight"
  | "atrWeight"
  | "mfiWeight"
  | "cmfWeight"
  | "chopWeight"
  | "willrWeight"
  | "adxWeight"
  | "cvdWeight"
  | "rvolWeight"
  | "stcWeight";

type LowerIndicatorToggleKey =
  | "volume"
  | "rsi"
  | "macd"
  | "stochastic"
  | "obv"
  | "atr"
  | "mfi"
  | "cmf"
  | "choppiness"
  | "williamsR"
  | "adx"
  | "cvd"
  | "rvol"
  | "stc";

export interface LowerIndicatorPaneConfig {
  id: LowerIndicatorPaneId;
  label: string;
  color: string;
  weight: number;
}

export interface LowerIndicatorPaneSummary extends LowerIndicatorPaneConfig {
  detail: string | null;
  value: string;
}

export interface LowerIndicatorPaneRatioState {
  mainRatio: number;
  paneRatios: Map<LowerIndicatorPaneId, number>;
}

type LowerIndicatorPaneDefinition = {
  id: LowerIndicatorPaneId;
  indicatorKey: LowerIndicatorToggleKey;
  label: string;
  layoutKey: LowerIndicatorLayoutKey;
};

const LOWER_INDICATOR_PANE_DEFINITIONS: readonly LowerIndicatorPaneDefinition[] = [
  { id: "volume", indicatorKey: "volume", label: "거래량", layoutKey: "volumeWeight" },
  { id: "rsi", indicatorKey: "rsi", label: "RSI", layoutKey: "rsiWeight" },
  { id: "macd", indicatorKey: "macd", label: "MACD", layoutKey: "macdWeight" },
  { id: "stoch", indicatorKey: "stochastic", label: "STOCH", layoutKey: "stochasticWeight" },
  { id: "obv", indicatorKey: "obv", label: "OBV", layoutKey: "obvWeight" },
  { id: "atr", indicatorKey: "atr", label: "ATR", layoutKey: "atrWeight" },
  { id: "mfi", indicatorKey: "mfi", label: "MFI", layoutKey: "mfiWeight" },
  { id: "cmf", indicatorKey: "cmf", label: "CMF", layoutKey: "cmfWeight" },
  { id: "chop", indicatorKey: "choppiness", label: "CHOP", layoutKey: "chopWeight" },
  { id: "willr", indicatorKey: "williamsR", label: "W%R", layoutKey: "willrWeight" },
  { id: "adx", indicatorKey: "adx", label: "ADX", layoutKey: "adxWeight" },
  { id: "cvd", indicatorKey: "cvd", label: "CVD", layoutKey: "cvdWeight" },
  { id: "rvol", indicatorKey: "rvol", label: "RVOL", layoutKey: "rvolWeight" },
  { id: "stc", indicatorKey: "stc", label: "STC", layoutKey: "stcWeight" },
] as const;

export const LOWER_INDICATOR_LAYOUT_OPTIONS = {
  minMainRegionTop: 0.4,
  maxMainRegionTop: 0.84,
  splitGap: 0.008,
  oscBottomMargin: 0.02,
  minBandHeight: 0.036,
} as const;

const MIN_MAIN_RATIO = 0.35;
const MAX_MAIN_RATIO = 0.85;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatBandNumber(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return value.toFixed(digits);
}

function lastItem<T>(items: T[] | null | undefined): T | undefined {
  if (!items || items.length === 0) return undefined;
  return items[items.length - 1];
}

function getBandValue(
  definition: LowerIndicatorPaneDefinition,
  indicators: IndicatorConfig,
  data: AnalysisResponse | null,
) {
  switch (definition.id) {
    case "volume": {
      const lastCandle = lastItem(data?.candles);
      return formatCompactNumber(lastCandle?.volume ?? null, "en-US");
    }
    case "rsi": {
      const lastPoint = lastItem(data?.rsi);
      return formatBandNumber(lastPoint?.value, 1);
    }
    case "macd": {
      const lastPoint = lastItem(data?.macd?.data);
      return lastPoint ? `${lastPoint.macd.toFixed(2)} / ${lastPoint.signal.toFixed(2)}` : "-";
    }
    case "stoch": {
      const lastPoint = lastItem(data?.stochastic?.data);
      return lastPoint ? `${lastPoint.k.toFixed(1)} / ${lastPoint.d.toFixed(1)}` : "-";
    }
    case "obv": {
      const lastPoint = lastItem(data?.obv?.data);
      return formatCompactNumber(lastPoint?.value ?? null, "en-US");
    }
    case "atr": {
      const lastPoint = lastItem(data?.atr?.data);
      return formatBandNumber(lastPoint?.value, 2);
    }
    case "mfi": {
      const lastPoint = lastItem(data?.mfi?.data);
      return formatBandNumber(lastPoint?.value, 1);
    }
    case "cmf": {
      const lastPoint = lastItem(data?.cmf?.data);
      return formatBandNumber(lastPoint?.value, 2);
    }
    case "chop": {
      const lastPoint = lastItem(data?.choppiness?.data);
      return formatBandNumber(lastPoint?.value, 1);
    }
    case "willr": {
      const lastPoint = lastItem(data?.williamsR?.data);
      return formatBandNumber(lastPoint?.value, 1);
    }
    case "adx": {
      const lastPoint = lastItem(data?.adx?.data);
      return lastPoint
        ? `${lastPoint.adx.toFixed(1)} / ${lastPoint.plusDi.toFixed(1)} / ${lastPoint.minusDi.toFixed(1)}`
        : "-";
    }
    case "cvd": {
      const lastPoint = lastItem(data?.cvd?.data);
      return formatCompactNumber(lastPoint?.value ?? null, "en-US");
    }
    case "rvol": {
      const rvolData = calculateRvol(data?.candles ?? [], indicators.rvol.period);
      const lastPoint = rvolData[rvolData.length - 1];
      return lastPoint ? `${lastPoint.value.toFixed(2)}x` : "-";
    }
    case "stc": {
      const lastPoint = lastItem(data?.stc?.data);
      return formatBandNumber(lastPoint?.value, 1);
    }
    default:
      return "-";
  }
}

export function getLowerIndicatorDisplayColor(
  indicators: IndicatorConfig,
  paneId: LowerIndicatorPaneId,
) {
  switch (paneId) {
    case "volume":
      return indicators.volume.upColor;
    case "rsi":
      return indicators.rsi.color;
    case "macd":
      return indicators.macd.macdColor;
    case "stoch":
      return indicators.stochastic.kColor;
    case "obv":
      return indicators.obv.color;
    case "atr":
      return indicators.atr.color;
    case "mfi":
      return indicators.mfi.color;
    case "cmf":
      return indicators.cmf.color;
    case "chop":
      return indicators.choppiness.color;
    case "willr":
      return indicators.williamsR.color;
    case "adx":
      return indicators.adx.color;
    case "cvd":
      return indicators.cvd.color;
    case "rvol":
      return indicators.rvol.highColor;
    case "stc":
      return indicators.stc.color;
    default:
      return COLORS.lineSeries;
  }
}

export function getLowerIndicatorToggleKey(
  id: LowerIndicatorPaneId,
): LowerIndicatorToggleKey | null {
  return LOWER_INDICATOR_PANE_DEFINITIONS.find((definition) => definition.id === id)?.indicatorKey ?? null;
}

function getBandDetail(definition: LowerIndicatorPaneDefinition, indicators: IndicatorConfig) {
  switch (definition.id) {
    case "volume":
      return "VOL";
    case "rsi":
      return `${indicators.rsi.period}`;
    case "macd":
      return `${indicators.macd.fastPeriod}, ${indicators.macd.slowPeriod}, ${indicators.macd.signalPeriod}`;
    case "stoch":
      return `${indicators.stochastic.kPeriod}, ${indicators.stochastic.dPeriod}, ${indicators.stochastic.smooth}`;
    case "obv":
      return null;
    case "atr":
      return null;
    case "mfi":
      return `${indicators.mfi.period}`;
    case "cmf":
      return `${indicators.cmf.period}`;
    case "chop":
      return `${indicators.choppiness.period}`;
    case "willr":
      return `${indicators.williamsR.period}`;
    case "adx":
      return `${indicators.adx.period}`;
    case "cvd":
      return "DELTA";
    case "rvol":
      return `${indicators.rvol.period}`;
    case "stc":
      return `${indicators.stc.tcLen}, ${indicators.stc.fastMa}, ${indicators.stc.slowMa}`;
    default:
      return null;
  }
}

export function getActiveLowerIndicatorPaneConfigs(indicators: IndicatorConfig): LowerIndicatorPaneConfig[] {
  return LOWER_INDICATOR_PANE_DEFINITIONS
    .filter((definition) => indicators[definition.indicatorKey].enabled)
    .map((definition) => ({
      id: definition.id,
      label: definition.label,
      color: getLowerIndicatorDisplayColor(indicators, definition.id),
      weight: Math.max(0.2, indicators.layout[definition.layoutKey]),
    }));
}

export function getLowerIndicatorLayoutKey(id: LowerIndicatorPaneId): LowerIndicatorLayoutKey | null {
  return LOWER_INDICATOR_PANE_DEFINITIONS.find((definition) => definition.id === id)?.layoutKey ?? null;
}

export function computeLowerIndicatorPaneRatios(
  priceAreaRatio: number,
  panes: Array<{ id: LowerIndicatorPaneId; weight: number }>,
): LowerIndicatorPaneRatioState {
  if (panes.length === 0) {
    return { mainRatio: 1, paneRatios: new Map<LowerIndicatorPaneId, number>() };
  }

  const mainRatio = clamp(priceAreaRatio, MIN_MAIN_RATIO, MAX_MAIN_RATIO);
  const lowerTotalRatio = Math.max(0.01, 1 - mainRatio);
  const totalWeight = panes.reduce((sum, pane) => sum + Math.max(0.2, pane.weight), 0);
  const paneRatios = new Map<LowerIndicatorPaneId, number>();

  panes.forEach((pane) => {
    paneRatios.set(
      pane.id,
      lowerTotalRatio * (Math.max(0.2, pane.weight) / Math.max(totalWeight, 0.001)),
    );
  });

  return { mainRatio, paneRatios };
}

export function getActiveLowerIndicatorPaneSummaries(
  indicators: IndicatorConfig,
  data: AnalysisResponse | null,
): LowerIndicatorPaneSummary[] {
  const configMap = new Map(
    getActiveLowerIndicatorPaneConfigs(indicators).map((pane) => [pane.id, pane] as const),
  );

  return LOWER_INDICATOR_PANE_DEFINITIONS
    .filter((definition) => configMap.has(definition.id))
    .map((definition) => {
      const config = configMap.get(definition.id)!;
      return {
        ...config,
        detail: getBandDetail(definition, indicators),
        value: getBandValue(definition, indicators, data),
      };
    });
}
