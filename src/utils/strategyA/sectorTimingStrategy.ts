import type { Candle } from "@/types";

export const SECTOR_ETFS = [
  "XLK", "XLV", "XLF", "XLE", "XLY", "XLI", "XLU", "XLRE", "XLB", "XLC", "XLP",
] as const;

export const TOP_SECTORS_COUNT = 3;

export interface SectorRanking {
  asset: string;
  rank: number;
  return12m: number;
  aboveSma: boolean;
  selected: boolean;
}

function sma(candles: Candle[], period: number, endIndex: number): number | null {
  if (endIndex < period - 1) return null;
  let sum = 0;
  for (let i = endIndex - period + 1; i <= endIndex; i++) {
    sum += candles[i].close;
  }
  return sum / period;
}

export function computeSectorRankings(
  sectorCandles: Record<string, Candle[]>,
): SectorRanking[] {
  const rankings: SectorRanking[] = [];

  for (const asset of SECTOR_ETFS) {
    const candles = sectorCandles[asset];
    if (!candles || candles.length < 13) {
      rankings.push({ asset, rank: 999, return12m: 0, aboveSma: false, selected: false });
      continue;
    }

    const lastIdx = candles.length - 1;
    const now = candles[lastIdx].close;
    const past = candles[lastIdx - 12]?.close ?? now;
    const ret12m = past > 0 ? (now - past) / past : 0;

    const sma10 = sma(candles, 10, lastIdx);
    const aboveSma = sma10 !== null && now > sma10;

    rankings.push({ asset, rank: 0, return12m: ret12m, aboveSma, selected: false });
  }

  rankings.sort((a, b) => b.return12m - a.return12m);
  rankings.forEach((r, i) => (r.rank = i + 1));

  // Select top 3 that are also above SMA
  let selected = 0;
  for (const r of rankings) {
    if (selected >= TOP_SECTORS_COUNT) break;
    if (r.aboveSma && r.return12m > 0) {
      r.selected = true;
      selected++;
    }
  }

  return rankings;
}

export function computeSectorAtIndex(
  sectorCandles: Record<string, Candle[]>,
  index: number,
): { asset: string; selected: boolean; returnPct: number }[] {
  if (index < 12) {
    return SECTOR_ETFS.map((asset) => ({ asset, selected: false, returnPct: 0 }));
  }

  const items = SECTOR_ETFS.map((asset) => {
    const candles = sectorCandles[asset];
    if (!candles) return { asset, ret12m: 0, aboveSma: false, returnPct: 0 };

    const now = candles[index]?.close ?? 0;
    const past = candles[index - 12]?.close ?? now;
    const ret12m = past > 0 ? (now - past) / past : 0;

    const smaVal = sma(candles, 10, index);
    const aboveSma = smaVal !== null && now > smaVal;

    const prev = candles[index - 1]?.close ?? now;
    const returnPct = prev > 0 ? (now - prev) / prev : 0;

    return { asset, ret12m, aboveSma, returnPct };
  });

  items.sort((a, b) => b.ret12m - a.ret12m);

  let selected = 0;
  return items.map((item) => {
    const isSelected = selected < TOP_SECTORS_COUNT && item.aboveSma && item.ret12m > 0;
    if (isSelected) selected++;
    return { asset: item.asset, selected: isSelected, returnPct: item.returnPct };
  });
}
