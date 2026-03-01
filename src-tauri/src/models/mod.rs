mod candle;
mod fundamental;
mod indicator;
mod params;
mod signal;
mod strategy;
mod watchlist;

pub use candle::Candle;
pub use fundamental::{FundamentalsParams, FundamentalsResponse};
pub use indicator::{
    AdxPoint, AdxResult, AtrPoint, AtrResult, AutoFibLevel, AutoFibResult, BollingerBandsPoint,
    ChoppinessPoint, ChoppinessResult, CmfPoint, CmfResult, CvdPoint, CvdResult, DonchianPoint,
    DonchianResult, IchimokuPoint, IchimokuResult, KeltnerPoint, KeltnerResult, MaPoint, MacdPoint,
    MacdResult, MfiPoint, MfiResult, MovingAverageResult, ObvPoint, ObvResult, ParabolicSarPoint,
    ParabolicSarResult, RsiPoint, SmcEvent, SmcResult, StcPoint, StcResult, StochasticPoint,
    StochasticResult, SupertrendPoint, SupertrendResult, VwapPoint, VwapResult, WillrPoint,
    WillrResult,
};
pub use params::{AnalysisParams, MarketType};
pub use signal::{SignalPoint, SignalType};
pub use strategy::{
    MultiSymbolCandlesParams, MultiSymbolCandlesResponse, PremarketSnapshot,
    PremarketSnapshotParams,
};
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
    pub donchian: Option<DonchianResult>,
    pub keltner: Option<KeltnerResult>,
    pub hma: Vec<MovingAverageResult>,
    pub mfi: Option<MfiResult>,
    pub cmf: Option<CmfResult>,
    pub choppiness: Option<ChoppinessResult>,
    pub williams_r: Option<WillrResult>,
    pub adx: Option<AdxResult>,
    pub cvd: Option<CvdResult>,
    pub stc: Option<StcResult>,
    pub smc: Option<SmcResult>,
    pub anchored_vwap: Option<VwapResult>,
    pub auto_fib: Option<AutoFibResult>,
    pub symbol: String,
    pub interval: String,
}
