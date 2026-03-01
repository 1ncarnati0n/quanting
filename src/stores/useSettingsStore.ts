import { create } from "zustand";
import {
  CRYPTO_INTERVALS,
  STOCK_INTERVALS,
  DEFAULT_SYMBOL,
  DEFAULT_INTERVAL,
  DEFAULT_MARKET,
  DEFAULTS,
  INDICATOR_DEFAULTS,
  getIntervalsForMarket,
} from "../utils/constants";
import type { Interval, Theme } from "../utils/constants";
import type { MarketType } from "../types";

export type ChartType = "candlestick" | "heikinAshi" | "line" | "area" | "bar";
export type PriceScaleMode = "normal" | "logarithmic" | "percentage";
export type AlertCondition = "above" | "below";
export type MultiChartLayout = 1 | 2 | 4;

export interface FavoriteSymbol {
  symbol: string;
  market: MarketType;
}

export interface PriceScaleSettings {
  mode: PriceScaleMode;
  autoScale: boolean;
  invertScale: boolean;
}

export interface CompareSettings {
  enabled: boolean;
  symbol: string;
  market: MarketType;
  normalize: boolean;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  market: MarketType;
  price: number;
  condition: AlertCondition;
  active: boolean;
  createdAt: number;
  triggeredAt: number | null;
}

export interface AlertHistoryItem {
  id: string;
  alertId: string;
  symbol: string;
  market: MarketType;
  price: number;
  condition: AlertCondition;
  triggeredPrice: number;
  triggeredAt: number;
}

export interface IndicatorConfig {
  bb: { enabled: boolean; period: number; multiplier: number };
  rsi: { enabled: boolean; period: number };
  sma: { enabled: boolean; periods: number[] };
  ema: { enabled: boolean; periods: number[] };
  macd: {
    enabled: boolean;
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
  };
  stochastic: {
    enabled: boolean;
    kPeriod: number;
    dPeriod: number;
    smooth: number;
  };
  volume: { enabled: boolean };
  obv: { enabled: boolean };
  signalZones: { enabled: boolean };
  volumeProfile: { enabled: boolean; bins: number };
  fundamentals: { enabled: boolean };
  vwap: { enabled: boolean };
  atr: { enabled: boolean };
  ichimoku: { enabled: boolean };
  supertrend: { enabled: boolean };
  psar: { enabled: boolean };
  layout: {
    priceAreaRatio: number;
    volumeWeight: number;
    rsiWeight: number;
    macdWeight: number;
    stochasticWeight: number;
    obvWeight: number;
    atrWeight: number;
  };
  signalFilter: {
    enabled: boolean;
    applyRegimeFilter: boolean;
    applyMomentumFilter: boolean;
    applyVolatilityFilter: boolean;
    regimePeriod: number;
    regimeBuffer: number;
    momentumPeriod: number;
    minMomentumForBuy: number;
    maxMomentumForSell: number;
    volatilityPeriod: number;
    volatilityRankPeriod: number;
    highVolPercentile: number;
    keepStrongCounterTrend: boolean;
    keepStrongInHighVol: boolean;
  };
}

type IndicatorKey = keyof IndicatorConfig;
type ToggleableIndicatorKey = Exclude<IndicatorKey, "layout">;

