pub mod bollinger;
pub mod rsi;
pub mod signal;

use crate::models::{AnalysisParams, AnalysisResponse, Candle};

pub fn analyze(candles: &[Candle], params: &AnalysisParams) -> AnalysisResponse {
    let bb = bollinger::calculate(candles, params.bb_period, params.bb_multiplier);
    let rsi_data = rsi::calculate(candles, params.rsi_period);
    let signals = signal::detect(&bb, &rsi_data, candles);

    AnalysisResponse {
        candles: candles.to_vec(),
        bollinger_bands: bb,
        rsi: rsi_data,
        signals,
        symbol: params.symbol.clone(),
        interval: params.interval.clone(),
    }
}
