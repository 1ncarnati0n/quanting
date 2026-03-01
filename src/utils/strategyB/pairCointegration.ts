// OLS regression: y = α + β·x + ε
export function ols(y: number[], x: number[]): { beta: number; alpha: number; residuals: number[] } {
  const n = Math.min(y.length, x.length);
  if (n < 3) return { beta: 0, alpha: 0, residuals: [] };

  let sumX = 0, sumY = 0, sumXX = 0, sumXY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXX += x[i] * x[i];
    sumXY += x[i] * y[i];
  }

  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-12) return { beta: 0, alpha: 0, residuals: [] };

  const beta = (n * sumXY - sumX * sumY) / denom;
  const alpha = (sumY - beta * sumX) / n;

  const residuals: number[] = [];
  for (let i = 0; i < n; i++) {
    residuals.push(y[i] - alpha - beta * x[i]);
  }

  return { beta, alpha, residuals };
}

// ADF (Augmented Dickey-Fuller) test on a time series
// Tests H0: unit root (non-stationary) vs H1: stationary
// MacKinnon (1994) critical values for n=2, 5% significance: -3.37
export function adfTest(series: number[]): { statistic: number; isCointegrated: boolean; pValue: string } {
  const n = series.length;
  if (n < 20) return { statistic: 0, isCointegrated: false, pValue: ">0.10" };

  // ΔY_t = γ · Y_{t-1} + ε_t (simplified ADF without lags)
  const deltaY: number[] = [];
  const yLag: number[] = [];
  for (let i = 1; i < n; i++) {
    deltaY.push(series[i] - series[i - 1]);
    yLag.push(series[i - 1]);
  }

  // Regress ΔY on Y_{t-1}
  const m = deltaY.length;
  let sumXY = 0, sumXX = 0;
  let sumX = 0, sumY = 0;
  for (let i = 0; i < m; i++) {
    sumXY += yLag[i] * deltaY[i];
    sumXX += yLag[i] * yLag[i];
    sumX += yLag[i];
    sumY += deltaY[i];
  }

  // With constant: use de-meaned version
  const meanX = sumX / m;
  const meanY = sumY / m;
  let sxx = 0, sxy = 0;
  for (let i = 0; i < m; i++) {
    sxx += (yLag[i] - meanX) ** 2;
    sxy += (yLag[i] - meanX) * (deltaY[i] - meanY);
  }

  if (sxx < 1e-12) return { statistic: 0, isCointegrated: false, pValue: ">0.10" };

  const gamma = sxy / sxx;
  const alpha = meanY - gamma * meanX;

  // Compute SE(gamma)
  let sse = 0;
  for (let i = 0; i < m; i++) {
    const pred = alpha + gamma * yLag[i];
    sse += (deltaY[i] - pred) ** 2;
  }
  const se = Math.sqrt(sse / ((m - 2) * sxx));
  if (se < 1e-12) return { statistic: 0, isCointegrated: false, pValue: ">0.10" };

  const tStat = gamma / se;

  // MacKinnon critical values (n=2 variables)
  // 1%: -3.90, 5%: -3.37, 10%: -3.07
  let pValue: string;
  if (tStat < -3.90) pValue = "<0.01";
  else if (tStat < -3.37) pValue = "<0.05";
  else if (tStat < -3.07) pValue = "<0.10";
  else pValue = ">0.10";

  const isCointegrated = tStat < -3.37; // 5% significance

  return { statistic: tStat, isCointegrated, pValue };
}

// Compute rolling Z-Score of residuals
export function computeZScore(
  residuals: number[],
  window: number,
): { time: number; value: number }[] {
  const result: { time: number; value: number }[] = [];

  for (let i = window - 1; i < residuals.length; i++) {
    let sum = 0, sumSq = 0;
    for (let j = i - window + 1; j <= i; j++) {
      sum += residuals[j];
      sumSq += residuals[j] ** 2;
    }
    const mean = sum / window;
    const variance = sumSq / window - mean ** 2;
    const std = Math.sqrt(Math.max(0, variance));

    const z = std > 1e-12 ? (residuals[i] - mean) / std : 0;
    result.push({ time: i, value: z });
  }

  return result;
}

// Half-life of mean reversion: HL = -ln(2) / γ
// where γ is the AR(1) coefficient of residuals
export function halfLife(residuals: number[]): number {
  if (residuals.length < 10) return Infinity;

  const y = residuals.slice(1);
  const x = residuals.slice(0, -1);

  const n = y.length;
  let sumXY = 0, sumXX = 0, sumX = 0, sumY = 0;
  for (let i = 0; i < n; i++) {
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
    sumX += x[i];
    sumY += y[i];
  }

  const meanX = sumX / n;
  const meanY = sumY / n;
  let sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (x[i] - meanX) ** 2;
    sxy += (x[i] - meanX) * (y[i] - meanY);
  }

  if (sxx < 1e-12) return Infinity;
  const gamma = sxy / sxx;

  // gamma should be < 1 for mean reversion
  if (gamma >= 1 || gamma >= 0) return Infinity;

  return -Math.LN2 / Math.log(gamma);
}

// Predefined pairs
export const PREDEFINED_PAIRS = [
  { a: "005930.KS", b: "000660.KS", market: "krStock", label: "삼성전자 / SK하이닉스" },
  { a: "005380.KS", b: "000270.KS", market: "krStock", label: "현대차 / 기아" },
  { a: "105560.KS", b: "055550.KS", market: "krStock", label: "KB금융 / 신한지주" },
  { a: "035420.KS", b: "035720.KS", market: "krStock", label: "NAVER / 카카오" },
  { a: "017670.KS", b: "030200.KS", market: "krStock", label: "SKT / KT" },
  { a: "AMD", b: "INTC", market: "usStock", label: "AMD / Intel" },
  { a: "KO", b: "PEP", market: "usStock", label: "Coca-Cola / Pepsi" },
  { a: "XOM", b: "CVX", market: "usStock", label: "Exxon / Chevron" },
  { a: "JPM", b: "BAC", market: "usStock", label: "JPMorgan / BofA" },
  { a: "GLD", b: "IAU", market: "usStock", label: "GLD / IAU" },
] as const;

// Generate trading signal based on Z-Score
export function getZScoreSignal(
  z: number,
): "long" | "short" | "close" | "stoploss" | "none" {
  if (Math.abs(z) > 3.5) return "stoploss";
  if (z > 2.0) return "short";
  if (z < -2.0) return "long";
  if (Math.abs(z) < 0.5) return "close";
  return "none";
}