const DEFAULT_INDICATORS: IndicatorConfig = {
  bb: { enabled: true, period: DEFAULTS.bbPeriod, multiplier: DEFAULTS.bbMultiplier },
  rsi: { enabled: true, period: DEFAULTS.rsiPeriod },
  sma: { enabled: false, periods: [...INDICATOR_DEFAULTS.sma.periods] },
  ema: { enabled: false, periods: [...INDICATOR_DEFAULTS.ema.periods] },
  macd: { enabled: false, ...INDICATOR_DEFAULTS.macd },
  stochastic: { enabled: false, ...INDICATOR_DEFAULTS.stochastic },
  volume: { enabled: false },
  obv: { enabled: false },
  signalZones: { enabled: false },
  volumeProfile: { enabled: false, bins: 24 },
  fundamentals: { enabled: false },
  vwap: { enabled: false },
  atr: { enabled: false },
  ichimoku: { enabled: false },
  supertrend: { enabled: false },
  psar: { enabled: false },
  layout: {
    priceAreaRatio: 0.62,
    volumeWeight: 1.2,
    rsiWeight: 1,
    macdWeight: 1.2,
    stochasticWeight: 1,
    obvWeight: 1,
    atrWeight: 1,
  },
  signalFilter: { ...INDICATOR_DEFAULTS.signalFilter },
};

const DEFAULT_PRICE_SCALE: PriceScaleSettings = {
  mode: "normal",
  autoScale: true,
  invertScale: false,
};

const DEFAULT_COMPARE: CompareSettings = {
  enabled: false,
  symbol: "SPY",
  market: "usStock",
  normalize: false,
};

interface SettingsState {
  symbol: string;
  interval: Interval;
  market: MarketType;
  theme: Theme;
  chartType: ChartType;
  multiChartLayout: MultiChartLayout;
  indicators: IndicatorConfig;
  favorites: FavoriteSymbol[];
  recentSymbols: FavoriteSymbol[];
  priceScale: PriceScaleSettings;
  compare: CompareSettings;
  priceAlerts: PriceAlert[];
  alertHistory: AlertHistoryItem[];
  showSettings: boolean;
  isFullscreen: boolean;
  setSymbol: (symbol: string, market?: MarketType) => void;
  setInterval: (interval: Interval) => void;
  setMarket: (market: MarketType) => void;
  toggleFavorite: (symbol: string, market?: MarketType) => void;
  clearRecentSymbols: () => void;
  setPriceScale: (partial: Partial<PriceScaleSettings>) => void;
  setCompare: (partial: Partial<CompareSettings>) => void;
  addPriceAlert: (
    price: number,
    condition: AlertCondition,
    symbol?: string,
    market?: MarketType,
  ) => void;
  removePriceAlert: (alertId: string) => void;
  togglePriceAlert: (alertId: string) => void;
  markAlertTriggered: (alertId: string, triggeredPrice: number) => void;
  clearAlertHistory: () => void;
  toggleTheme: () => void;
  setChartType: (chartType: ChartType) => void;
  setMultiChartLayout: (layout: MultiChartLayout) => void;
  setIndicator: <K extends IndicatorKey>(
    key: K,
    partial: Partial<IndicatorConfig[K]>,
  ) => void;
  toggleIndicator: (key: ToggleableIndicatorKey) => void;
  setShowSettings: (show: boolean) => void;
  toggleFullscreen: () => void;
}

function getSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem("bb-rsi-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "dark";
}

const VALID_CHART_TYPES: ChartType[] = ["candlestick", "heikinAshi", "line", "area", "bar"];

function getSavedChartType(): ChartType {
  try {
    const saved = localStorage.getItem("quanting-chart-type");
    if (saved && VALID_CHART_TYPES.includes(saved as ChartType)) return saved as ChartType;
  } catch {}
  return "candlestick";
}

