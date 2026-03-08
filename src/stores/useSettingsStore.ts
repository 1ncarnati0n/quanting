import { create } from "zustand";
import {
  CRYPTO_INTERVALS,
  STOCK_INTERVALS,
  CHART_COLOR_PRESETS,
  COLORS,
  DEFAULT_SYMBOL,
  DEFAULT_INTERVAL,
  DEFAULT_MARKET,
  DEFAULTS,
  INDICATOR_DEFAULTS,
  getIntervalsForMarket,
} from "../utils/constants";
import type { ChartColorStyle, Interval, Theme } from "../utils/constants";
import type { MarketType } from "../types";

export type SettingsTab = "indicators" | "layout" | "appearance" | "backtest";
export type ChartType = "candlestick" | "heikinAshi" | "line" | "area" | "bar";
export type PriceScaleMode = "normal" | "logarithmic";
export type AlertCondition = "above" | "below";
export type MultiChartLayout = 1 | 2 | 4;
export type WorkspaceView = "dashboard" | "strategy";

export interface FavoriteSymbol {
  symbol: string;
  market: MarketType;
}

export interface CustomSymbol {
  symbol: string;
  label: string;
  market: MarketType;
}

export interface PriceScaleSettings {
  mode: PriceScaleMode;
  autoScale: boolean;
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
  rsi: { enabled: boolean; period: number; color: string; lineWidth: number };
  sma: { enabled: boolean; periods: number[] };
  ema: { enabled: boolean; periods: number[] };
  macd: {
    enabled: boolean;
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
    macdColor: string;
    signalColor: string;
    histogramUpColor: string;
    histogramDownColor: string;
    histogramOpacity: number;
    macdLineWidth: number;
    signalLineWidth: number;
  };
  stochastic: {
    enabled: boolean;
    kPeriod: number;
    dPeriod: number;
    smooth: number;
    kColor: string;
    dColor: string;
    kLineWidth: number;
    dLineWidth: number;
  };
  volume: { enabled: boolean; upColor: string; downColor: string; opacity: number };
  obv: { enabled: boolean; color: string; lineWidth: number };
  signalZones: { enabled: boolean };
  volumeProfile: { enabled: boolean; bins: number };
  fundamentals: { enabled: boolean };
  vwap: { enabled: boolean };
  atr: { enabled: boolean; color: string; lineWidth: number };
  ichimoku: { enabled: boolean };
  supertrend: { enabled: boolean };
  psar: { enabled: boolean };
  hma: { enabled: boolean; periods: number[] };
  donchian: { enabled: boolean; period: number };
  keltner: {
    enabled: boolean;
    emaPeriod: number;
    atrPeriod: number;
    atrMultiplier: number;
  };
  mfi: { enabled: boolean; period: number; color: string; lineWidth: number };
  cmf: { enabled: boolean; period: number; color: string; lineWidth: number };
  choppiness: { enabled: boolean; period: number; color: string; lineWidth: number };
  williamsR: { enabled: boolean; period: number; color: string; lineWidth: number };
  adx: {
    enabled: boolean;
    period: number;
    color: string;
    plusDiColor: string;
    minusDiColor: string;
    lineWidth: number;
    diLineWidth: number;
  };
  cvd: { enabled: boolean; color: string; lineWidth: number };
  rvol: { enabled: boolean; period: number; highColor: string; neutralColor: string; lowColor: string };
  stc: { enabled: boolean; tcLen: number; fastMa: number; slowMa: number; color: string; lineWidth: number };
  smc: { enabled: boolean; swingLength: number };
  anchoredVwap: { enabled: boolean; anchorTime: number | null };
  autoFib: { enabled: boolean; lookback: number; swingLength: number };
  layout: {
    priceAreaRatio: number;
    volumeWeight: number;
    rsiWeight: number;
    macdWeight: number;
    stochasticWeight: number;
    obvWeight: number;
    atrWeight: number;
    mfiWeight: number;
    cmfWeight: number;
    chopWeight: number;
    willrWeight: number;
    adxWeight: number;
    cvdWeight: number;
    rvolWeight: number;
    stcWeight: number;
  };
  signalStrategies: {
    supertrendAdx: boolean;
    emaCrossover: boolean;
    stochRsiCombined: boolean;
    cmfObv: boolean;
    ttmSqueeze: boolean;
    vwapBreakout: boolean;
    parabolicSar: boolean;
    macdHistReversal: boolean;
    ibsMeanReversion: boolean;
    rsiDivergence: boolean;
    emaFastPeriod: number;
    emaSlowPeriod: number;
    divergenceSwingLength: number;
  };
}

