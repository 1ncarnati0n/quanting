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
pub mod smc;
pub mod anchored_vwap;
pub mod auto_fib;
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

    // SMC (Smart Money Concepts)
    let smc_result = params
        .smc
        .as_ref()
        .map(|sp| smc::calculate(candles, sp.swing_length));

    // Anchored VWAP
    let anchored_vwap_result = params
        .anchored_vwap
        .as_ref()
        .map(|ap| anchored_vwap::calculate(candles, ap.anchor_time));

    // Auto Fibonacci
    let auto_fib_result = params
        .auto_fib
        .as_ref()
        .map(|fp| auto_fib::calculate(candles, fp.lookback, fp.swing_length));

    // ─── Quant Signal Strategies ───

    let ss = &params.signal_strategies;

    // Compute fallback indicators only when needed by strategies but not already computed
    let adx_fallback;
    let cmf_fallback;
    let obv_fallback;
    let kelt_fallback;

    // 1. Supertrend + ADX
    if ss.supertrend_adx {
        let st = supertrend_result.as_ref().unwrap();
        let adx_ref = match adx_result.as_ref() {
            Some(r) => r,
            None => {
                adx_fallback = adx::calculate(candles, 14);
                &adx_fallback
            }
        };
        signals.extend(signal::detect_supertrend_adx(st, adx_ref, candles));
    }

    // 2. EMA Crossover (needs dedicated fast/slow EMA)
    if ss.ema_crossover {
        let ema_fast = ema::calculate(candles, ss.ema_fast_period);
        let ema_slow = ema::calculate(candles, ss.ema_slow_period);
        signals.extend(signal::detect_ema_crossover(&ema_fast, &ema_slow, candles));
    }

    // 3. Stochastic + RSI combined
    if ss.stoch_rsi_combined {
        if let Some(ref stoch) = stoch_result {
            signals.extend(signal::detect_stoch_rsi_combined(stoch, &rsi_data, candles));
        }
    }

    // 4. CMF + OBV
    if ss.cmf_obv {
        let cmf_ref = match cmf_result.as_ref() {
            Some(r) => r,
            None => {
                cmf_fallback = cmf::calculate(candles, 20);
                &cmf_fallback
            }
        };
        let obv_ref = match obv_result.as_ref() {
            Some(r) => r,
            None => {
                obv_fallback = obv::calculate(candles);
                &obv_fallback
            }
        };
        signals.extend(signal::detect_cmf_obv(cmf_ref, obv_ref, candles));
    }

    // 5. TTM Squeeze (needs BB, Keltner, MACD)
    if ss.ttm_squeeze {
        if let Some(ref macd_r) = macd_result {
            let kelt_ref = match keltner_result.as_ref() {
                Some(r) => r,
                None => {
                    kelt_fallback = keltner::calculate(candles, 20, 10, 2.0);
                    &kelt_fallback
                }
            };
            signals.extend(signal::detect_ttm_squeeze(&bb, kelt_ref, macd_r, candles));
        }
    }

    // 6. VWAP Breakout
    if ss.vwap_breakout {
        if let Some(ref vwap_r) = vwap_result {
            signals.extend(signal::detect_vwap_breakout(vwap_r, candles));
        }
    }

    // 7. Parabolic SAR reversal
    if ss.parabolic_sar {
        if let Some(ref sar) = parabolic_sar_result {
            signals.extend(signal::detect_parabolic_sar_reversal(sar, candles));
        }
    }

    // 8. MACD Histogram reversal
    if ss.macd_hist_reversal {
        if let Some(ref macd_r) = macd_result {
            signals.extend(signal::detect_macd_hist_reversal(macd_r, candles));
        }
    }

    // 9. IBS Mean Reversion
    if ss.ibs_mean_reversion {
        signals.extend(signal::detect_ibs_mean_reversion(&rsi_data, candles));
    }

    // 10. RSI Divergence
    if ss.rsi_divergence {
        signals.extend(signal::detect_rsi_divergence(
            &rsi_data,
            candles,
            ss.divergence_swing_length,
        ));
    }

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
        smc: smc_result,
        anchored_vwap: anchored_vwap_result,
        auto_fib: auto_fib_result,
        symbol: params.symbol.clone(),
        interval: params.interval.clone(),
    }
}
