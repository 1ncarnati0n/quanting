import type { Candle, MarketType } from "../types";

export interface CandleSummary {
  lastCandle: Candle | null;
  prevCandle: Candle | null;
  high: number | null;
  low: number | null;
  change: number;
  changePct: number;
}

export interface MarketBadgeMeta {
  label: string;
  color: string;
}

export interface InstrumentDisplay {
  primary: string;
  secondary: string | null;
}

export interface InstrumentLogoMeta {
  monogram: string;
  badge: string;
  background: string;
  foreground: string;
}

const KNOWN_LOGO_META: Record<
  string,
  Omit<InstrumentLogoMeta, "badge"> & { badge?: string }
> = {
  "krStock:A005930": {
    monogram: "삼성",
    background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
    foreground: "#ffffff",
  },
  "krStock:A000660": {
    monogram: "SK",
    background: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
    foreground: "#ffffff",
  },
  "krStock:A035420": {
    monogram: "N",
    background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
    foreground: "#ffffff",
  },
  "krStock:A068270": {
    monogram: "셀",
    background: "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
    foreground: "#ffffff",
  },
  "usStock:AAPL": {
    monogram: "A",
    background: "linear-gradient(135deg, #111827 0%, #4b5563 100%)",
    foreground: "#ffffff",
  },
  "usStock:NVDA": {
    monogram: "N",
    background: "linear-gradient(135deg, #166534 0%, #22c55e 100%)",
    foreground: "#ffffff",
  },
  "usStock:TSLA": {
    monogram: "T",
    background: "linear-gradient(135deg, #991b1b 0%, #ef4444 100%)",
    foreground: "#ffffff",
  },
  "usStock:SPY": {
    monogram: "SPY",
    background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
    foreground: "#ffffff",
  },
  "usStock:QQQ": {
    monogram: "QQQ",
    background: "linear-gradient(135deg, #581c87 0%, #9333ea 100%)",
    foreground: "#ffffff",
  },
  "crypto:BTCUSDT": {
    monogram: "BTC",
    badge: "코인",
    background: "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)",
    foreground: "#ffffff",
  },
  "crypto:ETHUSDT": {
    monogram: "ETH",
    badge: "코인",
    background: "linear-gradient(135deg, #4338ca 0%, #818cf8 100%)",
    foreground: "#ffffff",
  },
  "crypto:SOLUSDT": {
    monogram: "SOL",
    badge: "코인",
    background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)",
    foreground: "#ffffff",
  },
  "forex:USDKRW=X": {
    monogram: "USD",
    badge: "FX",
    background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
    foreground: "#ffffff",
  },
};

const FALLBACK_MARKET_PALETTES: Record<
  MarketType,
  Array<{ start: string; end: string; foreground: string }>
> = {
  krStock: [
    { start: "#1d4ed8", end: "#60a5fa", foreground: "#ffffff" },
    { start: "#9d174d", end: "#f472b6", foreground: "#ffffff" },
    { start: "#7c2d12", end: "#fb7185", foreground: "#ffffff" },
  ],
  usStock: [
    { start: "#111827", end: "#4b5563", foreground: "#ffffff" },
    { start: "#1e3a8a", end: "#3b82f6", foreground: "#ffffff" },
    { start: "#0f766e", end: "#14b8a6", foreground: "#ffffff" },
  ],
  crypto: [
    { start: "#92400e", end: "#f59e0b", foreground: "#ffffff" },
    { start: "#4c1d95", end: "#8b5cf6", foreground: "#ffffff" },
    { start: "#0f766e", end: "#22d3ee", foreground: "#ffffff" },
  ],
  forex: [
    { start: "#164e63", end: "#06b6d4", foreground: "#ffffff" },
    { start: "#115e59", end: "#2dd4bf", foreground: "#ffffff" },
    { start: "#334155", end: "#94a3b8", foreground: "#ffffff" },
  ],
};

function logoLookupKey(symbol: string, market: MarketType): string {
  return `${market}:${symbol.toUpperCase()}`;
}

function hashText(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function compactKrLabel(label: string): string {
  const normalized = label.replace(/\s+/g, "").replace(/[()[\]{}]/g, "");
  return normalized.slice(0, 2) || "KR";
}

function compactTicker(symbol: string): string {
  const normalized = symbol
    .toUpperCase()
    .replace(/^A(?=\d{6}$)/, "")
    .replace(/=X$/, "")
    .replace(/USDT$|KRW$|USD$/g, "")
    .replace(/[^A-Z0-9]/g, "");
  if (!normalized) return "Q";
  if (normalized.length <= 3) return normalized;
  return normalized.slice(0, 2);
}

export function getInstrumentLogoMeta(
  symbol: string,
  label: string | undefined,
  market: MarketType,
): InstrumentLogoMeta {
  const known = KNOWN_LOGO_META[logoLookupKey(symbol, market)];
  const fallbackBadge = getMarketBadgeMeta(market).label;
  if (known) {
    return {
      monogram: known.monogram,
      badge: known.badge ?? fallbackBadge,
      background: known.background,
      foreground: known.foreground,
    };
  }

  const palettes = FALLBACK_MARKET_PALETTES[market];
  const palette = palettes[hashText(`${market}:${symbol}`) % palettes.length];
  const monogram =
    market === "krStock" && label
      ? compactKrLabel(label)
      : compactTicker(label && market !== "usStock" ? label : symbol);

  return {
    monogram,
    badge: fallbackBadge,
    background: `linear-gradient(135deg, ${palette.start} 0%, ${palette.end} 100%)`,
    foreground: palette.foreground,
  };
}

export function summarizeCandles(candles: Candle[]): CandleSummary {
  const length = candles.length;
  if (length === 0) {
    return {
      lastCandle: null,
      prevCandle: null,
      high: null,
      low: null,
      change: 0,
      changePct: 0,
    };
  }

  let high = candles[0].high;
  let low = candles[0].low;

  for (let i = 1; i < length; i += 1) {
    const candle = candles[i];
    if (candle.high > high) high = candle.high;
    if (candle.low < low) low = candle.low;
  }

  const lastCandle = candles[length - 1];
  const prevCandle = length > 1 ? candles[length - 2] : null;
  const change = prevCandle ? lastCandle.close - prevCandle.close : 0;
  const changePct =
    prevCandle && Math.abs(prevCandle.close) > Number.EPSILON
      ? (change / prevCandle.close) * 100
      : 0;

  return { lastCandle, prevCandle, high, low, change, changePct };
}

export function getMarketBadgeMeta(market: MarketType): MarketBadgeMeta {
  if (market === "crypto") {
    return { label: "코인", color: "var(--warning)" };
  }
  if (market === "krStock") {
    return { label: "KR", color: "var(--brand-kr)" };
  }
  if (market === "forex") {
    return { label: "FX", color: "var(--brand-fx)" };
  }
  return { label: "US", color: "var(--primary)" };
}

export function getInstrumentDisplay(
  symbol: string,
  label: string | undefined,
  market: MarketType,
): InstrumentDisplay {
  if (market === "krStock" && label) {
    return { primary: label, secondary: symbol };
  }
  if (label) {
    return { primary: symbol, secondary: label };
  }
  return { primary: symbol, secondary: null };
}

export function formatInstrumentDisplayLine(
  symbol: string,
  label: string | undefined,
  market: MarketType,
): string {
  const display = getInstrumentDisplay(symbol, label, market);
  return display.secondary ? `${display.primary} · ${display.secondary}` : display.primary;
}

export function formatCompactNumber(value: number | null, locale = "ko-KR"): string {
  if (value === null || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}