type IndicatorKey = keyof IndicatorConfig;
type ToggleableIndicatorKey = Exclude<IndicatorKey, "layout" | "signalStrategies">;

const DEFAULT_INDICATORS: IndicatorConfig = {
  bb: { enabled: true, period: DEFAULTS.bbPeriod, multiplier: DEFAULTS.bbMultiplier },
  rsi: { enabled: true, period: DEFAULTS.rsiPeriod, color: COLORS.rsiLine, lineWidth: 2 },
  sma: { enabled: false, periods: [...INDICATOR_DEFAULTS.sma.periods] },
  ema: { enabled: false, periods: [...INDICATOR_DEFAULTS.ema.periods] },
  macd: {
    enabled: false,
    ...INDICATOR_DEFAULTS.macd,
    macdColor: COLORS.macdLine,
    signalColor: COLORS.macdSignal,
    histogramUpColor: COLORS.macdHistUp,
    histogramDownColor: COLORS.macdHistDown,
    histogramOpacity: 0.52,
    macdLineWidth: 2,
    signalLineWidth: 1,
  },
  stochastic: {
    enabled: false,
    ...INDICATOR_DEFAULTS.stochastic,
    kColor: COLORS.stochK,
    dColor: COLORS.stochD,
    kLineWidth: 2,
    dLineWidth: 1,
  },
  volume: { enabled: false, upColor: COLORS.volumeUp, downColor: COLORS.volumeDown, opacity: 0.52 },
  obv: { enabled: false, color: "#14B8A6", lineWidth: 2 },
  signalZones: { enabled: false },
  volumeProfile: { enabled: false, bins: 24 },
  fundamentals: { enabled: false },
  vwap: { enabled: false },
  atr: { enabled: false, color: "#38BDF8", lineWidth: 2 },
  ichimoku: { enabled: false },
  supertrend: { enabled: false },
  psar: { enabled: false },
  hma: { enabled: false, periods: [...INDICATOR_DEFAULTS.hma.periods] },
  donchian: { enabled: false, ...INDICATOR_DEFAULTS.donchian },
  keltner: { enabled: false, ...INDICATOR_DEFAULTS.keltner },
  mfi: { enabled: false, ...INDICATOR_DEFAULTS.mfi, color: COLORS.mfiLine, lineWidth: 2 },
  cmf: { enabled: false, ...INDICATOR_DEFAULTS.cmf, color: COLORS.cmfLine, lineWidth: 2 },
  choppiness: { enabled: false, ...INDICATOR_DEFAULTS.choppiness, color: COLORS.chopLine, lineWidth: 2 },
  williamsR: { enabled: false, ...INDICATOR_DEFAULTS.williamsR, color: COLORS.willrLine, lineWidth: 2 },
  adx: {
    enabled: false,
    ...INDICATOR_DEFAULTS.adx,
    color: COLORS.adxLine,
    plusDiColor: COLORS.adxPlusDi,
    minusDiColor: COLORS.adxMinusDi,
    lineWidth: 2,
    diLineWidth: 1,
  },
  cvd: { enabled: false, color: COLORS.cvdLine, lineWidth: 2 },
  rvol: {
    enabled: false,
    ...INDICATOR_DEFAULTS.rvol,
    highColor: COLORS.rvolHigh,
    neutralColor: COLORS.rvolNeutral,
    lowColor: COLORS.rvolLow,
  },
  stc: { enabled: false, ...INDICATOR_DEFAULTS.stc, color: COLORS.stcLine, lineWidth: 2 },
  smc: { enabled: false, ...INDICATOR_DEFAULTS.smc },
  anchoredVwap: { enabled: false, anchorTime: null },
  autoFib: { enabled: false, ...INDICATOR_DEFAULTS.autoFib },
  layout: {
    priceAreaRatio: 0.64,
    volumeWeight: 0.82,
    rsiWeight: 1,
    macdWeight: 1.1,
    stochasticWeight: 1,
    obvWeight: 1,
    atrWeight: 1,
    mfiWeight: 1,
    cmfWeight: 1,
    chopWeight: 1,
    willrWeight: 1,
    adxWeight: 1,
    cvdWeight: 1,
    rvolWeight: 1,
    stcWeight: 1,
  },
  signalStrategies: { ...INDICATOR_DEFAULTS.signalStrategies },
};

const DEFAULT_PRICE_SCALE: PriceScaleSettings = {
  mode: "normal",
  autoScale: true,
};