function getSavedIndicators(): IndicatorConfig {
  try {
    const saved = localStorage.getItem("bb-rsi-indicators");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        bb: { ...DEFAULT_INDICATORS.bb, ...parsed.bb },
        rsi: { ...DEFAULT_INDICATORS.rsi, ...parsed.rsi },
        sma: { ...DEFAULT_INDICATORS.sma, ...parsed.sma },
        ema: { ...DEFAULT_INDICATORS.ema, ...parsed.ema },
        macd: { ...DEFAULT_INDICATORS.macd, ...parsed.macd },
        stochastic: { ...DEFAULT_INDICATORS.stochastic, ...parsed.stochastic },
        volume: { ...DEFAULT_INDICATORS.volume, ...parsed.volume },
        obv: { ...DEFAULT_INDICATORS.obv, ...parsed.obv },
        signalZones: { ...DEFAULT_INDICATORS.signalZones, ...parsed.signalZones },
        volumeProfile: {
          ...DEFAULT_INDICATORS.volumeProfile,
          ...parsed.volumeProfile,
        },
        fundamentals: { ...DEFAULT_INDICATORS.fundamentals, ...parsed.fundamentals },
        vwap: { ...DEFAULT_INDICATORS.vwap, ...parsed.vwap },
        atr: { ...DEFAULT_INDICATORS.atr, ...parsed.atr },
        ichimoku: { ...DEFAULT_INDICATORS.ichimoku, ...parsed.ichimoku },
        supertrend: { ...DEFAULT_INDICATORS.supertrend, ...parsed.supertrend },
        psar: { ...DEFAULT_INDICATORS.psar, ...parsed.psar },
        layout: { ...DEFAULT_INDICATORS.layout, ...parsed.layout },
        signalFilter: {
          ...DEFAULT_INDICATORS.signalFilter,
          ...parsed.signalFilter,
        },
      };
    }
  } catch {}
  return { ...DEFAULT_INDICATORS };
}

function saveIndicators(indicators: IndicatorConfig) {
  try {
    localStorage.setItem("bb-rsi-indicators", JSON.stringify(indicators));
  } catch {}
}

const FAVORITES_STORAGE_KEY = "quanting-favorites";
const RECENT_SYMBOLS_STORAGE_KEY = "quanting-recent-symbols";
const PRICE_SCALE_STORAGE_KEY = "quanting-price-scale";
const COMPARE_STORAGE_KEY = "quanting-compare";
const PRICE_ALERTS_STORAGE_KEY = "quanting-price-alerts";
const ALERT_HISTORY_STORAGE_KEY = "quanting-alert-history";
const MULTI_CHART_LAYOUT_STORAGE_KEY = "quanting-multi-layout";
const LAST_SYMBOL_STORAGE_KEY = "quanting-last-symbol";
const INTERVAL_STORAGE_KEY = "quanting-interval";
const MAX_RECENT_SYMBOLS = 12;
const TRACKED_CRYPTO_SYMBOLS = new Set(["BTCUSDT", "ETHUSDT", "SOLUSDT"]);
const TRACKED_FOREX_SYMBOLS = new Set(["USDKRW=X", "EURKRW=X", "JPYKRW=X", "CNYKRW=X"]);

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function isKnownInterval(interval: unknown): interval is Interval {
  if (typeof interval !== "string") return false;
  return (
    (CRYPTO_INTERVALS as readonly string[]).includes(interval) ||
    (STOCK_INTERVALS as readonly string[]).includes(interval)
  );
}

function isKnownMarketType(market: unknown): market is MarketType {
  return market === "crypto" || market === "usStock" || market === "krStock" || market === "forex";
}

function isAllowedSymbolForMarket(symbol: string, market: MarketType): boolean {
  if (market === "crypto") return TRACKED_CRYPTO_SYMBOLS.has(symbol);
  if (market === "forex") return TRACKED_FOREX_SYMBOLS.has(symbol);
  return symbol.length > 0;
}

function sanitizeSymbolForMarket(symbol: string, market: MarketType): string | null {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;
  return isAllowedSymbolForMarket(normalized, market) ? normalized : null;
}

function fallbackSymbolForMarket(market: MarketType): string {
  if (market === "crypto") return "BTCUSDT";
  if (market === "forex") return "USDKRW=X";
  return DEFAULT_SYMBOL;
}

function parseFavoriteSymbol(item: unknown): FavoriteSymbol | null {
  if (!item || typeof item !== "object") return null;
  const raw = item as { symbol?: unknown; market?: unknown };
  if (typeof raw.symbol !== "string" || !isKnownMarketType(raw.market)) return null;
  const symbol = sanitizeSymbolForMarket(raw.symbol, raw.market);
  if (!symbol) return null;
  return { symbol, market: raw.market };
}

