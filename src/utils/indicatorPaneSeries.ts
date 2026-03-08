import type { IndicatorConfig } from "../stores/useSettingsStore";
import type { AnalysisResponse } from "../types";
import { clipByTime, buildScopedCandles } from "./chartShared";
import { COLORS } from "./constants";
import type { LowerIndicatorPaneId } from "./lowerIndicatorPanes";
import { calculateRvol } from "./rvol";

export type IndicatorPaneSeriesKind = "line" | "histogram";

export interface IndicatorPaneSeriesDefinition {
  key: string;
  kind: IndicatorPaneSeriesKind;
  values: Array<{ time: number; value: number; color?: string }>;
  color?: string;
  lineWidth?: 1 | 2 | 3 | 4;
  lineStyle?: number;
  priceFormat?: "price" | "volume";
  lastValueColor?: string;
}

export interface IndicatorPaneModel {
  paneId: LowerIndicatorPaneId;
  series: IndicatorPaneSeriesDefinition[];
  primarySeriesKey: string;
  primaryValueMap: Map<number, number>;
}

function createPrimaryValueMap(
  values: Array<{ time: number; value: number }>,
) {
  return new Map(values.map((point) => [point.time, point.value] as const));
}

export function buildIndicatorPaneModel(
  paneId: LowerIndicatorPaneId,
  data: AnalysisResponse | null,
  indicators: IndicatorConfig,
  replayEnabled: boolean,
  replayIndex: number,
): IndicatorPaneModel | null {
  if (!data || data.candles.length === 0) return null;

  const { replayTime, displayCandles } = buildScopedCandles(
    data.candles,
    "candlestick",
    replayEnabled,
    replayIndex,
  );

  switch (paneId) {
    case "volume": {
      const values = displayCandles.map((candle) => ({
        time: candle.time,
        value: candle.volume,
        color: candle.close >= candle.open ? indicators.volume.upColor : indicators.volume.downColor,
      }));
      return {
        paneId,
        series: [
          {
            key: "volume",
            kind: "histogram",
            values,
            priceFormat: "volume",
            lastValueColor: values[values.length - 1]?.color,
          },
        ],
        primarySeriesKey: "volume",
        primaryValueMap: createPrimaryValueMap(values),
      };
    }
    case "rsi": {
      const scoped = clipByTime(data.rsi, replayTime);
      const values = scoped.map((point) => ({ time: point.time, value: point.value }));
      return {
        paneId,
        series: [
          {
            key: "rsi-line",
            kind: "line",
            values,
            color: indicators.rsi.color,
            lineWidth: indicators.rsi.lineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.rsi.color,
          },
          {
            key: "rsi-overbought",
            kind: "line",
            values: values.map((point) => ({ time: point.time, value: 70 })),
            color: COLORS.rsiOverbought,
            lineWidth: 1,
            lineStyle: 2,
          },
          {
            key: "rsi-oversold",
            kind: "line",
            values: values.map((point) => ({ time: point.time, value: 30 })),
            color: COLORS.rsiOversold,
            lineWidth: 1,
            lineStyle: 2,
          },
        ],
        primarySeriesKey: "rsi-line",
        primaryValueMap: createPrimaryValueMap(values),
      };
    }
    case "macd": {
      const scoped = data.macd ? clipByTime(data.macd.data, replayTime) : [];
      const histValues = scoped.map((point) => ({
        time: point.time,
        value: point.histogram,
        color:
          point.histogram >= 0
            ? indicators.macd.histogramUpColor
            : indicators.macd.histogramDownColor,
      }));
      const macdValues = scoped.map((point) => ({ time: point.time, value: point.macd }));
      const signalValues = scoped.map((point) => ({ time: point.time, value: point.signal }));
      return {
        paneId,
        series: [
          {
            key: "macd-hist",
            kind: "histogram",
            values: histValues,
            lastValueColor: histValues[histValues.length - 1]?.color,
          },
          {
            key: "macd-line",
            kind: "line",
            values: macdValues,
            color: indicators.macd.macdColor,
            lineWidth: indicators.macd.macdLineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.macd.macdColor,
          },
          {
            key: "macd-signal",
            kind: "line",
            values: signalValues,
            color: indicators.macd.signalColor,
            lineWidth: indicators.macd.signalLineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.macd.signalColor,
          },
        ],
        primarySeriesKey: "macd-hist",
        primaryValueMap: createPrimaryValueMap(histValues),
      };
    }
    case "stoch": {
      const scoped = data.stochastic ? clipByTime(data.stochastic.data, replayTime) : [];
      const kValues = scoped.map((point) => ({ time: point.time, value: point.k }));
      const dValues = scoped.map((point) => ({ time: point.time, value: point.d }));
      return {
        paneId,
        series: [
          {
            key: "stoch-k",
            kind: "line",
            values: kValues,
            color: indicators.stochastic.kColor,
            lineWidth: indicators.stochastic.kLineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.stochastic.kColor,
          },
          {
            key: "stoch-d",
            kind: "line",
            values: dValues,
            color: indicators.stochastic.dColor,
            lineWidth: indicators.stochastic.dLineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.stochastic.dColor,
          },
          {
            key: "stoch-overbought",
            kind: "line",
            values: kValues.map((point) => ({ time: point.time, value: 80 })),
            color: COLORS.rsiOverbought,
            lineWidth: 1,
            lineStyle: 2,
          },
          {
            key: "stoch-oversold",
            kind: "line",
            values: kValues.map((point) => ({ time: point.time, value: 20 })),
            color: COLORS.rsiOversold,
            lineWidth: 1,
            lineStyle: 2,
          },
        ],
        primarySeriesKey: "stoch-k",
        primaryValueMap: createPrimaryValueMap(kValues),
      };
    }
    case "obv": {
      const scoped = data.obv ? clipByTime(data.obv.data, replayTime) : [];
      const values = scoped.map((point) => ({ time: point.time, value: point.value }));
      return {
        paneId,
        series: [
          {
            key: "obv",
            kind: "line",
            values,
            color: indicators.obv.color,
            lineWidth: indicators.obv.lineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.obv.color,
          },
        ],
        primarySeriesKey: "obv",
        primaryValueMap: createPrimaryValueMap(values),
      };
    }
    case "atr": {
      const scoped = data.atr ? clipByTime(data.atr.data, replayTime) : [];
      const values = scoped.map((point) => ({ time: point.time, value: point.value }));
      return {
        paneId,
        series: [
          {
            key: "atr",
            kind: "line",
            values,
            color: indicators.atr.color,
            lineWidth: indicators.atr.lineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.atr.color,
          },
        ],
        primarySeriesKey: "atr",
        primaryValueMap: createPrimaryValueMap(values),
      };
    }
    case "mfi": {
      const scoped = data.mfi ? clipByTime(data.mfi.data, replayTime) : [];
      const values = scoped.map((point) => ({ time: point.time, value: point.value }));
      return {
        paneId,
        series: [
          {
            key: "mfi",
            kind: "line",
            values,
            color: indicators.mfi.color,
            lineWidth: indicators.mfi.lineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.mfi.color,
          },
          {
            key: "mfi-overbought",
            kind: "line",
            values: values.map((point) => ({ time: point.time, value: 80 })),
            color: COLORS.rsiOverbought,
            lineWidth: 1,
            lineStyle: 2,
          },
          {
            key: "mfi-oversold",
            kind: "line",
            values: values.map((point) => ({ time: point.time, value: 20 })),
            color: COLORS.rsiOversold,
            lineWidth: 1,
            lineStyle: 2,
          },
        ],
        primarySeriesKey: "mfi",
        primaryValueMap: createPrimaryValueMap(values),
      };
    }
    case "cmf": {
      const scoped = data.cmf ? clipByTime(data.cmf.data, replayTime) : [];
      const values = scoped.map((point) => ({ time: point.time, value: point.value }));
      return {
        paneId,
        series: [
          {
            key: "cmf",
            kind: "line",
            values,
            color: indicators.cmf.color,
            lineWidth: indicators.cmf.lineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.cmf.color,
          },
          {
            key: "cmf-zero",
            kind: "line",
            values: values.map((point) => ({ time: point.time, value: 0 })),
            color: "#6B7280",
            lineWidth: 1,
            lineStyle: 2,
          },
        ],
        primarySeriesKey: "cmf",
        primaryValueMap: createPrimaryValueMap(values),
      };
    }
    case "chop": {
      const scoped = data.choppiness ? clipByTime(data.choppiness.data, replayTime) : [];
      const values = scoped.map((point) => ({ time: point.time, value: point.value }));
      return {
        paneId,
        series: [
          {
            key: "chop",
            kind: "line",
            values,
            color: indicators.choppiness.color,
            lineWidth: indicators.choppiness.lineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.choppiness.color,
          },
          {
            key: "chop-high",
            kind: "line",
            values: values.map((point) => ({ time: point.time, value: 61.8 })),
            color: "#6B7280",
            lineWidth: 1,
            lineStyle: 2,
          },
          {
            key: "chop-low",
            kind: "line",
            values: values.map((point) => ({ time: point.time, value: 38.2 })),
            color: "#6B7280",
            lineWidth: 1,
            lineStyle: 2,
          },
        ],
        primarySeriesKey: "chop",
        primaryValueMap: createPrimaryValueMap(values),
      };
    }
    case "willr": {
      const scoped = data.williamsR ? clipByTime(data.williamsR.data, replayTime) : [];
      const values = scoped.map((point) => ({ time: point.time, value: point.value }));
      return {
        paneId,
        series: [
          {
            key: "willr",
            kind: "line",
            values,
            color: indicators.williamsR.color,
            lineWidth: indicators.williamsR.lineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.williamsR.color,
          },
          {
            key: "willr-overbought",
            kind: "line",
            values: values.map((point) => ({ time: point.time, value: -20 })),
            color: COLORS.rsiOverbought,
            lineWidth: 1,
            lineStyle: 2,
          },
          {
            key: "willr-oversold",
            kind: "line",
            values: values.map((point) => ({ time: point.time, value: -80 })),
            color: COLORS.rsiOversold,
            lineWidth: 1,
            lineStyle: 2,
          },
        ],
        primarySeriesKey: "willr",
        primaryValueMap: createPrimaryValueMap(values),
      };
    }
    case "adx": {
      const scoped = data.adx ? clipByTime(data.adx.data, replayTime) : [];
      const adxValues = scoped.map((point) => ({ time: point.time, value: point.adx }));
      const plusValues = scoped.map((point) => ({ time: point.time, value: point.plusDi }));
      const minusValues = scoped.map((point) => ({ time: point.time, value: point.minusDi }));
      return {
        paneId,
        series: [
          {
            key: "adx",
            kind: "line",
            values: adxValues,
            color: indicators.adx.color,
            lineWidth: indicators.adx.lineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.adx.color,
          },
          {
            key: "adx-plus",
            kind: "line",
            values: plusValues,
            color: indicators.adx.plusDiColor,
            lineWidth: indicators.adx.diLineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.adx.plusDiColor,
          },
          {
            key: "adx-minus",
            kind: "line",
            values: minusValues,
            color: indicators.adx.minusDiColor,
            lineWidth: indicators.adx.diLineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.adx.minusDiColor,
          },
          {
            key: "adx-threshold",
            kind: "line",
            values: adxValues.map((point) => ({ time: point.time, value: 25 })),
            color: "#6B7280",
            lineWidth: 1,
            lineStyle: 2,
          },
        ],
        primarySeriesKey: "adx",
        primaryValueMap: createPrimaryValueMap(adxValues),
      };
    }
    case "cvd": {
      const scoped = data.cvd ? clipByTime(data.cvd.data, replayTime) : [];
      const values = scoped.map((point) => ({ time: point.time, value: point.value }));
      return {
        paneId,
        series: [
          {
            key: "cvd",
            kind: "line",
            values,
            color: indicators.cvd.color,
            lineWidth: indicators.cvd.lineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.cvd.color,
          },
        ],
        primarySeriesKey: "cvd",
        primaryValueMap: createPrimaryValueMap(values),
      };
    }
    case "rvol": {
      const values = calculateRvol(displayCandles, indicators.rvol.period).map((point) => ({
        time: point.time,
        value: point.value,
        color:
          point.value >= 1.5
            ? indicators.rvol.highColor
            : point.value < 0.5
              ? indicators.rvol.lowColor
              : indicators.rvol.neutralColor,
      }));
      return {
        paneId,
        series: [
          {
            key: "rvol",
            kind: "histogram",
            values,
            lastValueColor: values[values.length - 1]?.color,
          },
          {
            key: "rvol-baseline",
            kind: "line",
            values: values.map((point) => ({ time: point.time, value: 1 })),
            color: "rgba(148,163,184,0.3)",
            lineWidth: 1,
            lineStyle: 2,
          },
        ],
        primarySeriesKey: "rvol",
        primaryValueMap: createPrimaryValueMap(values),
      };
    }
    case "stc": {
      const scoped = data.stc ? clipByTime(data.stc.data, replayTime) : [];
      const values = scoped.map((point) => ({ time: point.time, value: point.value }));
      return {
        paneId,
        series: [
          {
            key: "stc",
            kind: "line",
            values,
            color: indicators.stc.color,
            lineWidth: indicators.stc.lineWidth as 1 | 2 | 3 | 4,
            lastValueColor: indicators.stc.color,
          },
          {
            key: "stc-high",
            kind: "line",
            values: values.map((point) => ({ time: point.time, value: 75 })),
            color: "#6B7280",
            lineWidth: 1,
            lineStyle: 2,
          },
          {
            key: "stc-low",
            kind: "line",
            values: values.map((point) => ({ time: point.time, value: 25 })),
            color: "#6B7280",
            lineWidth: 1,
            lineStyle: 2,
          },
        ],
        primarySeriesKey: "stc",
        primaryValueMap: createPrimaryValueMap(values),
      };
    }
    default:
      return null;
  }
}