const DEFAULT_CHART_COLOR_STYLE: ChartColorStyle = "international";

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
  chartColorStyle: ChartColorStyle;
  chartType: ChartType;
  multiChartLayout: MultiChartLayout;
  workspaceView: WorkspaceView;
  indicators: IndicatorConfig;
  favorites: FavoriteSymbol[];
  customSymbols: CustomSymbol[];
  recentSymbols: FavoriteSymbol[];
  priceScale: PriceScaleSettings;
  compare: CompareSettings;
  priceAlerts: PriceAlert[];
  alertHistory: AlertHistoryItem[];
  settingsTab: SettingsTab;
  showSettings: boolean;
  isFullscreen: boolean;
  setSettingsTab: (tab: SettingsTab) => void;
  setSymbol: (symbol: string, market?: MarketType) => void;
  setInterval: (interval: Interval) => void;
  setMarket: (market: MarketType) => void;
  toggleFavorite: (symbol: string, market?: MarketType) => void;
  addCustomSymbol: (symbol: string, label: string, market: MarketType) => void;
  removeCustomSymbol: (symbol: string, market: MarketType) => void;
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
  setChartColorStyle: (style: ChartColorStyle) => void;
  setChartType: (chartType: ChartType) => void;
  setMultiChartLayout: (layout: MultiChartLayout) => void;
  setWorkspaceView: (view: WorkspaceView) => void;
  setIndicator: <K extends IndicatorKey>(
    key: K,
    partial: Partial<IndicatorConfig[K]>,
  ) => void;
  toggleIndicator: (key: ToggleableIndicatorKey) => void;
  setShowSettings: (show: boolean) => void;
  toggleFullscreen: () => void;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toValidColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const next = value.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(next) || /^rgba?\(/i.test(next) ? next : fallback;
}

function toLineWidth(value: unknown, fallback: number): number {
  return clamp(Math.round(toFiniteNumber(value, fallback)), 1, 4);
}

function toOpacity(value: unknown, fallback: number): number {
  return clamp(toFiniteNumber(value, fallback), 0.1, 1);
}

