import type { MarketType } from "../types";

// --- Intervals ---
export const CRYPTO_INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export const STOCK_INTERVALS = ["1m", "5m", "15m", "1h", "1d"] as const;
export type Interval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export function getIntervalsForMarket(market: MarketType): readonly Interval[] {
  return market === "crypto" ? CRYPTO_INTERVALS : STOCK_INTERVALS;
}

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
} as const;

// --- Theme ---
export type Theme = "dark" | "light";

export const THEME_COLORS = {
  dark: {
    bgPrimary: "#0f0f23",
    bgSecondary: "#1a1a2e",
    bgTertiary: "#16213e",
    textPrimary: "#e0e0e0",
    textSecondary: "#a0a0b0",
    borderColor: "#2a2a4a",
    chartBg: "#0f0f23",
    chartText: "#a0a0b0",
    chartGrid: "#1a1a2e",
    chartBorder: "#2a2a4a",
  },
  light: {
    bgPrimary: "#f8f9fc",
    bgSecondary: "#ffffff",
    bgTertiary: "#eef1f6",
    textPrimary: "#1a1a2e",
    textSecondary: "#6b7280",
    borderColor: "#d1d5db",
    chartBg: "#ffffff",
    chartText: "#374151",
    chartGrid: "#f0f0f0",
    chartBorder: "#d1d5db",
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
    name: "US Large Cap",
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
    name: "US ETFs",
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
    name: "Korean Large Cap",
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
    name: "Korean ETFs",
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
    name: "Crypto",
    market: "crypto",
    items: [
      { symbol: "BTCUSDT", label: "Bitcoin", market: "crypto" },
      { symbol: "ETHUSDT", label: "Ethereum", market: "crypto" },
      { symbol: "BNBUSDT", label: "BNB", market: "crypto" },
      { symbol: "SOLUSDT", label: "Solana", market: "crypto" },
      { symbol: "XRPUSDT", label: "XRP", market: "crypto" },
      { symbol: "ADAUSDT", label: "Cardano", market: "crypto" },
      { symbol: "DOGEUSDT", label: "Dogecoin", market: "crypto" },
      { symbol: "DOTUSDT", label: "Polkadot", market: "crypto" },
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
