import type { Candle } from "@/types";

export interface TaaAssetSignal {
  asset: string;
  invested: boolean;
  price: number;
  sma10: number;
  reason: string;
}

function sma(candles: Candle[], period: number, endIndex: number): number | null {
  if (endIndex < period - 1) return null;
  let sum = 0;
  for (let i = endIndex - period + 1; i <= endIndex; i++) {
    sum += candles[i].close;
  }
  return sum / period;
}

export const TAA_ASSETS = ["SPY", "EFA", "IEF", "VNQ", "GLD"] as const;
export const TAA_WEIGHT_EACH = 0.08; // 8% each of 40% total = 8% per asset

export function computeTaaSignals(
  assetCandles: Record<string, Candle[]>,
): TaaAssetSignal[] {
  return TAA_ASSETS.map((asset) => {
    const candles = assetCandles[asset];
    if (!candles || candles.length < 11) {
      return { asset, invested: false, price: 0, sma10: 0, reason: "데이터 부족" };
    }

    const lastIdx = candles.length - 1;
    const price = candles[lastIdx].close;
    const sma10 = sma(candles, 10, lastIdx);

    if (sma10 === null) {
      return { asset, invested: false, price, sma10: 0, reason: "SMA 계산 불가" };
    }

    const invested = price > sma10;
    return {
      asset,
      invested,
      price,
      sma10,
      reason: invested
        ? `가격(${price.toFixed(2)}) > 10개월 SMA(${sma10.toFixed(2)}) → 투자`
        : `가격(${price.toFixed(2)}) ≤ 10개월 SMA(${sma10.toFixed(2)}) → 캐시`,
    };
  });
}

export function computeTaaAtIndex(
  assetCandles: Record<string, Candle[]>,
  index: number,
): { asset: string; invested: boolean; returnPct: number }[] {
  return TAA_ASSETS.map((asset) => {
    const candles = assetCandles[asset];
    if (!candles || index < 10) {
      return { asset, invested: false, returnPct: 0 };
    }

    const price = candles[index]?.close ?? 0;
    const smaVal = sma(candles, 10, index);
    const invested = smaVal !== null && price > smaVal;

    const prevPrice = candles[index - 1]?.close ?? price;
    const returnPct = prevPrice > 0 ? (price - prevPrice) / prevPrice : 0;

    return { asset, invested, returnPct };
  });
}
