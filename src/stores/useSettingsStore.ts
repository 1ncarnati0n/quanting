import { create } from "zustand";
import {
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
  layout: {
    priceAreaRatio: number;
    volumeWeight: number;
    rsiWeight: number;
    macdWeight: number;
    stochasticWeight: number;
    obvWeight: number;
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
  layout: {
    priceAreaRatio: 0.62,
    volumeWeight: 1.2,
    rsiWeight: 1,
    macdWeight: 1.2,
    stochasticWeight: 1,
    obvWeight: 1,
  },
  signalFilter: { ...INDICATOR_DEFAULTS.signalFilter },
};

interface SettingsState {
  symbol: string;
  interval: Interval;
  market: MarketType;
  theme: Theme;
  chartType: ChartType;
  indicators: IndicatorConfig;
  showSettings: boolean;
  isFullscreen: boolean;
  setSymbol: (symbol: string, market?: MarketType) => void;
  setInterval: (interval: Interval) => void;
  setMarket: (market: MarketType) => void;
  toggleTheme: () => void;
  setChartType: (chartType: ChartType) => void;
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
      // Merge with defaults to ensure new keys are present
      return {
        bb: { ...DEFAULT_INDICATORS.bb, ...parsed.bb },
        rsi: { ...DEFAULT_INDICATORS.rsi, ...parsed.rsi },
        sma: { ...DEFAULT_INDICATORS.sma, ...parsed.sma },
        ema: { ...DEFAULT_INDICATORS.ema, ...parsed.ema },
        macd: { ...DEFAULT_INDICATORS.macd, ...parsed.macd },
        stochastic: { ...DEFAULT_INDICATORS.stochastic, ...parsed.stochastic },
        volume: { ...DEFAULT_INDICATORS.volume, ...parsed.volume },
        obv: { ...DEFAULT_INDICATORS.obv, ...parsed.obv },
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

export const useSettingsStore = create<SettingsState>((set, get) => ({
  symbol: DEFAULT_SYMBOL,
  interval: DEFAULT_INTERVAL,
  market: DEFAULT_MARKET,
  theme: getSavedTheme(),
  chartType: getSavedChartType(),
  indicators: getSavedIndicators(),
  showSettings: false,
  isFullscreen: false,
  setSymbol: (symbol, market) => {
    const updates: Partial<SettingsState> = { symbol };
    if (market) {
      updates.market = market;
      const validIntervals = getIntervalsForMarket(market);
      if (!validIntervals.includes(get().interval)) {
        updates.interval = "1d";
      }
    }
    set(updates);
  },
  setInterval: (interval) => set({ interval }),
  setMarket: (market) => {
    const validIntervals = getIntervalsForMarket(market);
    const currentInterval = get().interval;
    const updates: Partial<SettingsState> = { market };
    if (!validIntervals.includes(currentInterval)) {
      updates.interval = "1d";
    }
    set(updates);
  },
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
