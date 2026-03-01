import type { AnalysisResponse, Candle } from "@/types";
import type { MACDBBSignal } from "@/stores/useStrategyStore";

function avgVolume(candles: Candle[], endIdx: number, period: number): number {
  let sum = 0;
  let count = 0;
  for (let i = Math.max(0, endIdx - period + 1); i <= endIdx; i++) {
    sum += candles[i].volume;
    count++;
  }
  return count > 0 ? sum / count : 0;
}

export function detectMACDBBSignals(data: AnalysisResponse): MACDBBSignal[] {
  const { candles, bollingerBands, macd, rsi } = data;
  if (!macd || bollingerBands.length === 0) return [];

  const signals: MACDBBSignal[] = [];

  // Build lookup maps by time
  const bbMap = new Map(bollingerBands.map((b) => [b.time, b]));
  const macdMap = new Map(macd.data.map((m) => [m.time, m]));
  const rsiMap = new Map(rsi.map((r) => [r.time, r]));

  for (let i = 21; i < candles.length; i++) {
    const candle = candles[i];
    const prevCandle = candles[i - 1];
    const bb = bbMap.get(candle.time);
    const macdCur = macdMap.get(candle.time);
    const macdPrev = macdMap.get(prevCandle.time);
    const rsiCur = rsiMap.get(candle.time);

    if (!bb || !macdCur || !macdPrev) continue;

    const avg20Vol = avgVolume(candles, i, 20);
    const volSurge = avg20Vol > 0 ? candle.volume / avg20Vol : 0;

    // --- BUY signal ---
    const conditions: string[] = [];
    let isBuy = true;

    // Condition 1: Price <= BB lower
    if (candle.close <= bb.lower) {
      conditions.push("BB 하단 접촉");
    } else {
      isBuy = false;
    }

    // Condition 2: MACD golden cross or histogram turns positive
    const macdCross = macdPrev.macd <= macdPrev.signal && macdCur.macd > macdCur.signal;
    const histTurnPositive = macdPrev.histogram <= 0 && macdCur.histogram > 0;
    if (macdCross || histTurnPositive) {
      conditions.push(macdCross ? "MACD 골든크로스" : "히스토그램 양전환");
    } else {
      isBuy = false;
    }

    // Condition 3: Volume > 1.2x avg
    if (volSurge >= 1.2) {
      conditions.push(`거래량 ${volSurge.toFixed(1)}x`);
    } else {
      isBuy = false;
    }

    if (isBuy) {
      const isStrong = rsiCur && rsiCur.value < 30;
      if (isStrong) conditions.push("RSI < 30 (강한 매수)");

      signals.push({
        time: candle.time,
        direction: "buy",
        price: candle.close,
        confidence: isStrong ? "strong" : "normal",
        conditions,
      });
      continue;
    }

    // --- SELL signal ---
    const sellConditions: string[] = [];
    let isSell = true;

    // Condition 1: Price >= BB upper
    if (candle.close >= bb.upper) {
      sellConditions.push("BB 상단 접촉");
    } else {
      isSell = false;
    }

    // Condition 2: MACD dead cross
    const deadCross = macdPrev.macd >= macdPrev.signal && macdCur.macd < macdCur.signal;
    const histTurnNegative = macdPrev.histogram >= 0 && macdCur.histogram < 0;
    if (deadCross || histTurnNegative) {
      sellConditions.push(deadCross ? "MACD 데드크로스" : "히스토그램 음전환");
    } else {
      isSell = false;
    }

    // Condition 3: RSI > 70
    if (rsiCur && rsiCur.value > 70) {
      sellConditions.push(`RSI ${rsiCur.value.toFixed(0)} > 70`);
    } else {
      isSell = false;
    }

    if (isSell) {
      signals.push({
        time: candle.time,
        direction: "sell",
        price: candle.close,
        confidence: rsiCur && rsiCur.value > 80 ? "strong" : "normal",
        conditions: sellConditions,
      });
    }
  }

  return signals;
}
