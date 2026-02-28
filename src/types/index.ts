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

export type SignalType = "strongBuy" | "weakBuy" | "strongSell" | "weakSell";

export interface SignalPoint {
  time: number;
  signalType: SignalType;
  price: number;
  rsi: number;
}

export interface AnalysisResponse {
  candles: Candle[];
  bollingerBands: BollingerBandsPoint[];
  rsi: RsiPoint[];
  signals: SignalPoint[];
  symbol: string;
  interval: string;
}

export type MarketType = "crypto" | "usStock" | "krStock";

export interface AnalysisParams {
  symbol: string;
  interval: string;
  bbPeriod: number;
  bbMultiplier: number;
  rsiPeriod: number;
  market: MarketType;
}
