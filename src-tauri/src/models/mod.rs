mod candle;
mod indicator;
mod params;
mod signal;

pub use candle::Candle;
pub use indicator::{
    BollingerBandsPoint, MaPoint, MacdPoint, MacdResult, MovingAverageResult, ObvPoint, ObvResult,
    RsiPoint, StochasticPoint, StochasticResult,
};
pub use params::{AnalysisParams, MarketType, SignalFilterParams};
pub use signal::{SignalPoint, SignalType};

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
    pub symbol: String,
    pub interval: String,
}