function favoriteKey(favorite: FavoriteSymbol): string {
  return `${favorite.market}:${favorite.symbol}`;
}

function getSavedFavorites(): FavoriteSymbol[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map(parseFavoriteSymbol)
      .filter((item): item is FavoriteSymbol => item !== null);

    const deduped: FavoriteSymbol[] = [];
    const seen = new Set<string>();
    for (const item of normalized) {
      const key = favoriteKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }
    saveFavorites(deduped);
    return deduped;
  } catch {}
  return [];
}

function saveFavorites(favorites: FavoriteSymbol[]) {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch {}
}

function getSavedRecentSymbols(): FavoriteSymbol[] {
  try {
    const raw = localStorage.getItem(RECENT_SYMBOLS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map(parseFavoriteSymbol)
      .filter((item): item is FavoriteSymbol => item !== null);

    const deduped: FavoriteSymbol[] = [];
    const seen = new Set<string>();
    for (const item of normalized) {
      const key = favoriteKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
      if (deduped.length >= MAX_RECENT_SYMBOLS) break;
    }
    saveRecentSymbols(deduped);
    return deduped;
  } catch {}
  return [];
}

function saveRecentSymbols(items: FavoriteSymbol[]) {
  try {
    localStorage.setItem(RECENT_SYMBOLS_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

function mergeRecentSymbols(
  existing: FavoriteSymbol[],
  incoming: FavoriteSymbol,
): FavoriteSymbol[] {
  const key = favoriteKey(incoming);
  const next = [incoming, ...existing.filter((item) => favoriteKey(item) !== key)].slice(
    0,
    MAX_RECENT_SYMBOLS,
  );
  return next;
}

function getSavedPriceScale(): PriceScaleSettings {
  try {
    const raw = localStorage.getItem(PRICE_SCALE_STORAGE_KEY);
    if (!raw) return DEFAULT_PRICE_SCALE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PRICE_SCALE, ...parsed };
  } catch {}
  return DEFAULT_PRICE_SCALE;
}

function savePriceScale(priceScale: PriceScaleSettings) {
  try {
    localStorage.setItem(PRICE_SCALE_STORAGE_KEY, JSON.stringify(priceScale));
  } catch {}
}

function getSavedCompare(): CompareSettings {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return DEFAULT_COMPARE;
    const parsed = JSON.parse(raw);
    const market = isKnownMarketType(parsed.market) ? parsed.market : DEFAULT_COMPARE.market;
    const symbol = sanitizeSymbolForMarket(parsed.symbol ?? DEFAULT_COMPARE.symbol, market)
      ?? fallbackSymbolForMarket(market);
    const next: CompareSettings = {
      ...DEFAULT_COMPARE,
      ...parsed,
      market,
      symbol,
    };
    saveCompare(next);
    return next;
  } catch {}
  return DEFAULT_COMPARE;
}

function saveCompare(compare: CompareSettings) {
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compare));
  } catch {}
}

function getSavedPriceAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(PRICE_ALERTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed
      .filter((item) => item && typeof item.id === "string" && typeof item.symbol === "string")
      .map((item) => {
        const market = isKnownMarketType(item.market) ? item.market : "usStock";
        const symbol = sanitizeSymbolForMarket(item.symbol as string, market);
        if (!symbol) return null;
        return {
          id: item.id as string,
          symbol,
          market,
          price: Number(item.price ?? 0),
          condition: (item.condition ?? "above") as AlertCondition,
          active: Boolean(item.active ?? true),
          createdAt: Number(item.createdAt ?? Date.now()),
          triggeredAt: item.triggeredAt ? Number(item.triggeredAt) : null,
        };
      })
      .filter((item): item is PriceAlert => item !== null)
      .filter((item) => item.price > 0);
    savePriceAlerts(normalized);
    return normalized;
  } catch {}
  return [];
}

