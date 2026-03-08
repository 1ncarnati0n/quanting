import type { ChartType, PriceScaleMode } from "../stores/useSettingsStore";
import type { Candle, MarketType } from "../types";
import { formatPrice } from "./formatters";
import { remToPx } from "./typography";

export type ChartPalette = {
  background: string;
  foreground: string;
  grid: string;
  border: string;
  fontFamily: string;
  fontSize: number;
};

export function makePriceFormatter(market: MarketType) {
  return (price: number) => formatPrice(price, market);
}

export function mapPriceScaleMode(mode: PriceScaleMode): 0 | 1 {
  if (mode === "logarithmic") return 1;
  return 0;
}

export function clipByTime<T extends { time: number }>(items: T[], maxTime: number): T[] {
  if (!items.length) return items;
  return items.filter((item) => item.time <= maxTime);
}

export function toHeikinAshi(candles: Candle[]): Candle[] {
  if (candles.length === 0) return [];

  const result: Candle[] = [];
  let prevHaOpen = (candles[0].open + candles[0].close) / 2;
  let prevHaClose =
    (candles[0].open + candles[0].high + candles[0].low + candles[0].close) / 4;

  for (let i = 0; i < candles.length; i += 1) {
    const candle = candles[i];
    const haClose = (candle.open + candle.high + candle.low + candle.close) / 4;
    const haOpen = i === 0 ? prevHaOpen : (prevHaOpen + prevHaClose) / 2;
    const haHigh = Math.max(candle.high, haOpen, haClose);
    const haLow = Math.min(candle.low, haOpen, haClose);

    result.push({
      ...candle,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
    });

    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }

  return result;
}

export function calculateBollingerFromCandles(
  candles: Candle[],
  period: number,
  multiplier: number,
) {
  const output: { time: number; upper: number; middle: number; lower: number }[] = [];
  if (period <= 1 || candles.length < period) return output;

  for (let i = period - 1; i < candles.length; i += 1) {
    const window = candles.slice(i - period + 1, i + 1);
    const closes = window.map((candle) => candle.close);
    const mean = closes.reduce((sum, value) => sum + value, 0) / period;
    const variance =
      closes.reduce((sum, value) => sum + (value - mean) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);

    output.push({
      time: candles[i].time,
      upper: mean + multiplier * stdDev,
      middle: mean,
      lower: mean - multiplier * stdDev,
    });
  }

  return output;
}

export function readChartPalette(): ChartPalette {
  if (typeof window === "undefined") {
    return {
      background: "#131722",
      foreground: "#B2B5BE",
      grid: "#2A2E39",
      border: "#2A2E39",
      fontFamily:
        "\"Noto Sans KR\", \"Apple SD Gothic Neo\", \"Malgun Gothic\", \"Segoe UI\", sans-serif",
      fontSize: remToPx(0.8),
    };
  }

  const styles = window.getComputedStyle(document.documentElement);
  const value = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;

  return {
    background: value("--chart-bg", "#131722"),
    foreground: value("--chart-foreground", "#B2B5BE"),
    grid: value("--chart-grid", "#2A2E39"),
    border: value("--chart-border", "#2A2E39"),
    fontFamily: value(
      "--font-sans",
      "\"Noto Sans KR\", \"Apple SD Gothic Neo\", \"Malgun Gothic\", \"Segoe UI\", sans-serif",
    ),
    fontSize: remToPx(0.8),
  };
}

export function buildScopedCandles(
  candles: Candle[],
  chartType: ChartType,
  replayEnabled: boolean,
  replayIndex: number,
) {
  if (candles.length === 0) {
    return {
      replayTime: 0,
      rawCandles: [] as Candle[],
      displayCandles: [] as Candle[],
    };
  }

  const cappedReplayIndex = replayEnabled
    ? Math.min(Math.max(replayIndex, 0), candles.length - 1)
    : candles.length - 1;
  const replayTime = candles[cappedReplayIndex]?.time ?? candles[candles.length - 1].time;
  const rawCandles = replayEnabled ? candles.slice(0, cappedReplayIndex + 1) : candles;
  const displayCandles = chartType === "heikinAshi" ? toHeikinAshi(rawCandles) : rawCandles;

  return { replayTime, rawCandles, displayCandles };
}
