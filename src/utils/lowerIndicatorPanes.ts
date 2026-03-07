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
  value: string;
}

type LowerIndicatorPaneDefinition = {
  id: LowerIndicatorPaneId;
  indicatorKey: LowerIndicatorToggleKey;
  label: string;
  color: string;
  layoutKey: LowerIndicatorLayoutKey;
};

const LOWER_INDICATOR_PANE_DEFINITIONS: readonly LowerIndicatorPaneDefinition[] = [
  { id: "volume", indicatorKey: "volume", label: "거래량", color: COLORS.candleUp, layoutKey: "volumeWeight" },
  { id: "rsi", indicatorKey: "rsi", label: "RSI", color: COLORS.rsiLine, layoutKey: "rsiWeight" },
  { id: "macd", indicatorKey: "macd", label: "MACD", color: COLORS.macdLine, layoutKey: "macdWeight" },
  { id: "stoch", indicatorKey: "stochastic", label: "STOCH", color: COLORS.stochK, layoutKey: "stochasticWeight" },
  { id: "obv", indicatorKey: "obv", label: "OBV", color: "#14B8A6", layoutKey: "obvWeight" },
  { id: "atr", indicatorKey: "atr", label: "ATR", color: "#38BDF8", layoutKey: "atrWeight" },
  { id: "mfi", indicatorKey: "mfi", label: "MFI", color: COLORS.mfiLine, layoutKey: "mfiWeight" },
  { id: "cmf", indicatorKey: "cmf", label: "CMF", color: COLORS.cmfLine, layoutKey: "cmfWeight" },
  { id: "chop", indicatorKey: "choppiness", label: "CHOP", color: COLORS.chopLine, layoutKey: "chopWeight" },
  { id: "willr", indicatorKey: "williamsR", label: "W%R", color: COLORS.willrLine, layoutKey: "willrWeight" },
  { id: "adx", indicatorKey: "adx", label: "ADX", color: COLORS.adxLine, layoutKey: "adxWeight" },
  { id: "cvd", indicatorKey: "cvd", label: "CVD", color: COLORS.cvdLine, layoutKey: "cvdWeight" },
  { id: "rvol", indicatorKey: "rvol", label: "RVOL", color: "#F59E0B", layoutKey: "rvolWeight" },
  { id: "stc", indicatorKey: "stc", label: "STC", color: COLORS.stcLine, layoutKey: "stcWeight" },
] as const;

export const LOWER_INDICATOR_LAYOUT_OPTIONS = {
  minMainRegionTop: 0.4,
  maxMainRegionTop: 0.84,
  splitGap: 0.008,
  oscBottomMargin: 0.02,
  minBandHeight: 0.036,
} as const;

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

export function getActiveLowerIndicatorPaneConfigs(indicators: IndicatorConfig): LowerIndicatorPaneConfig[] {
  return LOWER_INDICATOR_PANE_DEFINITIONS
    .filter((definition) => indicators[definition.indicatorKey].enabled)
    .map((definition) => ({
      id: definition.id,
      label: definition.label,
      color: definition.color,
      weight: Math.max(0.2, indicators.layout[definition.layoutKey]),
    }));
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
        value: getBandValue(definition, indicators, data),
      };
    });
}