function savePriceAlerts(alerts: PriceAlert[]) {
  try {
    localStorage.setItem(PRICE_ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  } catch {}
}

function getSavedAlertHistory(): AlertHistoryItem[] {
  try {
    const raw = localStorage.getItem(ALERT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed
      .filter((item) => item && typeof item.id === "string" && typeof item.alertId === "string")
      .map((item) => {
        const market = isKnownMarketType(item.market) ? item.market : "usStock";
        const symbol = sanitizeSymbolForMarket(item.symbol as string, market);
        if (!symbol) return null;
        return {
          id: item.id as string,
          alertId: item.alertId as string,
          symbol,
          market,
          price: Number(item.price ?? 0),
          condition: (item.condition ?? "above") as AlertCondition,
          triggeredPrice: Number(item.triggeredPrice ?? 0),
          triggeredAt: Number(item.triggeredAt ?? Date.now()),
        };
      })
      .filter((item): item is AlertHistoryItem => item !== null);
    saveAlertHistory(normalized);
    return normalized;
  } catch {}
  return [];
}

function saveAlertHistory(items: AlertHistoryItem[]) {
  try {
    localStorage.setItem(ALERT_HISTORY_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 9);
  const now = Date.now().toString(36);
  return `${prefix}-${now}-${rand}`;
}

function getSavedMultiChartLayout(): MultiChartLayout {
  try {
    const raw = localStorage.getItem(MULTI_CHART_LAYOUT_STORAGE_KEY);
    if (raw === "2") return 2;
    if (raw === "4") return 4;
  } catch {}
  return 1;
}

function saveMultiChartLayout(layout: MultiChartLayout) {
  try {
    localStorage.setItem(MULTI_CHART_LAYOUT_STORAGE_KEY, String(layout));
  } catch {}
}

function getSavedLastSymbol(): { symbol: string; market: MarketType } {
  try {
    const raw = localStorage.getItem(LAST_SYMBOL_STORAGE_KEY);
    if (!raw) return { symbol: DEFAULT_SYMBOL, market: DEFAULT_MARKET };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.symbol === "string" && typeof parsed.market === "string") {
      const market = isKnownMarketType(parsed.market) ? parsed.market : DEFAULT_MARKET;
      const symbol = sanitizeSymbolForMarket(parsed.symbol, market) ?? fallbackSymbolForMarket(market);
      const next = { symbol, market };
      saveLastSymbol(next.symbol, next.market);
      return next;
    }
  } catch {}
  return { symbol: DEFAULT_SYMBOL, market: DEFAULT_MARKET };
}

function saveLastSymbol(symbol: string, market: MarketType) {
  try {
    localStorage.setItem(LAST_SYMBOL_STORAGE_KEY, JSON.stringify({ symbol, market }));
  } catch {}
}

function getSavedInterval(): Interval {
  try {
    const raw = localStorage.getItem(INTERVAL_STORAGE_KEY);
    if (!raw) return DEFAULT_INTERVAL;
    if (isKnownInterval(raw)) return raw;
  } catch {}
  return DEFAULT_INTERVAL;
}

function saveInterval(interval: Interval) {
  try {
    localStorage.setItem(INTERVAL_STORAGE_KEY, interval);
  } catch {}
}

const INITIAL_LAST_SYMBOL = getSavedLastSymbol();
const INITIAL_INTERVAL = getSavedInterval();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  symbol: INITIAL_LAST_SYMBOL.symbol,
  interval: INITIAL_INTERVAL,
  market: INITIAL_LAST_SYMBOL.market,
  theme: getSavedTheme(),
  chartType: getSavedChartType(),
  multiChartLayout: getSavedMultiChartLayout(),
  indicators: getSavedIndicators(),
  favorites: getSavedFavorites(),
  recentSymbols: getSavedRecentSymbols(),
  priceScale: getSavedPriceScale(),
  compare: getSavedCompare(),
  priceAlerts: getSavedPriceAlerts(),
  alertHistory: getSavedAlertHistory(),
  showSettings: false,
  isFullscreen: false,
  setSymbol: (symbol, market) =>
    set((state) => {
      const resolvedMarket = market ?? state.market;
      const normalizedSymbol = sanitizeSymbolForMarket(symbol, resolvedMarket);
      if (!normalizedSymbol) return {};

      const updates: Partial<SettingsState> = {};
      let changed = false;

      if (normalizedSymbol !== state.symbol) {
        updates.symbol = normalizedSymbol;
        changed = true;
      }

      if (resolvedMarket !== state.market) {
        updates.market = resolvedMarket;
        changed = true;

        const validIntervals = getIntervalsForMarket(resolvedMarket);
        if (!validIntervals.includes(state.interval)) {
          updates.interval = "1d";
        }
      }

      if (changed) {
        saveLastSymbol(normalizedSymbol, resolvedMarket);
        saveInterval((updates.interval ?? state.interval) as Interval);
      }

      const nextRecent = mergeRecentSymbols(state.recentSymbols, {
        symbol: normalizedSymbol,
        market: resolvedMarket,
      });
      const recentChanged =
        nextRecent.length !== state.recentSymbols.length ||
        nextRecent.some(
          (item, index) => favoriteKey(item) !== favoriteKey(state.recentSymbols[index] ?? item),
        );

      if (recentChanged) {
        updates.recentSymbols = nextRecent;
        saveRecentSymbols(nextRecent);
        changed = true;
      }

      return changed ? updates : {};
    }),
  setInterval: (interval) =>
    set(() => {
      saveInterval(interval);
      return { interval };
    }),
  setMarket: (market) => {
    const current = get();
    const validIntervals = getIntervalsForMarket(market);
    const currentInterval = current.interval;
    const currentSymbol = sanitizeSymbolForMarket(current.symbol, market);
    const nextSymbol = currentSymbol ?? fallbackSymbolForMarket(market);
    const updates: Partial<SettingsState> = { market };
    if (nextSymbol !== current.symbol) {
      updates.symbol = nextSymbol;
    }
    if (!validIntervals.includes(currentInterval)) {
      updates.interval = "1d";
    }
    set(updates);
    saveInterval((updates.interval ?? currentInterval) as Interval);
    if (market !== current.market || nextSymbol !== current.symbol) {
      saveLastSymbol(nextSymbol, market);
    }
  },
  toggleFavorite: (symbol, market) =>
    set((state) => {
      const resolvedMarket = market ?? state.market;
      const normalizedSymbol = sanitizeSymbolForMarket(symbol, resolvedMarket);
      if (!normalizedSymbol) return {};

      const target: FavoriteSymbol = {
        symbol: normalizedSymbol,
        market: resolvedMarket,
      };
      const targetKey = favoriteKey(target);
      const exists = state.favorites.some((item) => favoriteKey(item) === targetKey);
      const next = exists
        ? state.favorites.filter((item) => favoriteKey(item) !== targetKey)
        : [target, ...state.favorites];

      saveFavorites(next);
      return { favorites: next };
    }),
  clearRecentSymbols: () =>
    set(() => {
      saveRecentSymbols([]);
      return { recentSymbols: [] };
    }),
  setPriceScale: (partial) =>
    set((state) => {
      const next = { ...state.priceScale, ...partial };
      savePriceScale(next);
      return { priceScale: next };
    }),
  setCompare: (partial) =>
    set((state) => {
      const market = partial.market ?? state.compare.market;
      let symbol = normalizeSymbol(partial.symbol ?? state.compare.symbol);
      if (!symbol) {
        symbol = state.compare.symbol;
      }
      if (partial.symbol === undefined && !isAllowedSymbolForMarket(symbol, market)) {
        symbol = fallbackSymbolForMarket(market);
      }
      const next: CompareSettings = {
        ...state.compare,
        ...partial,
        market,
        symbol,
      };
      saveCompare(next);
      return { compare: next };
    }),
  addPriceAlert: (price, condition, symbol, market) =>
    set((state) => {
      const resolvedMarket = market ?? state.market;
      const resolvedSymbol = sanitizeSymbolForMarket(symbol ?? state.symbol, resolvedMarket);
      if (!resolvedSymbol || !Number.isFinite(price) || price <= 0) return {};

      const exists = state.priceAlerts.some(
        (alert) =>
          alert.symbol === resolvedSymbol &&
          alert.market === resolvedMarket &&
          alert.condition === condition &&
          Math.abs(alert.price - price) < 1e-9,
      );
      if (exists) return {};

      const nextAlert: PriceAlert = {
        id: uid("alert"),
        symbol: resolvedSymbol,
        market: resolvedMarket,
        price,
        condition,
        active: true,
        createdAt: Date.now(),
        triggeredAt: null,
      };
      const next = [nextAlert, ...state.priceAlerts];
      savePriceAlerts(next);
      return { priceAlerts: next };
    }),
  removePriceAlert: (alertId) =>
    set((state) => {
      const next = state.priceAlerts.filter((alert) => alert.id !== alertId);
      savePriceAlerts(next);
      return { priceAlerts: next };
    }),
  togglePriceAlert: (alertId) =>
    set((state) => {
      const next = state.priceAlerts.map((alert) =>
        alert.id === alertId
          ? { ...alert, active: !alert.active, triggeredAt: null }
          : alert,
      );
      savePriceAlerts(next);
      return { priceAlerts: next };
    }),
  markAlertTriggered: (alertId, triggeredPrice) =>
    set((state) => {
      const target = state.priceAlerts.find((alert) => alert.id === alertId);
      if (!target || !target.active) return {};

      const triggeredAt = Date.now();
      const nextAlerts = state.priceAlerts.map((alert) =>
        alert.id === alertId
          ? { ...alert, active: false, triggeredAt }
          : alert,
      );

      const historyItem: AlertHistoryItem = {
        id: uid("history"),
        alertId,
        symbol: target.symbol,
        market: target.market,
        price: target.price,
        condition: target.condition,
        triggeredPrice,
        triggeredAt,
      };
      const nextHistory = [historyItem, ...state.alertHistory].slice(0, 200);

      savePriceAlerts(nextAlerts);
      saveAlertHistory(nextHistory);
      return {
        priceAlerts: nextAlerts,
        alertHistory: nextHistory,
      };
    }),
  clearAlertHistory: () =>
    set(() => {
      saveAlertHistory([]);
      return { alertHistory: [] };
    }),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("bb-rsi-theme", next);
      } catch {}
      return { theme: next };
    }),
  setChartType: (chartType) => {
    try {
      localStorage.setItem("quanting-chart-type", chartType);
    } catch {}
    set({ chartType });
  },
  setMultiChartLayout: (multiChartLayout) => {
    saveMultiChartLayout(multiChartLayout);
    set({ multiChartLayout });
  },
  setIndicator: (key, partial) =>
    set((state) => {
      const updated = {
        indicators: {
          ...state.indicators,
          [key]: { ...state.indicators[key], ...partial },
        },
      };
      saveIndicators(updated.indicators);
      return updated;
    }),
  toggleIndicator: (key) =>
    set((state) => {
      const updated = {
        indicators: {
          ...state.indicators,
          [key]: {
            ...state.indicators[key],
            enabled: !state.indicators[key].enabled,
          },
        },
      };
      saveIndicators(updated.indicators);
      return updated;
    }),
  setShowSettings: (showSettings) => set({ showSettings }),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
}));
