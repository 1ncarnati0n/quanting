import { create } from "zustand";
import {
  DEFAULT_SYMBOL,
  DEFAULT_INTERVAL,
  DEFAULT_MARKET,
  DEFAULTS,
  getIntervalsForMarket,
} from "../utils/constants";
import type { Interval, Theme } from "../utils/constants";
import type { MarketType } from "../types";

interface SettingsState {
  symbol: string;
  interval: Interval;
  market: MarketType;
  theme: Theme;
  bbPeriod: number;
  bbMultiplier: number;
  rsiPeriod: number;
  showSettings: boolean;
  setSymbol: (symbol: string, market?: MarketType) => void;
  setInterval: (interval: Interval) => void;
  setMarket: (market: MarketType) => void;
  toggleTheme: () => void;
  setBbPeriod: (period: number) => void;
  setBbMultiplier: (multiplier: number) => void;
  setRsiPeriod: (period: number) => void;
  setShowSettings: (show: boolean) => void;
}

function getSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem("bb-rsi-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "dark";
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  symbol: DEFAULT_SYMBOL,
  interval: DEFAULT_INTERVAL,
  market: DEFAULT_MARKET,
  theme: getSavedTheme(),
  bbPeriod: DEFAULTS.bbPeriod,
  bbMultiplier: DEFAULTS.bbMultiplier,
  rsiPeriod: DEFAULTS.rsiPeriod,
  showSettings: false,
  setSymbol: (symbol, market) => {
    const updates: Partial<SettingsState> = { symbol };
    if (market) {
      updates.market = market;
      // Reset interval if current one is invalid for new market
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
  setBbPeriod: (bbPeriod) => set({ bbPeriod }),
  setBbMultiplier: (bbMultiplier) => set({ bbMultiplier }),
  setRsiPeriod: (rsiPeriod) => set({ rsiPeriod }),
  setShowSettings: (showSettings) => set({ showSettings }),
}));
