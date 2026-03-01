pub mod atr;
pub mod bollinger;
pub mod choppiness;
pub mod cmf;
pub mod donchian;
pub mod ema;
pub mod helpers;
pub mod hma;
pub mod ichimoku;
pub mod keltner;
pub mod macd;
pub mod mfi;
pub mod obv;
pub mod parabolic_sar;
pub mod rsi;
pub mod signal;
pub mod sma;
pub mod stochastic;
pub mod supertrend;
pub mod vwap;
pub mod williams_r;
pub mod adx;
pub mod cvd;
pub mod stc;
pub mod wma;

use crate::models::{AnalysisParams, AnalysisResponse, Candle};

pub fn analyze(candles: &[Candle], params: &AnalysisParams) -> AnalysisResponse {
    let bb = bollinger::calculate(candles, params.bb_period, params.bb_multiplier);
    let rsi_data = rsi::calculate(candles, params.rsi_period);
    let vwap_result = Some(vwap::calculate(candles));
    let atr_result = Some(atr::calculate(candles, 14));
    let ichimoku_result = Some(ichimoku::calculate(candles, 9, 26, 52, 26));
    let supertrend_result = Some(supertrend::calculate(candles, 10, 3.0));
    let parabolic_sar_result = Some(parabolic_sar::calculate(candles, 0.02, 0.2));

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

    // HMA — only for requested periods
    let hma_results: Vec<_> = params
        .hma_periods
        .iter()
        .map(|&p| hma::calculate(candles, p))
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

    // Donchian Channels
    let donchian_result = params
        .donchian
        .as_ref()
        .map(|dp| donchian::calculate(candles, dp.period));

    // Keltner Channels
    let keltner_result = params
        .keltner
        .as_ref()
        .map(|kp| keltner::calculate(candles, kp.ema_period, kp.atr_period, kp.atr_multiplier));

    // MFI
    let mfi_result = params
        .mfi
        .as_ref()
        .map(|mp| mfi::calculate(candles, mp.period));

    // CMF
    let cmf_result = params
        .cmf
        .as_ref()
        .map(|cp| cmf::calculate(candles, cp.period));

    // Choppiness Index
    let choppiness_result = params
        .choppiness
        .as_ref()
        .map(|cp| choppiness::calculate(candles, cp.period));

    // Williams %R
    let willr_result = params
        .williams_r
        .as_ref()
        .map(|wp| williams_r::calculate(candles, wp.period));

    // ADX
    let adx_result = params
        .adx
        .as_ref()
        .map(|ap| adx::calculate(candles, ap.period));

    // CVD
    let cvd_result = if params.show_cvd {
        Some(cvd::calculate(candles))
    } else {
        None
    };

    // STC
    let stc_result = params
        .stc
        .as_ref()
        .map(|sp| stc::calculate(candles, sp.tc_len, sp.fast_ma, sp.slow_ma));

    // Sort all signals by time
    signals.sort_by_key(|s| s.time);

    AnalysisResponse {
        candles: candles.to_vec(),
        bollinger_bands: bb,
        rsi: rsi_data,
        signals,
        sma: sma_results,
        ema: ema_results,
        hma: hma_results,
        macd: macd_result,
        stochastic: stoch_result,
        obv: obv_result,
        vwap: vwap_result,
        atr: atr_result,
        ichimoku: ichimoku_result,
        supertrend: supertrend_result,
        parabolic_sar: parabolic_sar_result,
        donchian: donchian_result,
        keltner: keltner_result,
        mfi: mfi_result,
        cmf: cmf_result,
        choppiness: choppiness_result,
        williams_r: willr_result,
        adx: adx_result,
        cvd: cvd_result,
        stc: stc_result,
        symbol: params.symbol.clone(),
        interval: params.interval.clone(),
    }
}
