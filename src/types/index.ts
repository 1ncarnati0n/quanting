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
  | "supertrendBuy"
  | "supertrendSell"
  | "emaCrossoverBuy"
  | "emaCrossoverSell"
  | "stochRsiBuy"
  | "stochRsiSell"
  | "cmfObvBuy"
  | "cmfObvSell"
  | "ttmSqueezeBuy"
  | "ttmSqueezeSell"
  | "vwapBreakoutBuy"
  | "vwapBreakoutSell"
  | "parabolicSarBuy"
  | "parabolicSarSell"
  | "macdHistReversalBuy"
  | "macdHistReversalSell"
  | "ibsMeanRevBuy"
  | "ibsMeanRevSell"
  | "rsiDivergenceBuy"
  | "rsiDivergenceSell";

export interface SignalPoint {
  time: number;
  signalType: SignalType;
  price: number;
  rsi: number;
  source: string;
}

// Donchian Channels
export interface DonchianPoint {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface DonchianResult {
  period: number;
  data: DonchianPoint[];
}

// Keltner Channels
export interface KeltnerPoint {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface KeltnerResult {
  emaPeriod: number;
  atrPeriod: number;
  atrMultiplier: number;
  data: KeltnerPoint[];
}

// MFI (Money Flow Index)
export interface MfiPoint {
  time: number;
  value: number;
}

export interface MfiResult {
  period: number;
  data: MfiPoint[];
}

// CMF (Chaikin Money Flow)
export interface CmfPoint {
  time: number;
  value: number;
}

export interface CmfResult {
  period: number;
  data: CmfPoint[];
}

// Choppiness Index
export interface ChoppinessPoint {
  time: number;
  value: number;
}

export interface ChoppinessResult {
  period: number;
  data: ChoppinessPoint[];
}

// Williams %R
export interface WillrPoint {
  time: number;
  value: number;
}

export interface WillrResult {
  period: number;
  data: WillrPoint[];
}

// ADX / DI+ / DI-
export interface AdxPoint {
  time: number;
  adx: number;
  plusDi: number;
  minusDi: number;
}

export interface AdxResult {
  period: number;
  data: AdxPoint[];
}

// CVD (Cumulative Volume Delta)
export interface CvdPoint {
  time: number;
  value: number;
}

export interface CvdResult {
  data: CvdPoint[];
}

// STC (Schaff Trend Cycle)
export interface StcPoint {
  time: number;
  value: number;
}

export interface StcResult {
  tcLen: number;
  fastMa: number;
  slowMa: number;
  data: StcPoint[];
}

// SMC (Smart Money Concepts)
export interface SmcEvent {
  time: number;
  eventType: string; // "bos_bull" | "bos_bear" | "choch_bull" | "choch_bear"
  price: number;
  swingTime: number;
  swingPrice: number;
}

export interface SmcResult {
  data: SmcEvent[];
}

// Auto Fibonacci
export interface AutoFibLevel {
  ratio: number;
  price: number;
}

export interface AutoFibResult {
  highTime: number;
  highPrice: number;
  lowTime: number;
  lowPrice: number;
  isUptrend: boolean;
  levels: AutoFibLevel[];
}

export interface AnalysisResponse {
  candles: Candle[];
  bollingerBands: BollingerBandsPoint[];
  rsi: RsiPoint[];
  signals: SignalPoint[];
  sma: MovingAverageResult[];
  ema: MovingAverageResult[];
  hma: MovingAverageResult[];
  macd: MacdResult | null;
  stochastic: StochasticResult | null;
  obv: ObvResult | null;
  vwap: VwapResult | null;
  atr: AtrResult | null;
  ichimoku: IchimokuResult | null;
  supertrend: SupertrendResult | null;
  parabolicSar: ParabolicSarResult | null;
  donchian: DonchianResult | null;
  keltner: KeltnerResult | null;
  mfi: MfiResult | null;
  cmf: CmfResult | null;
  choppiness: ChoppinessResult | null;
  williamsR: WillrResult | null;
  adx: AdxResult | null;
  cvd: CvdResult | null;
  stc: StcResult | null;
  smc: SmcResult | null;
  anchoredVwap: VwapResult | null;
  autoFib: AutoFibResult | null;
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

export interface DonchianParams {
  period: number;
}

export interface KeltnerParams {
  emaPeriod: number;
  atrPeriod: number;
  atrMultiplier: number;
}

export interface MfiParams {
  period: number;
}

export interface CmfParams {
  period: number;
}

export interface ChoppinessParams {
  period: number;
}

export interface WillrParams {
  period: number;
}

export interface AdxParams {
  period: number;
}

export interface StcParams {
  tcLen: number;
  fastMa: number;
  slowMa: number;
}

export interface SmcParams {
  swingLength: number;
}

export interface AnchoredVwapParams {
  anchorTime: number;
}

export interface AutoFibParams {
  lookback: number;
  swingLength: number;
}

export interface SignalStrategyParams {
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
  hmaPeriods?: number[];
  macd: MacdParams | null;
  stochastic: StochasticParams | null;
  showObv: boolean;
  showCvd?: boolean;
  donchian?: DonchianParams | null;
  keltner?: KeltnerParams | null;
  mfi?: MfiParams | null;
  cmf?: CmfParams | null;
  choppiness?: ChoppinessParams | null;
  williamsR?: WillrParams | null;
  adx?: AdxParams | null;
  stc?: StcParams | null;
  smc?: SmcParams | null;
  anchoredVwap?: AnchoredVwapParams | null;
  autoFib?: AutoFibParams | null;
  signalStrategies: SignalStrategyParams;
}

// --- Strategy types ---

export interface MultiSymbolCandlesParams {
  symbols: string[];
  interval: string;
  limit: number;
}

export interface MultiSymbolCandlesResponse {
  data: Record<string, Candle[]>;
  errors: Record<string, string>;
}

export interface PremarketSnapshotParams {
  symbols: string[];
}

export interface PremarketSnapshot {
  symbol: string;
  preMarketPrice: number | null;
  preMarketChange: number | null;
  preMarketVolume: number | null;
  regularMarketPrice: number | null;
  regularMarketVolume: number | null;
}

// --- Watchlist types ---

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
