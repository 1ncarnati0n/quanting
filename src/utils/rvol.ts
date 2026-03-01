import type { Candle } from "../types";

export interface RvolPoint {
  time: number;
  value: number; // ratio: current volume / avg volume (1.0 = average)
}

/**
 * Relative Volume (RVOL)
 * 각 캔들의 거래량을 직전 N봉의 평균 거래량으로 나눈 비율.
 * 1.0 = 평균, 2.0 = 평균의 2배.
 */
export function calculateRvol(candles: Candle[], period: number): RvolPoint[] {
  if (candles.length === 0 || period < 1) return [];

  const result: RvolPoint[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period) continue;

    let sum = 0;
    for (let j = i - period; j < i; j++) {
      sum += candles[j].volume;
    }
    const avg = sum / period;
    const ratio = avg > 0 ? candles[i].volume / avg : 0;

    result.push({ time: candles[i].time, value: ratio });
  }

  return result;
}