function colorWithOpacity(hex: string, opacity: number): string {
  const alpha = Math.round(clamp(opacity, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  return `${hex}${alpha}`;
}

function applyChartColorStyleToIndicators(
  indicators: IndicatorConfig,
  chartColorStyle: ChartColorStyle,
): IndicatorConfig {
  const preset = CHART_COLOR_PRESETS[chartColorStyle];
  return {
    ...indicators,
    macd: {
      ...indicators.macd,
      histogramUpColor: colorWithOpacity(preset.up, indicators.macd.histogramOpacity),
      histogramDownColor: colorWithOpacity(preset.down, indicators.macd.histogramOpacity),
    },
    volume: {
      ...indicators.volume,
      upColor: colorWithOpacity(preset.up, indicators.volume.opacity),
      downColor: colorWithOpacity(preset.down, indicators.volume.opacity),
    },
  };
}

function sanitizeRsiConfig(config: IndicatorConfig["rsi"] | undefined): IndicatorConfig["rsi"] {
  const base = DEFAULT_INDICATORS.rsi;
  return {
    ...base,
    ...config,
    period: clamp(toFiniteNumber(config?.period, base.period), 2, 50),
    color: toValidColor(config?.color, base.color),
    lineWidth: toLineWidth(config?.lineWidth, base.lineWidth),
  };
}

function sanitizeMacdConfig(config: IndicatorConfig["macd"] | undefined): IndicatorConfig["macd"] {
  const base = DEFAULT_INDICATORS.macd;
  return {
    ...base,
    ...config,
    fastPeriod: clamp(toFiniteNumber(config?.fastPeriod, base.fastPeriod), 2, 50),
    slowPeriod: clamp(toFiniteNumber(config?.slowPeriod, base.slowPeriod), 5, 100),
    signalPeriod: clamp(toFiniteNumber(config?.signalPeriod, base.signalPeriod), 2, 50),
    macdColor: toValidColor(config?.macdColor, base.macdColor),
    signalColor: toValidColor(config?.signalColor, base.signalColor),
    histogramUpColor: toValidColor(config?.histogramUpColor, base.histogramUpColor),
    histogramDownColor: toValidColor(config?.histogramDownColor, base.histogramDownColor),
    histogramOpacity: toOpacity(config?.histogramOpacity, base.histogramOpacity),
    macdLineWidth: toLineWidth(config?.macdLineWidth, base.macdLineWidth),
    signalLineWidth: toLineWidth(config?.signalLineWidth, base.signalLineWidth),
  };
}

function sanitizeStochasticConfig(
  config: IndicatorConfig["stochastic"] | undefined,
): IndicatorConfig["stochastic"] {
  const base = DEFAULT_INDICATORS.stochastic;
  return {
    ...base,
    ...config,
    kPeriod: clamp(toFiniteNumber(config?.kPeriod, base.kPeriod), 2, 50),
    dPeriod: clamp(toFiniteNumber(config?.dPeriod, base.dPeriod), 2, 20),
    smooth: clamp(toFiniteNumber(config?.smooth, base.smooth), 1, 10),
    kColor: toValidColor(config?.kColor, base.kColor),
    dColor: toValidColor(config?.dColor, base.dColor),
    kLineWidth: toLineWidth(config?.kLineWidth, base.kLineWidth),
    dLineWidth: toLineWidth(config?.dLineWidth, base.dLineWidth),
  };
}

function sanitizeVolumeConfig(config: IndicatorConfig["volume"] | undefined): IndicatorConfig["volume"] {
  const base = DEFAULT_INDICATORS.volume;
  return {
    ...base,
    ...config,
    upColor: toValidColor(config?.upColor, base.upColor),
    downColor: toValidColor(config?.downColor, base.downColor),
    opacity: toOpacity(config?.opacity, base.opacity),
  };
}

function sanitizeSingleLineConfig<T extends { enabled: boolean; color: string; lineWidth: number }>(
  config: T | undefined,
  base: T,
): T {
  return {
    ...base,
    ...config,
    color: toValidColor(config?.color, base.color),
    lineWidth: toLineWidth(config?.lineWidth, base.lineWidth),
  };
}

function sanitizeAdxConfig(config: IndicatorConfig["adx"] | undefined): IndicatorConfig["adx"] {
  const base = DEFAULT_INDICATORS.adx;
  return {
    ...base,
    ...config,
    period: clamp(toFiniteNumber(config?.period, base.period), 2, 50),
    color: toValidColor(config?.color, base.color),
    plusDiColor: toValidColor(config?.plusDiColor, base.plusDiColor),
    minusDiColor: toValidColor(config?.minusDiColor, base.minusDiColor),
    lineWidth: toLineWidth(config?.lineWidth, base.lineWidth),
    diLineWidth: toLineWidth(config?.diLineWidth, base.diLineWidth),
  };
}

function sanitizeRvolConfig(config: IndicatorConfig["rvol"] | undefined): IndicatorConfig["rvol"] {
  const base = DEFAULT_INDICATORS.rvol;
  return {
    ...base,
    ...config,
    period: clamp(toFiniteNumber(config?.period, base.period), 2, 100),
    highColor: toValidColor(config?.highColor, base.highColor),
    neutralColor: toValidColor(config?.neutralColor, base.neutralColor),
    lowColor: toValidColor(config?.lowColor, base.lowColor),
  };
}

function sanitizeIndicatorEntry<K extends IndicatorKey>(
  key: K,
  config: IndicatorConfig[K] | undefined,
): IndicatorConfig[K] {
  switch (key) {
    case "layout":
      return sanitizeLayoutConfig(config as IndicatorConfig["layout"]) as IndicatorConfig[K];
    case "rsi":
      return sanitizeRsiConfig(config as IndicatorConfig["rsi"]) as IndicatorConfig[K];
    case "macd":
      return sanitizeMacdConfig(config as IndicatorConfig["macd"]) as IndicatorConfig[K];
    case "stochastic":
      return sanitizeStochasticConfig(config as IndicatorConfig["stochastic"]) as IndicatorConfig[K];
    case "volume":
      return sanitizeVolumeConfig(config as IndicatorConfig["volume"]) as IndicatorConfig[K];
    case "obv":
      return sanitizeSingleLineConfig(
        config as IndicatorConfig["obv"],
        DEFAULT_INDICATORS.obv,
      ) as IndicatorConfig[K];
    case "atr":
      return sanitizeSingleLineConfig(
        config as IndicatorConfig["atr"],
        DEFAULT_INDICATORS.atr,
      ) as IndicatorConfig[K];
    case "mfi":
      return {
        ...sanitizeSingleLineConfig(
          config as IndicatorConfig["mfi"],
          DEFAULT_INDICATORS.mfi,
        ),
        period: clamp(
          toFiniteNumber((config as IndicatorConfig["mfi"] | undefined)?.period, DEFAULT_INDICATORS.mfi.period),
          2,
          50,
        ),
      } as IndicatorConfig[K];
    case "cmf":
      return {
        ...sanitizeSingleLineConfig(
          config as IndicatorConfig["cmf"],
          DEFAULT_INDICATORS.cmf,
        ),
        period: clamp(
          toFiniteNumber((config as IndicatorConfig["cmf"] | undefined)?.period, DEFAULT_INDICATORS.cmf.period),
          2,
          50,
        ),
      } as IndicatorConfig[K];
    case "choppiness":
      return {
        ...sanitizeSingleLineConfig(
          config as IndicatorConfig["choppiness"],
          DEFAULT_INDICATORS.choppiness,
        ),
        period: clamp(
          toFiniteNumber((config as IndicatorConfig["choppiness"] | undefined)?.period, DEFAULT_INDICATORS.choppiness.period),
          2,
          50,
        ),
      } as IndicatorConfig[K];
    case "williamsR":
      return {
        ...sanitizeSingleLineConfig(
          config as IndicatorConfig["williamsR"],
          DEFAULT_INDICATORS.williamsR,
        ),
        period: clamp(
          toFiniteNumber((config as IndicatorConfig["williamsR"] | undefined)?.period, DEFAULT_INDICATORS.williamsR.period),
          2,
          50,
        ),
      } as IndicatorConfig[K];
    case "adx":
      return sanitizeAdxConfig(config as IndicatorConfig["adx"]) as IndicatorConfig[K];
    case "cvd":
      return sanitizeSingleLineConfig(
        config as IndicatorConfig["cvd"],
        DEFAULT_INDICATORS.cvd,
      ) as IndicatorConfig[K];
    case "rvol":
      return sanitizeRvolConfig(config as IndicatorConfig["rvol"]) as IndicatorConfig[K];
    case "stc":
      return {
        ...sanitizeSingleLineConfig(
          config as IndicatorConfig["stc"],
          DEFAULT_INDICATORS.stc,
        ),
        tcLen: clamp(
          toFiniteNumber((config as IndicatorConfig["stc"] | undefined)?.tcLen, DEFAULT_INDICATORS.stc.tcLen),
          2,
          30,
        ),
        fastMa: clamp(
          toFiniteNumber((config as IndicatorConfig["stc"] | undefined)?.fastMa, DEFAULT_INDICATORS.stc.fastMa),
          5,
          50,
        ),
        slowMa: clamp(
          toFiniteNumber((config as IndicatorConfig["stc"] | undefined)?.slowMa, DEFAULT_INDICATORS.stc.slowMa),
          20,
          100,
        ),
      } as IndicatorConfig[K];
    default:
      return (config ?? DEFAULT_INDICATORS[key]) as IndicatorConfig[K];
  }
}

function sanitizeLayoutConfig(layout: IndicatorConfig["layout"] | undefined): IndicatorConfig["layout"] {
  const base = DEFAULT_INDICATORS.layout;
  if (!layout) return { ...base };
  return {
    priceAreaRatio: clamp(toFiniteNumber(layout.priceAreaRatio, base.priceAreaRatio), 0.35, 0.85),
    volumeWeight: clamp(toFiniteNumber(layout.volumeWeight, base.volumeWeight), 0.2, 3),
    rsiWeight: clamp(toFiniteNumber(layout.rsiWeight, base.rsiWeight), 0.2, 3),
    macdWeight: clamp(toFiniteNumber(layout.macdWeight, base.macdWeight), 0.2, 3),
    stochasticWeight: clamp(toFiniteNumber(layout.stochasticWeight, base.stochasticWeight), 0.2, 3),
    obvWeight: clamp(toFiniteNumber(layout.obvWeight, base.obvWeight), 0.2, 3),
    atrWeight: clamp(toFiniteNumber(layout.atrWeight, base.atrWeight), 0.2, 3),
    mfiWeight: clamp(toFiniteNumber(layout.mfiWeight, base.mfiWeight), 0.2, 3),
    cmfWeight: clamp(toFiniteNumber(layout.cmfWeight, base.cmfWeight), 0.2, 3),
    chopWeight: clamp(toFiniteNumber(layout.chopWeight, base.chopWeight), 0.2, 3),
    willrWeight: clamp(toFiniteNumber(layout.willrWeight, base.willrWeight), 0.2, 3),
    adxWeight: clamp(toFiniteNumber(layout.adxWeight, base.adxWeight), 0.2, 3),
    cvdWeight: clamp(toFiniteNumber(layout.cvdWeight, base.cvdWeight), 0.2, 3),
    rvolWeight: clamp(toFiniteNumber(layout.rvolWeight, base.rvolWeight), 0.2, 3),
    stcWeight: clamp(toFiniteNumber(layout.stcWeight, base.stcWeight), 0.2, 3),
  };
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
      const nextIndicators = {
        bb: { ...DEFAULT_INDICATORS.bb, ...parsed.bb },
        rsi: sanitizeIndicatorEntry("rsi", { ...DEFAULT_INDICATORS.rsi, ...parsed.rsi }),
        sma: { ...DEFAULT_INDICATORS.sma, ...parsed.sma },
        ema: { ...DEFAULT_INDICATORS.ema, ...parsed.ema },
        macd: sanitizeIndicatorEntry("macd", { ...DEFAULT_INDICATORS.macd, ...parsed.macd }),
        stochastic: sanitizeIndicatorEntry("stochastic", { ...DEFAULT_INDICATORS.stochastic, ...parsed.stochastic }),
        volume: sanitizeIndicatorEntry("volume", { ...DEFAULT_INDICATORS.volume, ...parsed.volume }),
        obv: sanitizeIndicatorEntry("obv", { ...DEFAULT_INDICATORS.obv, ...parsed.obv }),
        signalZones: { ...DEFAULT_INDICATORS.signalZones, ...parsed.signalZones },
        volumeProfile: {
          ...DEFAULT_INDICATORS.volumeProfile,
          ...parsed.volumeProfile,
        },
        fundamentals: { ...DEFAULT_INDICATORS.fundamentals, ...parsed.fundamentals },
        vwap: { ...DEFAULT_INDICATORS.vwap, ...parsed.vwap },
        atr: sanitizeIndicatorEntry("atr", { ...DEFAULT_INDICATORS.atr, ...parsed.atr }),
        ichimoku: { ...DEFAULT_INDICATORS.ichimoku, ...parsed.ichimoku },
        supertrend: { ...DEFAULT_INDICATORS.supertrend, ...parsed.supertrend },
        psar: { ...DEFAULT_INDICATORS.psar, ...parsed.psar },
        hma: { ...DEFAULT_INDICATORS.hma, ...parsed.hma },
        donchian: { ...DEFAULT_INDICATORS.donchian, ...parsed.donchian },
        keltner: { ...DEFAULT_INDICATORS.keltner, ...parsed.keltner },
        mfi: sanitizeIndicatorEntry("mfi", { ...DEFAULT_INDICATORS.mfi, ...parsed.mfi }),
        cmf: sanitizeIndicatorEntry("cmf", { ...DEFAULT_INDICATORS.cmf, ...parsed.cmf }),
        choppiness: sanitizeIndicatorEntry("choppiness", { ...DEFAULT_INDICATORS.choppiness, ...parsed.choppiness }),
        williamsR: sanitizeIndicatorEntry("williamsR", { ...DEFAULT_INDICATORS.williamsR, ...parsed.williamsR }),
        adx: sanitizeIndicatorEntry("adx", { ...DEFAULT_INDICATORS.adx, ...parsed.adx }),
        cvd: sanitizeIndicatorEntry("cvd", { ...DEFAULT_INDICATORS.cvd, ...parsed.cvd }),
        rvol: sanitizeIndicatorEntry("rvol", { ...DEFAULT_INDICATORS.rvol, ...parsed.rvol }),
        stc: sanitizeIndicatorEntry("stc", { ...DEFAULT_INDICATORS.stc, ...parsed.stc }),
        smc: { ...DEFAULT_INDICATORS.smc, ...parsed.smc },
        anchoredVwap: { ...DEFAULT_INDICATORS.anchoredVwap, ...parsed.anchoredVwap },
        autoFib: { ...DEFAULT_INDICATORS.autoFib, ...parsed.autoFib },
        layout: sanitizeLayoutConfig({ ...DEFAULT_INDICATORS.layout, ...parsed.layout }),
        signalStrategies: {
          ...DEFAULT_INDICATORS.signalStrategies,
          ...parsed.signalStrategies,
        },
      };
      return applyChartColorStyleToIndicators(nextIndicators, getSavedChartColorStyle());
    }
  } catch {}
  return applyChartColorStyleToIndicators(
    {
      ...DEFAULT_INDICATORS,
      layout: sanitizeLayoutConfig(DEFAULT_INDICATORS.layout),
    },
    getSavedChartColorStyle(),
  );
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
const CUSTOM_SYMBOLS_STORAGE_KEY = "quanting-custom-symbols";
const CHART_COLOR_STYLE_STORAGE_KEY = "quanting-chart-color-style";
const MAX_CUSTOM_SYMBOLS = 50;
const MULTI_CHART_LAYOUT_STORAGE_KEY = "quanting-multi-layout";
const WORKSPACE_VIEW_STORAGE_KEY = "quanting-workspace-view";
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

function parseCustomSymbol(item: unknown): CustomSymbol | null {
  if (!item || typeof item !== "object") return null;
  const raw = item as { symbol?: unknown; label?: unknown; market?: unknown };
  if (typeof raw.symbol !== "string" || typeof raw.label !== "string" || !isKnownMarketType(raw.market)) return null;
  const symbol = normalizeSymbol(raw.symbol);
  if (!symbol) return null;
  return { symbol, label: raw.label, market: raw.market };
}

function getSavedCustomSymbols(): CustomSymbol[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SYMBOLS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map(parseCustomSymbol)
      .filter((item): item is CustomSymbol => item !== null);

    const deduped: CustomSymbol[] = [];
    const seen = new Set<string>();
    for (const item of normalized) {
      const key = `${item.market}:${item.symbol}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
      if (deduped.length >= MAX_CUSTOM_SYMBOLS) break;
    }
    saveCustomSymbols(deduped);
    return deduped;
  } catch {}
  return [];
}

function saveCustomSymbols(items: CustomSymbol[]) {
  try {
    localStorage.setItem(CUSTOM_SYMBOLS_STORAGE_KEY, JSON.stringify(items));
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
    const mode =
      parsed?.mode === "normal" || parsed?.mode === "logarithmic"
        ? parsed.mode
        : DEFAULT_PRICE_SCALE.mode;
    const autoScale =
      typeof parsed?.autoScale === "boolean" ? parsed.autoScale : DEFAULT_PRICE_SCALE.autoScale;
    return { mode, autoScale };
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
  return 1;
}

function saveMultiChartLayout(layout: MultiChartLayout) {
  try {
    localStorage.setItem(MULTI_CHART_LAYOUT_STORAGE_KEY, String(layout === 1 ? 1 : 1));
  } catch {}
}

function getSavedChartColorStyle(): ChartColorStyle {
  try {
    const raw = localStorage.getItem(CHART_COLOR_STYLE_STORAGE_KEY);
    if (raw === "international" || raw === "korean") return raw;
  } catch {}
  return DEFAULT_CHART_COLOR_STYLE;
}

function saveChartColorStyle(style: ChartColorStyle) {
  try {
    localStorage.setItem(CHART_COLOR_STYLE_STORAGE_KEY, style);
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

function getSavedWorkspaceView(): WorkspaceView {
  try {
    const raw = localStorage.getItem(WORKSPACE_VIEW_STORAGE_KEY);
    if (raw === "dashboard" || raw === "strategy") return raw;
  } catch {}
  return "dashboard";
}

function saveWorkspaceView(view: WorkspaceView) {
  try {
    localStorage.setItem(WORKSPACE_VIEW_STORAGE_KEY, view);
  } catch {}
}

const INITIAL_LAST_SYMBOL = getSavedLastSymbol();
const INITIAL_INTERVAL = getSavedInterval();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  symbol: INITIAL_LAST_SYMBOL.symbol,
  interval: INITIAL_INTERVAL,
  market: INITIAL_LAST_SYMBOL.market,
  theme: getSavedTheme(),
  chartColorStyle: getSavedChartColorStyle(),
  chartType: getSavedChartType(),
  multiChartLayout: getSavedMultiChartLayout(),
  workspaceView: getSavedWorkspaceView(),
  indicators: getSavedIndicators(),
  favorites: getSavedFavorites(),
  customSymbols: getSavedCustomSymbols(),
  recentSymbols: getSavedRecentSymbols(),
  priceScale: getSavedPriceScale(),
  compare: getSavedCompare(),
  priceAlerts: getSavedPriceAlerts(),
  alertHistory: getSavedAlertHistory(),
  settingsTab: "indicators" as SettingsTab,
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

      // 종목/마켓 전환 시 화면 이탈 방지를 위해 자동 스케일을 항상 복구한다.
      if ((updates.symbol || updates.market || updates.interval) && !state.priceScale.autoScale) {
        const nextPriceScale = { ...state.priceScale, autoScale: true };
        updates.priceScale = nextPriceScale;
        savePriceScale(nextPriceScale);
        changed = true;
      }

      return changed ? updates : {};
    }),
  setInterval: (interval) =>
    set((state) => {
      const updates: Partial<SettingsState> = { interval };
      if (!state.priceScale.autoScale) {
        const nextPriceScale = { ...state.priceScale, autoScale: true };
        updates.priceScale = nextPriceScale;
        savePriceScale(nextPriceScale);
      }
      saveInterval(interval);
      return updates;
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
    if (!current.priceScale.autoScale) {
      const nextPriceScale = { ...current.priceScale, autoScale: true };
      updates.priceScale = nextPriceScale;
      savePriceScale(nextPriceScale);
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
  addCustomSymbol: (symbol, label, market) =>
    set((state) => {
      const normalized = normalizeSymbol(symbol);
      if (!normalized) return {};
      const key = `${market}:${normalized}`;
      if (state.customSymbols.some((item) => `${item.market}:${item.symbol}` === key)) return {};
      const next = [{ symbol: normalized, label, market }, ...state.customSymbols].slice(0, MAX_CUSTOM_SYMBOLS);
      saveCustomSymbols(next);
      return { customSymbols: next };
    }),
  removeCustomSymbol: (symbol, market) =>
    set((state) => {
      const key = `${market}:${symbol}`;
      const next = state.customSymbols.filter((item) => `${item.market}:${item.symbol}` !== key);
      if (next.length === state.customSymbols.length) return {};
      saveCustomSymbols(next);
      return { customSymbols: next };
    }),
  clearRecentSymbols: () =>
    set(() => {
      saveRecentSymbols([]);
      return { recentSymbols: [] };
    }),
  setPriceScale: (partial) =>
    set((state) => {
      const nextMode =
        partial.mode === "normal" || partial.mode === "logarithmic"
          ? partial.mode
          : state.priceScale.mode;
      const next: PriceScaleSettings = {
        mode: nextMode,
        autoScale:
          typeof partial.autoScale === "boolean"
            ? partial.autoScale
            : state.priceScale.autoScale,
      };
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
  setChartColorStyle: (chartColorStyle) =>
    set((state) => {
      saveChartColorStyle(chartColorStyle);
      const preset = CHART_COLOR_PRESETS[chartColorStyle];
      const nextIndicators = {
        ...state.indicators,
        macd: {
          ...state.indicators.macd,
          histogramUpColor: colorWithOpacity(preset.up, state.indicators.macd.histogramOpacity),
          histogramDownColor: colorWithOpacity(preset.down, state.indicators.macd.histogramOpacity),
        },
        volume: {
          ...state.indicators.volume,
          upColor: colorWithOpacity(preset.up, state.indicators.volume.opacity),
          downColor: colorWithOpacity(preset.down, state.indicators.volume.opacity),
        },
      };
      saveIndicators(nextIndicators);
      return {
        chartColorStyle,
        indicators: nextIndicators,
      };
    }),
  setChartType: (chartType) => {
    try {
      localStorage.setItem("quanting-chart-type", chartType);
    } catch {}
    set({ chartType });
  },
  setMultiChartLayout: (_multiChartLayout) => {
    saveMultiChartLayout(1);
    set({ multiChartLayout: 1 });
  },
  setWorkspaceView: (workspaceView) => {
    saveWorkspaceView(workspaceView);
    set({ workspaceView });
  },
  setIndicator: (key, partial) =>
    set((state) => {
      let merged = { ...state.indicators[key], ...partial } as IndicatorConfig[typeof key];
      const preset = CHART_COLOR_PRESETS[state.chartColorStyle];
      if (key === "volume") {
        const nextVolume = merged as IndicatorConfig["volume"];
        merged = {
          ...nextVolume,
          upColor: colorWithOpacity(preset.up, nextVolume.opacity),
          downColor: colorWithOpacity(preset.down, nextVolume.opacity),
        } as IndicatorConfig[typeof key];
      }
      if (key === "macd") {
        const nextMacd = merged as IndicatorConfig["macd"];
        merged = {
          ...nextMacd,
          histogramUpColor: colorWithOpacity(preset.up, nextMacd.histogramOpacity),
          histogramDownColor: colorWithOpacity(preset.down, nextMacd.histogramOpacity),
        } as IndicatorConfig[typeof key];
      }
      const nextValue = sanitizeIndicatorEntry(key, merged);
      const updated = {
        indicators: {
          ...state.indicators,
          [key]: nextValue,
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
  setSettingsTab: (settingsTab) => set({ settingsTab }),
  setShowSettings: (showSettings) => set({ showSettings }),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
}));
