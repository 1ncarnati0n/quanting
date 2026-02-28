export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BollingerBandsPoint {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface RsiPoint {
  time: number;
  value: number;
}

// MA (SMA/EMA)
export interface MaPoint {
  time: number;
  value: number;
}

export interface MovingAverageResult {
  period: number;
  data: MaPoint[];
}

// MACD
export interface MacdPoint {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface MacdResult {
  data: MacdPoint[];
}

// Stochastic
export interface StochasticPoint {
  time: number;
  k: number;
  d: number;
}

export interface StochasticResult {
  data: StochasticPoint[];
}

// OBV (On-Balance Volume)
export interface ObvPoint {
  time: number;
  value: number;
}

export interface ObvResult {
  data: ObvPoint[];
}

export interface VwapPoint {
  time: number;
  value: number;
}

export interface VwapResult {
  data: VwapPoint[];
}

export interface AtrPoint {
  time: number;
  value: number;
}

export interface AtrResult {
  period: number;
  data: AtrPoint[];
}

export interface IchimokuPoint {
  time: number;
  conversion: number | null;
  base: number | null;
  spanA: number | null;
  spanB: number | null;
  lagging: number | null;
}

export interface IchimokuResult {
  data: IchimokuPoint[];
}

export interface SupertrendPoint {
  time: number;
  value: number;
  direction: number;
}

export interface SupertrendResult {
  period: number;
  multiplier: number;
  data: SupertrendPoint[];
}

export interface ParabolicSarPoint {
  time: number;
  value: number;
}

export interface ParabolicSarResult {
  step: number;
  maxStep: number;
  data: ParabolicSarPoint[];
}

// Signal types
export type SignalType =
  | "strongBuy"
  | "weakBuy"
  | "strongSell"
  | "weakSell"
  | "macdBullish"
  | "macdBearish"
  | "stochOversold"
  | "stochOverbought";

export interface SignalPoint {
  time: number;
  signalType: SignalType;
  price: number;
  rsi: number;
  source: string;
}

export interface AnalysisResponse {
  candles: Candle[];
  bollingerBands: BollingerBandsPoint[];
  rsi: RsiPoint[];
  signals: SignalPoint[];
  sma: MovingAverageResult[];
  ema: MovingAverageResult[];
  macd: MacdResult | null;
  stochastic: StochasticResult | null;
  obv: ObvResult | null;
  vwap: VwapResult | null;
  atr: AtrResult | null;
  ichimoku: IchimokuResult | null;
  supertrend: SupertrendResult | null;
  parabolicSar: ParabolicSarResult | null;
  symbol: string;
  interval: string;
}

export type MarketType = "crypto" | "usStock" | "krStock" | "forex";

export interface FundamentalsParams {
  symbol: string;
  market: MarketType;
}

export interface FundamentalsResponse {
  symbol: string;
  market: MarketType;
  shortName: string | null;
  currency: string | null;
  marketCap: number | null;
  trailingPe: number | null;
  forwardPe: number | null;
  priceToBook: number | null;
  trailingEps: number | null;
  forwardEps: number | null;
  dividendYield: number | null;
  returnOnEquity: number | null;
  debtToEquity: number | null;
  revenueGrowth: number | null;
  grossMargins: number | null;
  operatingMargins: number | null;
  profitMargins: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  averageVolume: number | null;
}

export interface MacdParams {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
}

export interface StochasticParams {
  kPeriod: number;
  dPeriod: number;
  smooth: number;
}

export interface SignalFilterParams {
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
}

export interface AnalysisParams {
  symbol: string;
  interval: string;
  bbPeriod: number;
  bbMultiplier: number;
  rsiPeriod: number;
  market: MarketType;
  smaPeriods: number[];
  emaPeriods: number[];
  macd: MacdParams | null;
  stochastic: StochasticParams | null;
  showVolume: boolean;
  showObv: boolean;
  signalFilter: SignalFilterParams;
}

export interface WatchlistItemRequest {
  symbol: string;
  market: MarketType;
}

export interface WatchlistSnapshotParams {
  items: WatchlistItemRequest[];
  interval: string;
  limit?: number;
}

export interface WatchlistSnapshot {
  symbol: string;
  market: MarketType;
  lastPrice: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  sparkline: number[];
}
