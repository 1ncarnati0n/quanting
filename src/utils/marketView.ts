import type { Candle, MarketType } from "../types";

export interface CandleSummary {
  lastCandle: Candle | null;
  prevCandle: Candle | null;
  high: number | null;
  low: number | null;
  change: number;
  changePct: number;
}

export interface MarketBadgeMeta {
  label: string;
  color: string;
}

export interface InstrumentDisplay {
  primary: string;
  secondary: string | null;
}

export function summarizeCandles(candles: Candle[]): CandleSummary {
  const length = candles.length;
  if (length === 0) {
    return {
      lastCandle: null,
      prevCandle: null,
      high: null,
      low: null,
      change: 0,
      changePct: 0,
    };
  }

  let high = candles[0].high;
  let low = candles[0].low;

  for (let i = 1; i < length; i += 1) {
    const candle = candles[i];
    if (candle.high > high) high = candle.high;
    if (candle.low < low) low = candle.low;
  }

  const lastCandle = candles[length - 1];
  const prevCandle = length > 1 ? candles[length - 2] : null;
  const change = prevCandle ? lastCandle.close - prevCandle.close : 0;
  const changePct =
    prevCandle && Math.abs(prevCandle.close) > Number.EPSILON
      ? (change / prevCandle.close) * 100
      : 0;

  return { lastCandle, prevCandle, high, low, change, changePct };
}

export function getMarketBadgeMeta(market: MarketType): MarketBadgeMeta {
  if (market === "crypto") {
    return { label: "코인", color: "var(--warning)" };
  }
  if (market === "krStock") {
    return { label: "KR", color: "#EC4899" };
  }
  if (market === "forex") {
    return { label: "FX", color: "#14B8A6" };
  }
  return { label: "US", color: "var(--primary)" };
}

export function getInstrumentDisplay(
  symbol: string,
  label: string | undefined,
  market: MarketType,
): InstrumentDisplay {
  if (market === "krStock" && label) {
    return { primary: label, secondary: symbol };
  }
  if (label) {
    return { primary: symbol, secondary: label };
  }
  return { primary: symbol, secondary: null };
}

export function formatInstrumentDisplayLine(
  symbol: string,
  label: string | undefined,
  market: MarketType,
): string {
  const display = getInstrumentDisplay(symbol, label, market);
  return display.secondary ? `${display.primary} · ${display.secondary}` : display.primary;
}

export function formatCompactNumber(value: number | null, locale = "ko-KR"): string {
  if (value === null || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}
