pub mod bollinger;
pub mod ema;
pub mod macd;
pub mod obv;
pub mod rsi;
pub mod signal;
pub mod sma;
pub mod stochastic;

use crate::models::{AnalysisParams, AnalysisResponse, Candle};

pub fn analyze(candles: &[Candle], params: &AnalysisParams) -> AnalysisResponse {
    let bb = bollinger::calculate(candles, params.bb_period, params.bb_multiplier);
    let rsi_data = rsi::calculate(candles, params.rsi_period);

    // BB+RSI signals with optional quant filters (regime/momentum/volatility)
    let mut signals = signal::detect_bb_rsi(&bb, &rsi_data, candles);
    signals = signal::apply_bb_rsi_quant_filter(signals, candles, &params.signal_filter);

    // SMA — only for requested periods
    let sma_results: Vec<_> = params
        .sma_periods
        .iter()
        .map(|&p| sma::calculate(candles, p))
        .collect();

    // EMA — only for requested periods
    let ema_results: Vec<_> = params
        .ema_periods
        .iter()
        .map(|&p| ema::calculate(candles, p))
        .collect();

    // MACD
    let macd_result = params.macd.as_ref().map(|mp| {
        let result = macd::calculate(candles, mp.fast_period, mp.slow_period, mp.signal_period);
        signals.extend(signal::detect_macd(&result, candles));
        result
    });

    // Stochastic
    let stoch_result = params.stochastic.as_ref().map(|sp| {
        let result = stochastic::calculate(candles, sp.k_period, sp.d_period, sp.smooth);
        signals.extend(signal::detect_stochastic(&result, candles));
        result
    });

    // OBV
    let obv_result = if params.show_obv {
        Some(obv::calculate(candles))
    } else {
        None
    };

    // Sort all signals by time
    signals.sort_by_key(|s| s.time);

    AnalysisResponse {
        candles: candles.to_vec(),
        bollinger_bands: bb,
        rsi: rsi_data,
        signals,
        sma: sma_results,
        ema: ema_results,
        macd: macd_result,
        stochastic: stoch_result,
        obv: obv_result,
        symbol: params.symbol.clone(),
        interval: params.interval.clone(),
    }
}
