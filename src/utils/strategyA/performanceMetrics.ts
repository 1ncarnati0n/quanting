import type { EquityPoint } from "@/stores/useStrategyStore";

export function computeCAGR(equityCurve: EquityPoint[]): number {
  if (equityCurve.length < 2) return 0;
  const first = equityCurve[0].value;
  const last = equityCurve[equityCurve.length - 1].value;
  if (first <= 0) return 0;

  const firstTime = equityCurve[0].time;
  const lastTime = equityCurve[equityCurve.length - 1].time;
  const years = (lastTime - firstTime) / (365.25 * 24 * 3600);
  if (years <= 0) return 0;

  return Math.pow(last / first, 1 / years) - 1;
}

export function computeMaxDrawdown(equityCurve: EquityPoint[]): number {
  let peak = -Infinity;
  let maxDD = 0;

  for (const point of equityCurve) {
    if (point.value > peak) peak = point.value;
    const dd = (peak - point.value) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  return maxDD;
}

export function computeSharpe(monthlyReturns: number[], riskFreeMonthly = 0): number {
  if (monthlyReturns.length < 2) return 0;

  const excess = monthlyReturns.map((r) => r - riskFreeMonthly);
  const mean = excess.reduce((a, b) => a + b, 0) / excess.length;
  const variance =
    excess.reduce((acc, r) => acc + (r - mean) ** 2, 0) / (excess.length - 1);
  const std = Math.sqrt(variance);

  if (std === 0) return 0;
  return (mean / std) * Math.sqrt(12); // Annualized
}

export function computeCalmar(cagr: number, maxDrawdown: number): number {
  if (maxDrawdown === 0) return 0;
  return cagr / maxDrawdown;
}

export function computeWinRate(monthlyReturns: number[]): number {
  if (monthlyReturns.length === 0) return 0;
  const wins = monthlyReturns.filter((r) => r > 0).length;
  return wins / monthlyReturns.length;
}

export function computeTotalReturn(equityCurve: EquityPoint[]): number {
  if (equityCurve.length < 2) return 0;
  const first = equityCurve[0].value;
  const last = equityCurve[equityCurve.length - 1].value;
  if (first <= 0) return 0;
  return (last - first) / first;
}
