import type { Candle } from "@/types";
import type {
  BacktestResult,
  EquityPoint,
  StrategyAConfig,
  TradeRecord,
} from "@/stores/useStrategyStore";
import { computeGemSignalAtIndex } from "./gemStrategy";
import { computeTaaAtIndex, TAA_ASSETS } from "./taaStrategy";
import { computeSectorAtIndex, TOP_SECTORS_COUNT } from "./sectorTimingStrategy";
import {
  computeCAGR,
  computeMaxDrawdown,
  computeSharpe,
  computeCalmar,
  computeWinRate,
  computeTotalReturn,
} from "./performanceMetrics";

export const STRATEGY_A_SYMBOLS = [
  // GEM
  "SPY", "VEU", "AGG", "BIL",
  // TAA (SPY already included)
  "EFA", "IEF", "VNQ", "GLD",
  // Sector Timing
  "XLK", "XLV", "XLF", "XLE", "XLY", "XLI", "XLU", "XLRE", "XLB", "XLC", "XLP",
] as const;

export function getUniqueSymbols(): string[] {
  return [...new Set(STRATEGY_A_SYMBOLS)];
}

export function runBacktest(
  allCandles: Record<string, Candle[]>,
  config: StrategyAConfig,
): BacktestResult {
  const spyCandles = allCandles["SPY"] ?? [];
  const veuCandles = allCandles["VEU"] ?? [];

  // Determine backtest range from SPY candles
  const startTimestamp = new Date(`${config.startYear}-01-01`).getTime() / 1000;
  const startIdx = spyCandles.findIndex((c) => c.time >= startTimestamp);
  if (startIdx < 0 || startIdx < 12) {
    return emptyResult();
  }

  const totalMonths = spyCandles.length;
  let equity = config.initialCapital;
  const equityCurve: EquityPoint[] = [];
  const trades: TradeRecord[] = [];
  const monthlyReturns: number[] = [];

  for (let i = Math.max(startIdx, 12); i < totalMonths; i++) {
    let monthReturn = 0;

    // --- GEM Component ---
    const gem = computeGemSignalAtIndex(spyCandles, veuCandles, i);
    let gemReturn = 0;
    const gemAssetCandles = allCandles[gem.asset];
    if (gemAssetCandles && i < gemAssetCandles.length) {
      const now = gemAssetCandles[i]?.close ?? 0;
      const prev = gemAssetCandles[i - 1]?.close ?? now;
      gemReturn = prev > 0 ? (now - prev) / prev : 0;
    }
    monthReturn += gemReturn * config.gemWeight;

    // --- TAA Component ---
    const taaSignals = computeTaaAtIndex(allCandles, i);
    const investedTaa = taaSignals.filter((s) => s.invested);
    let taaReturn = 0;
    if (investedTaa.length > 0) {
      const perAssetWeight = config.taaWeight / TAA_ASSETS.length;
      for (const s of taaSignals) {
        if (s.invested) {
          taaReturn += s.returnPct * perAssetWeight;
        }
        // Cash portion earns 0
      }
    }
    monthReturn += taaReturn;

    // --- Sector Timing Component ---
    const sectors = computeSectorAtIndex(allCandles, i);
    const selectedSectors = sectors.filter((s) => s.selected);
    let sectorReturn = 0;
    if (selectedSectors.length > 0) {
      const perSectorWeight = config.sectorWeight / TOP_SECTORS_COUNT;
      for (const s of selectedSectors) {
        sectorReturn += s.returnPct * perSectorWeight;
      }
    }
    monthReturn += sectorReturn;

    equity *= 1 + monthReturn;
    monthlyReturns.push(monthReturn);

    const timeVal = spyCandles[i]?.time ?? 0;
    equityCurve.push({ time: timeVal, value: equity });

    const monthStr = new Date(timeVal * 1000).toISOString().slice(0, 7);
    trades.push({
      month: monthStr,
      gemAsset: gem.asset,
      taaAssets: taaSignals.filter((s) => s.invested).map((s) => s.asset),
      sectorAssets: selectedSectors.map((s) => s.asset),
      portfolioReturn: monthReturn,
      cumulativeReturn: (equity - config.initialCapital) / config.initialCapital,
    });
  }

  if (equityCurve.length === 0) return emptyResult();

  // Add initial point
  const firstTime = spyCandles[Math.max(startIdx, 12) - 1]?.time ?? 0;
  equityCurve.unshift({ time: firstTime, value: config.initialCapital });

  const cagr = computeCAGR(equityCurve);
  const maxDrawdown = computeMaxDrawdown(equityCurve);
  const sharpe = computeSharpe(monthlyReturns);
  const calmar = computeCalmar(cagr, maxDrawdown);
  const winRate = computeWinRate(monthlyReturns);
  const totalReturn = computeTotalReturn(equityCurve);

  // Current allocation (latest month)
  const lastIdx = spyCandles.length - 1;
  const gem = computeGemSignalAtIndex(spyCandles, veuCandles, lastIdx);
  const taa = computeTaaAtIndex(allCandles, lastIdx);
  const sectors = computeSectorAtIndex(allCandles, lastIdx);

  const currentAllocation = {
    gem: { asset: gem.asset, weight: config.gemWeight },
    taa: taa.map((s) => ({
      asset: s.asset,
      invested: s.invested,
      weight: config.taaWeight / TAA_ASSETS.length,
    })),
    sectors: sectors
      .filter((s) => s.selected)
      .map((s, i) => ({
        asset: s.asset,
        rank: i + 1,
        weight: config.sectorWeight / TOP_SECTORS_COUNT,
      })),
  };

  return {
    equityCurve,
    trades,
    cagr,
    sharpe,
    maxDrawdown,
    winRate,
    calmar,
    totalReturn,
    currentAllocation,
  };
}

function emptyResult(): BacktestResult {
  return {
    equityCurve: [],
    trades: [],
    cagr: 0,
    sharpe: 0,
    maxDrawdown: 0,
    winRate: 0,
    calmar: 0,
    totalReturn: 0,
    currentAllocation: null,
  };
}
