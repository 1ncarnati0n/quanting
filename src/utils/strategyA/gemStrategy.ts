import type { Candle } from "@/types";

export interface GemSignal {
  month: string;
  asset: string;
  spyReturn12m: number;
  veuReturn12m: number;
  reason: string;
}

function monthlyReturn(candles: Candle[], months: number): number | null {
  if (candles.length < months + 1) return null;
  const current = candles[candles.length - 1].close;
  const past = candles[candles.length - 1 - months].close;
  if (past <= 0) return null;
  return (current - past) / past;
}

export function computeGemSignal(
  spyCandles: Candle[],
  veuCandles: Candle[],
  _aggCandles: Candle[],
  _bilCandles: Candle[],
): GemSignal | null {
  const spyRet = monthlyReturn(spyCandles, 12);
  const veuRet = monthlyReturn(veuCandles, 12);

  if (spyRet === null || veuRet === null) return null;

  const lastTime = spyCandles[spyCandles.length - 1].time;
  const month = new Date(lastTime * 1000).toISOString().slice(0, 7);

  // If both are negative, go to safety (BIL/AGG)
  if (spyRet < 0 && veuRet < 0) {
    return {
      month,
      asset: "AGG",
      spyReturn12m: spyRet,
      veuReturn12m: veuRet,
      reason: "SPY·VEU 모두 음수 → 채권(AGG)으로 이동",
    };
  }

  // Choose the winner
  if (spyRet >= veuRet) {
    return {
      month,
      asset: "SPY",
      spyReturn12m: spyRet,
      veuReturn12m: veuRet,
      reason: "SPY 12개월 수익률 > VEU → 미국 주식",
    };
  }

  return {
    month,
    asset: "VEU",
    spyReturn12m: spyRet,
    veuReturn12m: veuRet,
    reason: "VEU 12개월 수익률 > SPY → 해외 주식",
  };
}

export function computeGemSignalAtIndex(
  spyCandles: Candle[],
  veuCandles: Candle[],
  index: number,
): { asset: string; spyRet: number; veuRet: number } {
  if (index < 12) return { asset: "AGG", spyRet: 0, veuRet: 0 };

  const spyNow = spyCandles[index]?.close ?? 0;
  const spyPast = spyCandles[index - 12]?.close ?? 0;
  const veuNow = veuCandles[index]?.close ?? 0;
  const veuPast = veuCandles[index - 12]?.close ?? 0;

  const spyRet = spyPast > 0 ? (spyNow - spyPast) / spyPast : 0;
  const veuRet = veuPast > 0 ? (veuNow - veuPast) / veuPast : 0;

  if (spyRet < 0 && veuRet < 0) return { asset: "AGG", spyRet, veuRet };
  if (spyRet >= veuRet) return { asset: "SPY", spyRet, veuRet };
  return { asset: "VEU", spyRet, veuRet };
}
