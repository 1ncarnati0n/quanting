import type { MarketType } from "../types";

// --- Intervals ---
export const CRYPTO_INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d", "1w", "1M"] as const;
export const STOCK_INTERVALS = ["1m", "5m", "15m", "1h", "1d", "1w", "1M"] as const;
export type Interval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1M";

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
  stochastic: { kPeriod: 14, dPeriod: 3, smooth: 3 },
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

export const THEME_COLORS = {
  dark: {
    bgApp: "#0a0f1a",
    bgSurface: "#111827",
    bgCard: "#1a2332",
    bgCardHover: "#1f2b3d",
    bgInput: "#243044",
    bgElevated: "#2a3a52",
    bgPrimary: "#0a0f1a",
    bgSecondary: "#1a2332",
    bgTertiary: "#243044",
    surfaceElevated: "#2a3a52",
    textPrimary: "#e5edf7",
    textSecondary: "#9eb0c8",
    borderColor: "#2a3a56",
    accentPrimary: "#2f7cff",
    accentHover: "#4a91ff",
    accentActive: "#1a6aef",
    accentGlow: "0 0 12px rgba(47,124,255,0.25)",
    accentBorder: "rgba(47,124,255,0.30)",
    accentContrast: "#ffffff",
    accentSoft: "rgba(47,124,255,0.14)",
    successColor: "#22c55e",
    dangerColor: "#ef4444",
    warningColor: "#f59e0b",
    panelShadow: "0 10px 28px rgba(2,6,23,0.35)",
    chartBg: "#0d1421",
    chartText: "#9eb0c8",
    chartGrid: "#1b273b",
    chartBorder: "#2a3a56",
  },
  light: {
    bgApp: "#eef3fb",
    bgSurface: "#ffffff",
    bgCard: "#ffffff",
    bgCardHover: "#f5f8ff",
    bgInput: "#e8eef8",
    bgElevated: "#f6f9ff",
    bgPrimary: "#eef3fb",
    bgSecondary: "#ffffff",
    bgTertiary: "#e8eef8",
    surfaceElevated: "#f6f9ff",
    textPrimary: "#111b2d",
    textSecondary: "#475569",
    borderColor: "#c6d3e5",
    accentPrimary: "#1f6fff",
    accentHover: "#3d84ff",
    accentActive: "#1359d9",
    accentGlow: "0 0 10px rgba(31,111,255,0.20)",
    accentBorder: "rgba(31,111,255,0.28)",
    accentContrast: "#ffffff",
    accentSoft: "rgba(31,111,255,0.12)",
    successColor: "#16a34a",
    dangerColor: "#dc2626",
    warningColor: "#d97706",
    panelShadow: "0 8px 20px rgba(15,23,42,0.10)",
    chartBg: "#ffffff",
    chartText: "#334155",
    chartGrid: "#e2e8f0",
    chartBorder: "#c6d3e5",
  },
} as const;

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
    name: "암호화폐",
    market: "crypto",
    items: [
      { symbol: "BTCUSDT", label: "비트코인", market: "crypto" },
      { symbol: "ETHUSDT", label: "이더리움", market: "crypto" },
      { symbol: "BNBUSDT", label: "BNB", market: "crypto" },
      { symbol: "SOLUSDT", label: "솔라나", market: "crypto" },
      { symbol: "XRPUSDT", label: "XRP", market: "crypto" },
      { symbol: "ADAUSDT", label: "카르다노", market: "crypto" },
      { symbol: "DOGEUSDT", label: "도지코인", market: "crypto" },
      { symbol: "DOTUSDT", label: "폴카닷", market: "crypto" },
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
  if (symbol.includes(".KS") || symbol.includes(".KQ")) {
    return "krStock";
  }
  return "usStock";
}
