import type { Candle } from "@/types";
import type { ORBSignal, PremarketStock, ORBConfig } from "@/stores/useStrategyStore";
import type { PremarketSnapshot } from "@/types";

export interface OpeningRange {
  high: number;
  low: number;
  rangeWidth: number;
  startTime: number;
  endTime: number;
}

// US market open: 9:30 AM ET = 14:30 UTC
const US_MARKET_OPEN_HOUR = 14;
const US_MARKET_OPEN_MINUTE = 30;

export function detectOpeningRange(
  candles: Candle[],
  rangeMinutes: number,
): OpeningRange | null {
  if (candles.length === 0) return null;

  // Find candles within the opening range period
  // Look for the most recent market open
  const latestCandle = candles[candles.length - 1];
  const latestDate = new Date(latestCandle.time * 1000);
  latestDate.setUTCHours(US_MARKET_OPEN_HOUR, US_MARKET_OPEN_MINUTE, 0, 0);
  const openTimestamp = Math.floor(latestDate.getTime() / 1000);
  const rangeEndTimestamp = openTimestamp + rangeMinutes * 60;

  const rangeBars = candles.filter(
    (c) => c.time >= openTimestamp && c.time < rangeEndTimestamp,
  );

  if (rangeBars.length === 0) return null;

  let high = -Infinity;
  let low = Infinity;
  for (const bar of rangeBars) {
    if (bar.high > high) high = bar.high;
    if (bar.low < low) low = bar.low;
  }

  return {
    high,
    low,
    rangeWidth: high - low,
    startTime: openTimestamp,
    endTime: rangeEndTimestamp,
  };
}

export function detectBreakout(
  candles: Candle[],
  range: OpeningRange,
  config: ORBConfig,
): ORBSignal[] {
  const signals: ORBSignal[] = [];
  const postRangeCandles = candles.filter((c) => c.time >= range.endTime);

  // Simple VWAP approximation (cumulative volume-weighted price)
  let cumVolPrice = 0;
  let cumVol = 0;
  const todayCandles = candles.filter((c) => c.time >= range.startTime);
  for (const c of todayCandles) {
    const typical = (c.high + c.low + c.close) / 3;
    cumVolPrice += typical * c.volume;
    cumVol += c.volume;
  }
  for (const candle of postRangeCandles) {
    // Recalculate running VWAP
    const typical = (candle.high + candle.low + candle.close) / 3;
    cumVolPrice += typical * candle.volume;
    cumVol += candle.volume;
    const currentVwap = cumVol > 0 ? cumVolPrice / cumVol : 0;

    // Long breakout: close > range high
    if (candle.close > range.high) {
      const vwapOk = !config.useVwapFilter || candle.close > currentVwap;
      if (vwapOk) {
        const entry = candle.close;
        signals.push({
          symbol: "",
          direction: "long",
          entry,
          target1: entry + range.rangeWidth,
          target2: entry + range.rangeWidth * 1.5,
          stop: range.low - 0.02,
          rangeHigh: range.high,
          rangeLow: range.low,
          time: candle.time,
        });
        break; // First signal only
      }
    }

    // Short breakout: close < range low
    if (candle.close < range.low) {
      const vwapOk = !config.useVwapFilter || candle.close < currentVwap;
      if (vwapOk) {
        const entry = candle.close;
        signals.push({
          symbol: "",
          direction: "short",
          entry,
          target1: entry - range.rangeWidth,
          target2: entry - range.rangeWidth * 1.5,
          stop: range.high + 0.02,
          rangeHigh: range.high,
          rangeLow: range.low,
          time: candle.time,
        });
        break;
      }
    }
  }

  return signals;
}

export function filterStocksInPlay(
  snapshots: PremarketSnapshot[],
  config: ORBConfig,
): PremarketStock[] {
  return snapshots
    .map((snap) => {
      const preVol = snap.preMarketVolume ?? 0;
      const regVol = snap.regularMarketVolume ?? 1;
      // Estimate normal premarket volume as ~2% of regular volume
      const normalPreVol = regVol * 0.02;
      const rVol = normalPreVol > 0 ? preVol / normalPreVol : 0;
      const preChange = snap.preMarketChange ?? 0;

      return {
        symbol: snap.symbol,
        prePrice: snap.preMarketPrice ?? 0,
        preChange: preChange * 100, // Convert to percentage
        preVolume: preVol,
        normalVolume: normalPreVol,
        rVol,
        hasCatalyst: false, // Manual marking
      };
    })
    .filter(
      (stock) =>
        stock.rVol >= config.rvolThreshold &&
        Math.abs(stock.preChange) >= config.premarketChangeThreshold,
    )
    .sort((a, b) => b.rVol - a.rVol);
}
