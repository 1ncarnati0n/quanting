mod candle;
mod indicator;
mod params;
mod signal;

pub use candle::Candle;
pub use indicator::{BollingerBandsPoint, RsiPoint};
pub use params::{AnalysisParams, MarketType};
pub use signal::{SignalPoint, SignalType};

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisResponse {
    pub candles: Vec<Candle>,
    pub bollinger_bands: Vec<BollingerBandsPoint>,
    pub rsi: Vec<RsiPoint>,
    pub signals: Vec<SignalPoint>,
    pub symbol: String,
    pub interval: String,
}
