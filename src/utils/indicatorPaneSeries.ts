import type { IndicatorConfig } from "../stores/useSettingsStore";
import type { AnalysisResponse } from "../types";
import { clipByTime, buildScopedCandles } from "./chartShared";
import { hexToRgba } from "./constants";
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

export interface IndicatorPaneBandFillDefinition {
  key: string;
  values: Array<{ time: number; upper: number; lower: number }>;
  color: string;
  attachToKey: string;
}

export interface IndicatorPaneModel {
  paneId: LowerIndicatorPaneId;
  series: IndicatorPaneSeriesDefinition[];
  bandFills?: IndicatorPaneBandFillDefinition[];
  primarySeriesKey: string;
  primaryValueMap: Map<number, number>;
}

function createPrimaryValueMap(
  values: Array<{ time: number; value: number }>,
) {
  return new Map(values.map((point) => [point.time, point.value] as const));
}

function createThresholdLine(
  key: string,
  values: Array<{ time: number; value: number }>,
  threshold: number,
  color: string,
): IndicatorPaneSeriesDefinition {
  return {
    key,
    kind: "line",
    values: values.map((point) => ({ time: point.time, value: threshold })),
    color,
    lineWidth: 1,
    lineStyle: 2,
  };
}

function createBandFill(
  key: string,
  values: Array<{ time: number; value: number }>,
  upper: number,
  lower: number,
  color: string,
  attachToKey: string,
): IndicatorPaneBandFillDefinition {
  return {
    key,
    attachToKey,
    color: hexToRgba(color, 0.03),
    values: values.map((point) => ({
      time: point.time,
      upper,
      lower,
    })),
  };
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
      const guideColor = indicators.rsi.color;
      return {
        paneId,
        series: [
          {
            key: "rsi-line",
            kind: "line",
            values,
            color: indicators.rsi.color,
            lineWidth: indicators.rsi.lineWidth as 1 | 2 | 3 | 4,
            lineStyle: indicators.rsi.lineStyle,
            lastValueColor: indicators.rsi.color,
          },
          createThresholdLine("rsi-overbought", values, 70, guideColor),
          createThresholdLine("rsi-oversold", values, 30, guideColor),
        ],
        bandFills: [createBandFill("rsi-band", values, 70, 30, guideColor, "rsi-overbought")],
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
            lineStyle: indicators.macd.macdLineStyle,
            lastValueColor: indicators.macd.macdColor,
          },
          {
            key: "macd-signal",
            kind: "line",
            values: signalValues,
            color: indicators.macd.signalColor,
            lineWidth: indicators.macd.signalLineWidth as 1 | 2 | 3 | 4,
            lineStyle: indicators.macd.signalLineStyle,
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
      const guideColor = indicators.stochastic.kColor;
      return {
        paneId,
        series: [
          {
            key: "stoch-k",
            kind: "line",
            values: kValues,
            color: indicators.stochastic.kColor,
            lineWidth: indicators.stochastic.kLineWidth as 1 | 2 | 3 | 4,
            lineStyle: indicators.stochastic.kLineStyle,
            lastValueColor: indicators.stochastic.kColor,
          },
          {
            key: "stoch-d",
            kind: "line",
            values: dValues,
            color: indicators.stochastic.dColor,
            lineWidth: indicators.stochastic.dLineWidth as 1 | 2 | 3 | 4,
            lineStyle: indicators.stochastic.dLineStyle,
            lastValueColor: indicators.stochastic.dColor,
          },
          createThresholdLine("stoch-overbought", kValues, 80, guideColor),
          createThresholdLine("stoch-oversold", kValues, 20, guideColor),
        ],
        bandFills: [createBandFill("stoch-band", kValues, 80, 20, guideColor, "stoch-overbought")],
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
            lineStyle: indicators.obv.lineStyle,
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
            lineStyle: indicators.atr.lineStyle,
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
      const guideColor = indicators.mfi.color;
      return {
        paneId,
        series: [
          {
            key: "mfi",
            kind: "line",
            values,
            color: indicators.mfi.color,
            lineWidth: indicators.mfi.lineWidth as 1 | 2 | 3 | 4,
            lineStyle: indicators.mfi.lineStyle,
            lastValueColor: indicators.mfi.color,
          },
          createThresholdLine("mfi-overbought", values, 80, guideColor),
          createThresholdLine("mfi-oversold", values, 20, guideColor),
        ],
        bandFills: [createBandFill("mfi-band", values, 80, 20, guideColor, "mfi-overbought")],
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
            lineStyle: indicators.cmf.lineStyle,
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
      const guideColor = indicators.choppiness.color;
      return {
        paneId,
        series: [
          {
            key: "chop",
            kind: "line",
            values,
            color: indicators.choppiness.color,
            lineWidth: indicators.choppiness.lineWidth as 1 | 2 | 3 | 4,
            lineStyle: indicators.choppiness.lineStyle,
            lastValueColor: indicators.choppiness.color,
          },
          createThresholdLine("chop-high", values, 61.8, guideColor),
          createThresholdLine("chop-low", values, 38.2, guideColor),
        ],
        bandFills: [createBandFill("chop-band", values, 61.8, 38.2, guideColor, "chop-high")],
        primarySeriesKey: "chop",
        primaryValueMap: createPrimaryValueMap(values),
      };
    }
    case "willr": {
      const scoped = data.williamsR ? clipByTime(data.williamsR.data, replayTime) : [];
      const values = scoped.map((point) => ({ time: point.time, value: point.value }));
      const guideColor = indicators.williamsR.color;
      return {
        paneId,
        series: [
          {
            key: "willr",
            kind: "line",
            values,
            color: indicators.williamsR.color,
            lineWidth: indicators.williamsR.lineWidth as 1 | 2 | 3 | 4,
            lineStyle: indicators.williamsR.lineStyle,
            lastValueColor: indicators.williamsR.color,
          },
          createThresholdLine("willr-overbought", values, -20, guideColor),
          createThresholdLine("willr-oversold", values, -80, guideColor),
        ],
        bandFills: [createBandFill("willr-band", values, -20, -80, guideColor, "willr-overbought")],
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
            lineStyle: indicators.adx.lineStyle,
            lastValueColor: indicators.adx.color,
          },
          {
            key: "adx-plus",
            kind: "line",
            values: plusValues,
            color: indicators.adx.plusDiColor,
            lineWidth: indicators.adx.diLineWidth as 1 | 2 | 3 | 4,
            lineStyle: indicators.adx.diLineStyle,
            lastValueColor: indicators.adx.plusDiColor,
          },
          {
            key: "adx-minus",
            kind: "line",
            values: minusValues,
            color: indicators.adx.minusDiColor,
            lineWidth: indicators.adx.diLineWidth as 1 | 2 | 3 | 4,
            lineStyle: indicators.adx.diLineStyle,
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
            lineStyle: indicators.cvd.lineStyle,
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
      const guideColor = indicators.stc.color;
      return {
        paneId,
        series: [
          {
            key: "stc",
            kind: "line",
            values,
            color: indicators.stc.color,
            lineWidth: indicators.stc.lineWidth as 1 | 2 | 3 | 4,
            lineStyle: indicators.stc.lineStyle,
            lastValueColor: indicators.stc.color,
          },
          createThresholdLine("stc-high", values, 75, guideColor),
          createThresholdLine("stc-low", values, 25, guideColor),
        ],
        bandFills: [createBandFill("stc-band", values, 75, 25, guideColor, "stc-high")],
        primarySeriesKey: "stc",
        primaryValueMap: createPrimaryValueMap(values),
      };
    }
    default:
      return null;
  }
}
