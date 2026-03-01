import type { MarketType } from "../types";

// --- Intervals ---
export const CRYPTO_INTERVALS = [
  "1m",
  "3m",
  "5m",
  "10m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "1d",
  "1w",
  "1M",
] as const;
export const STOCK_INTERVALS = [
  "1m",
  "3m",
  "5m",
  "10m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "1d",
  "1w",
  "1M",
] as const;
export type Interval = (typeof CRYPTO_INTERVALS)[number] | (typeof STOCK_INTERVALS)[number];

export function getIntervalsForMarket(market: MarketType): readonly Interval[] {
  return market === "crypto" ? CRYPTO_INTERVALS : STOCK_INTERVALS;
}

// --- Chart layout ---
export const CHART_PRICE_SCALE_WIDTH = 80;

// --- Defaults ---
export const DEFAULT_SYMBOL = "AAPL";
export const DEFAULT_INTERVAL: Interval = "1d";
export const DEFAULT_MARKET: MarketType = "usStock";

export const DEFAULTS = {
  bbPeriod: 20,
  bbMultiplier: 2.0,
  rsiPeriod: 14,
} as const;

// --- Signal & Indicator Colors (theme-independent) ---
export const COLORS = {
  strongBuy: "#22C55E",
  weakBuy: "#86EFAC",
  strongSell: "#EF4444",
  weakSell: "#FCA5A5",
  bbUpper: "#2563EB",
  bbMiddle: "#F59E0B",
  bbLower: "#2563EB",
  rsiLine: "#A78BFA",
  rsiOverbought: "#EF4444",
  rsiOversold: "#22C55E",
  candleUp: "#22C55E",
  candleDown: "#EF4444",
  // MACD
  macdLine: "#2563EB",
  macdSignal: "#EF4444",
  macdHistUp: "#22C55E",
  macdHistDown: "#EF4444",
  // Stochastic
  stochK: "#F59E0B",
  stochD: "#A78BFA",
  // Volume
  volumeUp: "rgba(34,197,94,0.5)",
  volumeDown: "rgba(239,68,68,0.5)",
  // Signal extensions
  macdBullish: "#2563EB",
  macdBearish: "#F97316",
  stochOversold: "#06B6D4",
  stochOverbought: "#EC4899",
  // Donchian Channels
  donchianUpper: "#0EA5E9",
  donchianMiddle: "#F59E0B",
  donchianLower: "#0EA5E9",
  // Keltner Channels
  keltnerUpper: "#8B5CF6",
  keltnerMiddle: "#A78BFA",
  keltnerLower: "#8B5CF6",
  // MFI
  mfiLine: "#F472B6",
  // CMF
  cmfLine: "#34D399",
  // Choppiness
  chopLine: "#FB923C",
  // Williams %R
  willrLine: "#38BDF8",
  // ADX
  adxLine: "#F59E0B",
  adxPlusDi: "#22C55E",
  adxMinusDi: "#EF4444",
  // CVD
  cvdLine: "#818CF8",
  // STC
  stcLine: "#E879F9",
} as const;

// MA dynamic color palette (up to 7 lines)
export const MA_COLORS = [
  "#F59E0B", "#06B6D4", "#EC4899", "#8B5CF6",
  "#14B8A6", "#F97316", "#6366F1",
] as const;

// Indicator defaults
export const INDICATOR_DEFAULTS = {
  sma: { periods: [20, 50, 200] },
  ema: { periods: [12, 26] },
  macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  hma: { periods: [20] },
  stochastic: { kPeriod: 14, dPeriod: 3, smooth: 3 },
  donchian: { period: 20 },
  keltner: { emaPeriod: 20, atrPeriod: 10, atrMultiplier: 2.0 },
  mfi: { period: 14 },
  cmf: { period: 20 },
  choppiness: { period: 14 },
  williamsR: { period: 14 },
  adx: { period: 14 },
  stc: { tcLen: 10, fastMa: 23, slowMa: 50 },
  signalFilter: {
    enabled: true,
    applyRegimeFilter: true,
    applyMomentumFilter: true,
    applyVolatilityFilter: true,
    regimePeriod: 200,
    regimeBuffer: 0.002,
    momentumPeriod: 63,
    minMomentumForBuy: -0.05,
    maxMomentumForSell: 0.05,
    volatilityPeriod: 20,
    volatilityRankPeriod: 120,
    highVolPercentile: 0.9,
    keepStrongCounterTrend: true,
    keepStrongInHighVol: true,
  },
} as const;

// --- Theme ---
export type Theme = "dark" | "light";

// --- Preset Symbols ---
export interface PresetSymbol {
  symbol: string;
  label: string;
  market: MarketType;
}

export interface PresetCategory {
  name: string;
  market: MarketType;
  items: PresetSymbol[];
}

