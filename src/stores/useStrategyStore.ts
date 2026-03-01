import { create } from "zustand";

export type StrategyTab = "A" | "B" | "ORB";

const STRATEGY_TAB_KEY = "quanting-strategy-tab";

function getSavedStrategyTab(): StrategyTab {
  try {
    const saved = localStorage.getItem(STRATEGY_TAB_KEY);
    if (saved === "A" || saved === "B" || saved === "ORB") return saved;
  } catch {}
  return "A";
}

function saveStrategyTab(tab: StrategyTab) {
  try {
    localStorage.setItem(STRATEGY_TAB_KEY, tab);
  } catch {}
}

// --- Strategy A ---
export interface StrategyAConfig {
  startYear: number;
  initialCapital: number;
  gemWeight: number;
  taaWeight: number;
  sectorWeight: number;
}

export interface EquityPoint {
  time: number;
  value: number;
}

export interface TradeRecord {
  month: string;
  gemAsset: string;
  taaAssets: string[];
  sectorAssets: string[];
  portfolioReturn: number;
  cumulativeReturn: number;
}

export interface BacktestResult {
  equityCurve: EquityPoint[];
  trades: TradeRecord[];
  cagr: number;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
  calmar: number;
  totalReturn: number;
  currentAllocation: {
    gem: { asset: string; weight: number };
    taa: { asset: string; invested: boolean; weight: number }[];
    sectors: { asset: string; rank: number; weight: number }[];
  } | null;
}

// --- Strategy B ---
export type StrategyBSubTab = "macdbb" | "pair";

export interface MACDBBSignal {
  time: number;
  direction: "buy" | "sell";
  price: number;
  confidence: "strong" | "normal";
  conditions: string[];
}

export interface PairTradingResult {
  pairA: string;
  pairB: string;
  beta: number;
  alpha: number;
  adfStatistic: number;
  isCointegrated: boolean;
  halfLife: number;
  zScores: { time: number; value: number }[];
  currentZScore: number;
  signal: "long" | "short" | "close" | "stoploss" | "none";
}

// --- Strategy ORB ---
export interface ORBConfig {
  rangeMinutes: number;
  useVwapFilter: boolean;
  rvolThreshold: number;
  premarketChangeThreshold: number;
}

export interface PremarketStock {
  symbol: string;
  prePrice: number;
  preChange: number;
  preVolume: number;
  normalVolume: number;
  rVol: number;
  hasCatalyst: boolean;
}

export interface ORBSignal {
  symbol: string;
  direction: "long" | "short";
  entry: number;
  target1: number;
  target2: number;
  stop: number;
  rangeHigh: number;
  rangeLow: number;
  time: number;
}

interface StrategyState {
  activeTab: StrategyTab;
  setActiveTab: (tab: StrategyTab) => void;

  // Strategy A
  strategyAConfig: StrategyAConfig;
  setStrategyAConfig: (partial: Partial<StrategyAConfig>) => void;
  backtestResult: BacktestResult | null;
  backtestStatus: "idle" | "loading" | "done" | "error";
  backtestError: string | null;
  setBacktestResult: (result: BacktestResult | null) => void;
  setBacktestStatus: (status: "idle" | "loading" | "done" | "error", error?: string) => void;

  // Strategy B
  strategyBSubTab: StrategyBSubTab;
  setStrategyBSubTab: (tab: StrategyBSubTab) => void;
  macdbbSignals: MACDBBSignal[];
  setMacdbbSignals: (signals: MACDBBSignal[]) => void;
  pairResult: PairTradingResult | null;
  setPairResult: (result: PairTradingResult | null) => void;
  selectedPair: { a: string; b: string; market: string } | null;
  setSelectedPair: (pair: { a: string; b: string; market: string } | null) => void;

  // Strategy ORB
  orbConfig: ORBConfig;
  setOrbConfig: (partial: Partial<ORBConfig>) => void;
  premarketStocks: PremarketStock[];
  setPremarketStocks: (stocks: PremarketStock[]) => void;
  orbSignals: ORBSignal[];
  setOrbSignals: (signals: ORBSignal[]) => void;
}

const DEFAULT_STRATEGY_A_CONFIG: StrategyAConfig = {
  startYear: 2010,
  initialCapital: 100_000,
  gemWeight: 0.4,
  taaWeight: 0.4,
  sectorWeight: 0.2,
};

const DEFAULT_ORB_CONFIG: ORBConfig = {
  rangeMinutes: 5,
  useVwapFilter: true,
  rvolThreshold: 3,
  premarketChangeThreshold: 2,
};

export const useStrategyStore = create<StrategyState>((set) => ({
  activeTab: getSavedStrategyTab(),
  setActiveTab: (tab) => {
    saveStrategyTab(tab);
    set({ activeTab: tab });
  },

  // Strategy A
  strategyAConfig: { ...DEFAULT_STRATEGY_A_CONFIG },
  setStrategyAConfig: (partial) =>
    set((s) => ({ strategyAConfig: { ...s.strategyAConfig, ...partial } })),
  backtestResult: null,
  backtestStatus: "idle",
  backtestError: null,
  setBacktestResult: (result) => set({ backtestResult: result }),
  setBacktestStatus: (status, error) =>
    set({ backtestStatus: status, backtestError: error ?? null }),

  // Strategy B
  strategyBSubTab: "macdbb",
  setStrategyBSubTab: (tab) => set({ strategyBSubTab: tab }),
  macdbbSignals: [],
  setMacdbbSignals: (signals) => set({ macdbbSignals: signals }),
  pairResult: null,
  setPairResult: (result) => set({ pairResult: result }),
  selectedPair: null,
  setSelectedPair: (pair) => set({ selectedPair: pair }),

  // Strategy ORB
  orbConfig: { ...DEFAULT_ORB_CONFIG },
  setOrbConfig: (partial) =>
    set((s) => ({ orbConfig: { ...s.orbConfig, ...partial } })),
  premarketStocks: [],
  setPremarketStocks: (stocks) => set({ premarketStocks: stocks }),
  orbSignals: [],
  setOrbSignals: (signals) => set({ orbSignals: signals }),
}));
