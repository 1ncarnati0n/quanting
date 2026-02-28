mod candle;
mod indicator;
mod params;
mod signal;
mod watchlist;

pub use candle::Candle;
pub use indicator::{
    AtrPoint, AtrResult, BollingerBandsPoint, IchimokuPoint, IchimokuResult, MaPoint, MacdPoint,
    MacdResult, MovingAverageResult, ObvPoint, ObvResult, ParabolicSarPoint, ParabolicSarResult,
    RsiPoint, StochasticPoint, StochasticResult, SupertrendPoint, SupertrendResult, VwapPoint,
    VwapResult,
};
pub use params::{AnalysisParams, MarketType, SignalFilterParams};
pub use signal::{SignalPoint, SignalType};
pub use watchlist::{WatchlistSnapshot, WatchlistSnapshotParams};

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisResponse {
    pub candles: Vec<Candle>,
    pub bollinger_bands: Vec<BollingerBandsPoint>,
    pub rsi: Vec<RsiPoint>,
    pub signals: Vec<SignalPoint>,
    pub sma: Vec<MovingAverageResult>,
    pub ema: Vec<MovingAverageResult>,
    pub macd: Option<MacdResult>,
    pub stochastic: Option<StochasticResult>,
    pub obv: Option<ObvResult>,
    pub vwap: Option<VwapResult>,
    pub atr: Option<AtrResult>,
    pub ichimoku: Option<IchimokuResult>,
    pub supertrend: Option<SupertrendResult>,
    pub parabolic_sar: Option<ParabolicSarResult>,
    pub symbol: String,
    pub interval: String,
}