export const PRESET_CATEGORIES: PresetCategory[] = [
  {
    name: "미국 대형주",
    market: "usStock",
    items: [
      { symbol: "AAPL", label: "Apple", market: "usStock" },
      { symbol: "MSFT", label: "Microsoft", market: "usStock" },
      { symbol: "GOOGL", label: "Alphabet", market: "usStock" },
      { symbol: "AMZN", label: "Amazon", market: "usStock" },
      { symbol: "NVDA", label: "NVIDIA", market: "usStock" },
      { symbol: "META", label: "Meta", market: "usStock" },
      { symbol: "TSLA", label: "Tesla", market: "usStock" },
      { symbol: "BRK-B", label: "Berkshire B", market: "usStock" },
      { symbol: "JPM", label: "JPMorgan", market: "usStock" },
      { symbol: "V", label: "Visa", market: "usStock" },
      { symbol: "UNH", label: "UnitedHealth", market: "usStock" },
      { symbol: "JNJ", label: "J&J", market: "usStock" },
    ],
  },
  {
    name: "미국 ETF",
    market: "usStock",
    items: [
      { symbol: "SPY", label: "S&P 500", market: "usStock" },
      { symbol: "QQQ", label: "Nasdaq 100", market: "usStock" },
      { symbol: "IWM", label: "Russell 2000", market: "usStock" },
      { symbol: "DIA", label: "Dow Jones", market: "usStock" },
      { symbol: "VOO", label: "Vanguard S&P", market: "usStock" },
      { symbol: "VTI", label: "Total Market", market: "usStock" },
      { symbol: "ARKK", label: "ARK Innovation", market: "usStock" },
      { symbol: "XLF", label: "Financial", market: "usStock" },
      { symbol: "XLK", label: "Technology", market: "usStock" },
      { symbol: "XLE", label: "Energy", market: "usStock" },
    ],
  },
  {
    name: "한국 대형주",
    market: "krStock",
    items: [
      { symbol: "005930.KS", label: "삼성전자", market: "krStock" },
      { symbol: "000660.KS", label: "SK하이닉스", market: "krStock" },
      { symbol: "373220.KS", label: "LG에너지솔루션", market: "krStock" },
      { symbol: "005380.KS", label: "현대차", market: "krStock" },
      { symbol: "035420.KS", label: "NAVER", market: "krStock" },
      { symbol: "035720.KS", label: "카카오", market: "krStock" },
      { symbol: "051910.KS", label: "LG화학", market: "krStock" },
      { symbol: "006400.KS", label: "삼성SDI", market: "krStock" },
      { symbol: "028260.KS", label: "삼성물산", market: "krStock" },
      { symbol: "105560.KS", label: "KB금융", market: "krStock" },
    ],
  },
  {
    name: "한국 ETF",
    market: "krStock",
    items: [
      { symbol: "069500.KS", label: "KODEX 200", market: "krStock" },
      { symbol: "102110.KS", label: "TIGER 200", market: "krStock" },
      { symbol: "091160.KS", label: "KODEX 반도체", market: "krStock" },
      { symbol: "305720.KS", label: "KODEX 2차전지", market: "krStock" },
      { symbol: "252670.KS", label: "KODEX 200선물인버스2X", market: "krStock" },
      { symbol: "122630.KS", label: "KODEX 레버리지", market: "krStock" },
    ],
  },
  {
    name: "한국 ACE ETF",
    market: "krStock",
    items: [
      { symbol: "360750.KS", label: "ACE 미국S&P500", market: "krStock" },
      { symbol: "381170.KS", label: "ACE 미국나스닥100", market: "krStock" },
      { symbol: "402970.KS", label: "ACE 미국배당다우존스", market: "krStock" },
      { symbol: "411060.KS", label: "ACE KRX금현물", market: "krStock" },
      { symbol: "411070.KS", label: "ACE KRX은현물", market: "krStock" },
      { symbol: "457480.KS", label: "ACE 테슬라밸류체인액티브", market: "krStock" },
    ],
  },
  {
    name: "금/은 테마",
    market: "usStock",
    items: [
      { symbol: "GLD", label: "SPDR Gold Shares", market: "usStock" },
      { symbol: "IAU", label: "iShares Gold Trust", market: "usStock" },
      { symbol: "SGOL", label: "abrdn Physical Gold Shares", market: "usStock" },
      { symbol: "SLV", label: "iShares Silver Trust", market: "usStock" },
      { symbol: "SIVR", label: "abrdn Physical Silver Shares", market: "usStock" },
    ],
  },
  {
    name: "암호화폐",
    market: "crypto",
    items: [
      { symbol: "BTCUSDT", label: "비트코인", market: "crypto" },
      { symbol: "ETHUSDT", label: "이더리움", market: "crypto" },
      { symbol: "SOLUSDT", label: "솔라나", market: "crypto" },
    ],
  },
  {
    name: "외환 (Forex)",
    market: "forex",
    items: [
      { symbol: "USDKRW=X", label: "달러/원", market: "forex" },
      { symbol: "EURKRW=X", label: "유로/원", market: "forex" },
      { symbol: "JPYKRW=X", label: "엔/원", market: "forex" },
      { symbol: "CNYKRW=X", label: "위안/원", market: "forex" },
    ],
  },
];

// Helper: find label for a symbol
export function getSymbolLabel(symbol: string): string | undefined {
  for (const cat of PRESET_CATEGORIES) {
    const found = cat.items.find((i) => i.symbol === symbol);
    if (found) return found.label;
  }
  return undefined;
}

// Helper: auto-detect market from symbol string
export function detectMarket(symbol: string): MarketType {
  if (symbol.endsWith("USDT") || symbol.endsWith("BTC") || symbol.endsWith("ETH")) {
    return "crypto";
  }
  if (symbol.endsWith("=X")) {
    return "forex";
  }
  if (symbol.includes(".KS") || symbol.includes(".KQ")) {
    return "krStock";
  }
  return "usStock";
}
