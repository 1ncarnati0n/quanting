use std::collections::HashMap;

use crate::models::{
    AdxResult, BollingerBandsPoint, Candle, CmfResult, KeltnerResult, MacdResult,
    MovingAverageResult, ObvResult, ParabolicSarResult, RsiPoint, SignalFilterParams, SignalPoint,
    SignalType, StochasticResult, SupertrendResult, VwapResult,
};

/// Detect BB+RSI signals (existing logic).
pub fn detect_bb_rsi(
    bb: &[BollingerBandsPoint],
    rsi: &[RsiPoint],
    candles: &[Candle],
) -> Vec<SignalPoint> {
    let bb_map: HashMap<i64, &BollingerBandsPoint> = bb.iter().map(|b| (b.time, b)).collect();
    let rsi_map: HashMap<i64, &RsiPoint> = rsi.iter().map(|r| (r.time, r)).collect();

    let mut signals = Vec::new();

    for candle in candles {
        let bb_point = match bb_map.get(&candle.time) {
            Some(b) => b,
            None => continue,
        };
        let rsi_point = match rsi_map.get(&candle.time) {
            Some(r) => r,
            None => continue,
        };

        let close = candle.close;
        let rsi_val = rsi_point.value;

        if close <= bb_point.lower {
            if rsi_val < 30.0 {
                signals.push(SignalPoint {
                    time: candle.time,
                    signal_type: SignalType::StrongBuy,
                    price: close,
                    rsi: rsi_val,
                    source: "bb_rsi".to_string(),
                });
            } else if rsi_val < 50.0 {
                signals.push(SignalPoint {
                    time: candle.time,
                    signal_type: SignalType::WeakBuy,
                    price: close,
                    rsi: rsi_val,
                    source: "bb_rsi".to_string(),
                });
            }
        }

        if close >= bb_point.upper {
            if rsi_val > 70.0 {
                signals.push(SignalPoint {
                    time: candle.time,
                    signal_type: SignalType::StrongSell,
                    price: close,
                    rsi: rsi_val,
                    source: "bb_rsi".to_string(),
                });
            } else if rsi_val > 50.0 {
                signals.push(SignalPoint {
                    time: candle.time,
                    signal_type: SignalType::WeakSell,
                    price: close,
                    rsi: rsi_val,
                    source: "bb_rsi".to_string(),
                });
            }
        }
    }

    signals
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Regime {
    Bullish,
    Bearish,
    Neutral,
    Unknown,
}

/// Apply regime + momentum + volatility filters to BB+RSI signals.
pub fn apply_bb_rsi_quant_filter(
    signals: Vec<SignalPoint>,
    candles: &[Candle],
    filter: &SignalFilterParams,
) -> Vec<SignalPoint> {
    if !filter.enabled || signals.is_empty() || candles.is_empty() {
        return signals;
    }

    let closes: Vec<f64> = candles.iter().map(|c| c.close).collect();
    let close_prefix = build_prefix_sum(&closes);
    let rolling_vol = build_rolling_volatility(&closes, filter.volatility_period);
    let time_to_index: HashMap<i64, usize> = candles
        .iter()
        .enumerate()
        .map(|(idx, c)| (c.time, idx))
        .collect();

    let vol_cutoff = filter.high_vol_percentile.clamp(0.0, 1.0);

    signals
        .into_iter()
        .filter_map(|mut signal| {
            let idx = *time_to_index.get(&signal.time)?;
            let regime = compute_regime(
                idx,
                &closes,
                &close_prefix,
                filter.regime_period,
                filter.regime_buffer,
            );
            let momentum = compute_momentum(idx, &closes, filter.momentum_period);
            let vol_percentile =
                compute_volatility_percentile(&rolling_vol, idx, filter.volatility_rank_period);

            if !passes_quant_filter(
                &signal.signal_type,
                regime,
                momentum,
                vol_percentile,
                vol_cutoff,
                filter,
            ) {
                return None;
            }

            signal.source = "bb_rsi_qf".to_string();
            Some(signal)
        })
        .collect()
}

fn passes_quant_filter(
    signal_type: &SignalType,
    regime: Regime,
    momentum: Option<f64>,
    vol_percentile: Option<f64>,
    vol_cutoff: f64,
    filter: &SignalFilterParams,
) -> bool {
    let is_buy = is_buy_signal(signal_type);
    let is_sell = is_sell_signal(signal_type);
    let is_strong = is_strong_signal(signal_type);

    if filter.apply_regime_filter {
        let counter_trend =
            (is_buy && regime == Regime::Bearish) || (is_sell && regime == Regime::Bullish);
        if counter_trend && !(is_strong && filter.keep_strong_counter_trend) {
            return false;
        }
    }

    if filter.apply_momentum_filter {
        if let Some(mom) = momentum {
            if is_buy
                && mom < filter.min_momentum_for_buy
                && !(is_strong && filter.keep_strong_counter_trend)
            {
                return false;
            }
            if is_sell
                && mom > filter.max_momentum_for_sell
                && !(is_strong && filter.keep_strong_counter_trend)
            {
                return false;
            }
        }
    }

    if filter.apply_volatility_filter {
        if let Some(pct) = vol_percentile {
            if pct >= vol_cutoff && !(is_strong && filter.keep_strong_in_high_vol) {
                return false;
            }
        }
    }

    true
}

fn is_buy_signal(signal_type: &SignalType) -> bool {
    matches!(signal_type, SignalType::StrongBuy | SignalType::WeakBuy)
}

fn is_sell_signal(signal_type: &SignalType) -> bool {
    matches!(signal_type, SignalType::StrongSell | SignalType::WeakSell)
}

fn is_strong_signal(signal_type: &SignalType) -> bool {
    matches!(signal_type, SignalType::StrongBuy | SignalType::StrongSell)
}

fn build_prefix_sum(values: &[f64]) -> Vec<f64> {
    let mut prefix = Vec::with_capacity(values.len() + 1);
    prefix.push(0.0);
    for value in values {
        let next = prefix.last().copied().unwrap_or(0.0) + value;
        prefix.push(next);
    }
    prefix
}

fn compute_regime(
    idx: usize,
    closes: &[f64],
    close_prefix: &[f64],
    period: usize,
    buffer: f64,
) -> Regime {
    if period == 0 || idx + 1 < period {
        return Regime::Unknown;
    }

    let start = idx + 1 - period;
    let sum = close_prefix[idx + 1] - close_prefix[start];
    let sma = sum / period as f64;
    if sma <= f64::EPSILON {
        return Regime::Unknown;
    }

    let distance = closes[idx] / sma - 1.0;
    if distance > buffer {
        Regime::Bullish
    } else if distance < -buffer {
        Regime::Bearish
    } else {
        Regime::Neutral
    }
}

fn compute_momentum(idx: usize, closes: &[f64], period: usize) -> Option<f64> {
    if period == 0 || idx < period {
        return None;
    }
    let past_price = closes[idx - period];
    if past_price <= f64::EPSILON {
        return None;
    }
    Some(closes[idx] / past_price - 1.0)
}

fn build_rolling_volatility(closes: &[f64], period: usize) -> Vec<Option<f64>> {
    let n = closes.len();
    let mut result = vec![None; n];
    if n == 0 || period == 0 || n <= period {
        return result;
    }

    let mut returns = vec![0.0; n];
    for i in 1..n {
        let prev = closes[i - 1];
        let curr = closes[i];
        if prev > f64::EPSILON && curr > f64::EPSILON {
            returns[i] = (curr / prev).ln();
        }
    }

    let sum_prefix = build_prefix_sum(&returns);
    let sq_returns: Vec<f64> = returns.iter().map(|r| r * r).collect();
    let sq_prefix = build_prefix_sum(&sq_returns);

    for idx in period..n {
        let start = (idx + 1).saturating_sub(period).max(1);
        let len = idx + 1 - start;
        if len == 0 {
            continue;
        }
        let len_f = len as f64;
        let sum = sum_prefix[idx + 1] - sum_prefix[start];
        let sum_sq = sq_prefix[idx + 1] - sq_prefix[start];
        let mean = sum / len_f;
        let variance = (sum_sq / len_f - mean * mean).max(0.0);
        result[idx] = Some(variance.sqrt());
    }

    result
}

fn compute_volatility_percentile(
    rolling_vol: &[Option<f64>],
    idx: usize,
    rank_period: usize,
) -> Option<f64> {
    if rank_period == 0 {
        return None;
    }

    let current = rolling_vol.get(idx).copied().flatten()?;
    let start = idx.saturating_sub(rank_period.saturating_sub(1));
    let mut total = 0usize;
    let mut less_or_equal = 0usize;

    for v in rolling_vol[start..=idx].iter().flatten() {
        total += 1;
        if *v <= current {
            less_or_equal += 1;
        }
    }

    if total < 10 {
        return None;
    }

    Some(less_or_equal as f64 / total as f64)
}

/// Detect MACD crossover signals.
pub fn detect_macd(macd: &MacdResult, candles: &[Candle]) -> Vec<SignalPoint> {
    let mut signals = Vec::new();
    let candle_map: HashMap<i64, &Candle> = candles.iter().map(|c| (c.time, c)).collect();

    for i in 1..macd.data.len() {
        let prev = &macd.data[i - 1];
        let curr = &macd.data[i];
        let price = candle_map.get(&curr.time).map(|c| c.close).unwrap_or(0.0);

        // Bullish: MACD crosses above Signal
        if prev.macd <= prev.signal && curr.macd > curr.signal {
            signals.push(SignalPoint {
                time: curr.time,
                signal_type: SignalType::MacdBullish,
                price,
                rsi: 0.0,
                source: "macd".to_string(),
            });
        }

        // Bearish: MACD crosses below Signal
        if prev.macd >= prev.signal && curr.macd < curr.signal {
            signals.push(SignalPoint {
                time: curr.time,
                signal_type: SignalType::MacdBearish,
                price,
                rsi: 0.0,
                source: "macd".to_string(),
            });
        }
    }

    signals
}

/// Detect Stochastic oversold/overbought signals.
pub fn detect_stochastic(stoch: &StochasticResult, candles: &[Candle]) -> Vec<SignalPoint> {
    let mut signals = Vec::new();
    let candle_map: HashMap<i64, &Candle> = candles.iter().map(|c| (c.time, c)).collect();

    for i in 1..stoch.data.len() {
        let prev = &stoch.data[i - 1];
        let curr = &stoch.data[i];
        let price = candle_map.get(&curr.time).map(|c| c.close).unwrap_or(0.0);

        // Oversold: %K < 20 AND %K crosses above %D (buy opportunity)
        if curr.k < 20.0 && prev.k <= prev.d && curr.k > curr.d {
            signals.push(SignalPoint {
                time: curr.time,
                signal_type: SignalType::StochOversold,
                price,
                rsi: 0.0,
                source: "stochastic".to_string(),
            });
        }

        // Overbought: %K > 80 AND %K crosses below %D (sell opportunity)
        if curr.k > 80.0 && prev.k >= prev.d && curr.k < curr.d {
            signals.push(SignalPoint {
                time: curr.time,
                signal_type: SignalType::StochOverbought,
                price,
                rsi: 0.0,
                source: "stochastic".to_string(),
            });
        }
    }

    signals
}

// ─────────────────────────────────────────────────────
// Quant Signal Strategies (10)
// ─────────────────────────────────────────────────────

/// 1. Supertrend direction reversal + ADX > 25 trend confirmation.
pub fn detect_supertrend_adx(
    st: &SupertrendResult,
    adx: &AdxResult,
    candles: &[Candle],
) -> Vec<SignalPoint> {
    let mut signals = Vec::new();
    let adx_map: HashMap<i64, f64> = adx.data.iter().map(|a| (a.time, a.adx)).collect();
    let candle_map: HashMap<i64, &Candle> = candles.iter().map(|c| (c.time, c)).collect();

    for i in 1..st.data.len() {
        let prev = &st.data[i - 1];
        let curr = &st.data[i];
        if prev.direction == curr.direction {
            continue;
        }
        let adx_val = adx_map.get(&curr.time).copied().unwrap_or(0.0);
        if adx_val < 25.0 {
            continue;
        }
        let price = candle_map.get(&curr.time).map(|c| c.close).unwrap_or(0.0);
        // direction: 1 = uptrend (buy), -1 = downtrend (sell)
        let signal_type = if curr.direction == 1 {
            SignalType::SupertrendBuy
        } else {
            SignalType::SupertrendSell
        };
        signals.push(SignalPoint {
            time: curr.time,
            signal_type,
            price,
            rsi: 0.0,
            source: "supertrend_adx".to_string(),
        });
    }
    signals
}

/// 2. EMA fast/slow crossover.
pub fn detect_ema_crossover(
    fast: &MovingAverageResult,
    slow: &MovingAverageResult,
    candles: &[Candle],
) -> Vec<SignalPoint> {
    let mut signals = Vec::new();
    let slow_map: HashMap<i64, f64> = slow.data.iter().map(|p| (p.time, p.value)).collect();
    let candle_map: HashMap<i64, &Candle> = candles.iter().map(|c| (c.time, c)).collect();

    for i in 1..fast.data.len() {
        let curr_fast = fast.data[i].value;
        let prev_fast = fast.data[i - 1].value;
        let curr_slow = match slow_map.get(&fast.data[i].time) {
            Some(v) => *v,
            None => continue,
        };
        let prev_slow = match slow_map.get(&fast.data[i - 1].time) {
            Some(v) => *v,
            None => continue,
        };
        let price = candle_map
            .get(&fast.data[i].time)
            .map(|c| c.close)
            .unwrap_or(0.0);

        if prev_fast <= prev_slow && curr_fast > curr_slow {
            signals.push(SignalPoint {
                time: fast.data[i].time,
                signal_type: SignalType::EmaCrossoverBuy,
                price,
                rsi: 0.0,
                source: "ema_crossover".to_string(),
            });
        }
        if prev_fast >= prev_slow && curr_fast < curr_slow {
            signals.push(SignalPoint {
                time: fast.data[i].time,
                signal_type: SignalType::EmaCrossoverSell,
                price,
                rsi: 0.0,
                source: "ema_crossover".to_string(),
            });
        }
    }
    signals
}

/// 3. Stochastic + RSI combined: oversold/overbought double confirmation.
pub fn detect_stoch_rsi_combined(
    stoch: &StochasticResult,
    rsi: &[RsiPoint],
    candles: &[Candle],
) -> Vec<SignalPoint> {
    let mut signals = Vec::new();
    let rsi_map: HashMap<i64, f64> = rsi.iter().map(|r| (r.time, r.value)).collect();
    let candle_map: HashMap<i64, &Candle> = candles.iter().map(|c| (c.time, c)).collect();

    for pt in &stoch.data {
        let rsi_val = match rsi_map.get(&pt.time) {
            Some(v) => *v,
            None => continue,
        };
        let price = candle_map.get(&pt.time).map(|c| c.close).unwrap_or(0.0);

        if pt.k < 20.0 && rsi_val < 30.0 {
            signals.push(SignalPoint {
                time: pt.time,
                signal_type: SignalType::StochRsiBuy,
                price,
                rsi: rsi_val,
                source: "stoch_rsi".to_string(),
            });
        }
        if pt.k > 80.0 && rsi_val > 70.0 {
            signals.push(SignalPoint {
                time: pt.time,
                signal_type: SignalType::StochRsiSell,
                price,
                rsi: rsi_val,
                source: "stoch_rsi".to_string(),
            });
        }
    }
    signals
}

/// 4. CMF sign reversal + OBV trend confirmation.
pub fn detect_cmf_obv(
    cmf: &CmfResult,
    obv: &ObvResult,
    candles: &[Candle],
) -> Vec<SignalPoint> {
    let mut signals = Vec::new();
    let obv_map: HashMap<i64, f64> = obv.data.iter().map(|o| (o.time, o.value)).collect();
    let candle_map: HashMap<i64, &Candle> = candles.iter().map(|c| (c.time, c)).collect();
    let obv_vec: Vec<(i64, f64)> = obv.data.iter().map(|o| (o.time, o.value)).collect();
    let obv_idx_map: HashMap<i64, usize> = obv_vec
        .iter()
        .enumerate()
        .map(|(i, (t, _))| (*t, i))
        .collect();

    let lookback = 10usize;

    for i in 1..cmf.data.len() {
        let prev_cmf = cmf.data[i - 1].value;
        let curr_cmf = cmf.data[i].value;
        let time = cmf.data[i].time;
        let price = candle_map.get(&time).map(|c| c.close).unwrap_or(0.0);

        // CMF sign reversal check
        let cmf_turned_positive = prev_cmf <= 0.0 && curr_cmf > 0.0;
        let cmf_turned_negative = prev_cmf >= 0.0 && curr_cmf < 0.0;

        if !cmf_turned_positive && !cmf_turned_negative {
            continue;
        }

        // OBV trend: compare current OBV vs N periods ago
        if let Some(&curr_obv) = obv_map.get(&time) {
            if let Some(&idx) = obv_idx_map.get(&time) {
                if idx >= lookback {
                    let past_obv = obv_vec[idx - lookback].1;
                    if cmf_turned_positive && curr_obv > past_obv {
                        signals.push(SignalPoint {
                            time,
                            signal_type: SignalType::CmfObvBuy,
                            price,
                            rsi: 0.0,
                            source: "cmf_obv".to_string(),
                        });
                    }
                    if cmf_turned_negative && curr_obv < past_obv {
                        signals.push(SignalPoint {
                            time,
                            signal_type: SignalType::CmfObvSell,
                            price,
                            rsi: 0.0,
                            source: "cmf_obv".to_string(),
                        });
                    }
                }
            }
        }
    }
    signals
}

/// 5. TTM Squeeze: BB enters/exits Keltner channel + MACD histogram direction.
pub fn detect_ttm_squeeze(
    bb: &[BollingerBandsPoint],
    keltner: &KeltnerResult,
    macd: &MacdResult,
    candles: &[Candle],
) -> Vec<SignalPoint> {
    let mut signals = Vec::new();
    let kelt_map: HashMap<i64, (f64, f64)> = keltner
        .data
        .iter()
        .map(|k| (k.time, (k.upper, k.lower)))
        .collect();
    let macd_map: HashMap<i64, f64> = macd
        .data
        .iter()
        .map(|m| (m.time, m.histogram))
        .collect();
    let candle_map: HashMap<i64, &Candle> = candles.iter().map(|c| (c.time, c)).collect();

    // Build squeeze state per BB point
    let mut prev_squeeze = false;
    for (i, bb_pt) in bb.iter().enumerate() {
        let (kelt_upper, kelt_lower) = match kelt_map.get(&bb_pt.time) {
            Some(v) => *v,
            None => continue,
        };
        // Squeeze: BB inside Keltner
        let in_squeeze = bb_pt.upper < kelt_upper && bb_pt.lower > kelt_lower;

        // Detect squeeze release (was in squeeze, now out)
        if i > 0 && prev_squeeze && !in_squeeze {
            let hist = macd_map.get(&bb_pt.time).copied().unwrap_or(0.0);
            let price = candle_map.get(&bb_pt.time).map(|c| c.close).unwrap_or(0.0);
            if hist > 0.0 {
                signals.push(SignalPoint {
                    time: bb_pt.time,
                    signal_type: SignalType::TtmSqueezeBuy,
                    price,
                    rsi: 0.0,
                    source: "ttm_squeeze".to_string(),
                });
            } else if hist < 0.0 {
                signals.push(SignalPoint {
                    time: bb_pt.time,
                    signal_type: SignalType::TtmSqueezeSell,
                    price,
                    rsi: 0.0,
                    source: "ttm_squeeze".to_string(),
                });
            }
        }
        prev_squeeze = in_squeeze;
    }
    signals
}

/// 6. VWAP breakout with volume surge confirmation.
pub fn detect_vwap_breakout(vwap: &VwapResult, candles: &[Candle]) -> Vec<SignalPoint> {
    let mut signals = Vec::new();
    if candles.len() < 21 {
        return signals;
    }
    let vwap_map: HashMap<i64, f64> = vwap.data.iter().map(|v| (v.time, v.value)).collect();

    // Calculate 20-period rolling average volume
    for i in 20..candles.len() {
        let avg_vol: f64 = candles[i - 20..i].iter().map(|c| c.volume).sum::<f64>() / 20.0;
        let candle = &candles[i];
        let vwap_val = match vwap_map.get(&candle.time) {
            Some(v) => *v,
            None => continue,
        };
        let vol_surge = candle.volume > avg_vol * 1.5;
        if !vol_surge {
            continue;
        }
        // Check previous candle was on the other side
        if i > 0 {
            let prev = &candles[i - 1];
            let prev_vwap = vwap_map.get(&prev.time).copied().unwrap_or(vwap_val);
            if prev.close <= prev_vwap && candle.close > vwap_val {
                signals.push(SignalPoint {
                    time: candle.time,
                    signal_type: SignalType::VwapBreakoutBuy,
                    price: candle.close,
                    rsi: 0.0,
                    source: "vwap_breakout".to_string(),
                });
            }
            if prev.close >= prev_vwap && candle.close < vwap_val {
                signals.push(SignalPoint {
                    time: candle.time,
                    signal_type: SignalType::VwapBreakoutSell,
                    price: candle.close,
                    rsi: 0.0,
                    source: "vwap_breakout".to_string(),
                });
            }
        }
    }
    signals
}

/// 7. Parabolic SAR reversal: SAR crosses above/below price.
pub fn detect_parabolic_sar_reversal(
    sar: &ParabolicSarResult,
    candles: &[Candle],
) -> Vec<SignalPoint> {
    let mut signals = Vec::new();
    let candle_map: HashMap<i64, &Candle> = candles.iter().map(|c| (c.time, c)).collect();

    for i in 1..sar.data.len() {
        let prev = &sar.data[i - 1];
        let curr = &sar.data[i];
        let prev_candle = match candle_map.get(&prev.time) {
            Some(c) => c,
            None => continue,
        };
        let curr_candle = match candle_map.get(&curr.time) {
            Some(c) => c,
            None => continue,
        };
        let prev_above = prev.value > prev_candle.close;
        let curr_above = curr.value > curr_candle.close;

        // SAR was above price (bearish), now below (bullish) → Buy
        if prev_above && !curr_above {
            signals.push(SignalPoint {
                time: curr.time,
                signal_type: SignalType::ParabolicSarBuy,
                price: curr_candle.close,
                rsi: 0.0,
                source: "parabolic_sar".to_string(),
            });
        }
        // SAR was below price (bullish), now above (bearish) → Sell
        if !prev_above && curr_above {
            signals.push(SignalPoint {
                time: curr.time,
                signal_type: SignalType::ParabolicSarSell,
                price: curr_candle.close,
                rsi: 0.0,
                source: "parabolic_sar".to_string(),
            });
        }
    }
    signals
}

/// 8. MACD histogram sign reversal with price confirmation.
pub fn detect_macd_hist_reversal(macd: &MacdResult, candles: &[Candle]) -> Vec<SignalPoint> {
    let mut signals = Vec::new();
    let candle_map: HashMap<i64, &Candle> = candles.iter().map(|c| (c.time, c)).collect();

    for i in 1..macd.data.len() {
        let prev = &macd.data[i - 1];
        let curr = &macd.data[i];
        let curr_candle = match candle_map.get(&curr.time) {
            Some(c) => c,
            None => continue,
        };
        let prev_candle = match candle_map.get(&prev.time) {
            Some(c) => c,
            None => continue,
        };

        // Histogram turns positive + price up → Buy
        if prev.histogram <= 0.0 && curr.histogram > 0.0 && curr_candle.close > prev_candle.close {
            signals.push(SignalPoint {
                time: curr.time,
                signal_type: SignalType::MacdHistReversalBuy,
                price: curr_candle.close,
                rsi: 0.0,
                source: "macd_hist".to_string(),
            });
        }
        // Histogram turns negative + price down → Sell
        if prev.histogram >= 0.0 && curr.histogram < 0.0 && curr_candle.close < prev_candle.close {
            signals.push(SignalPoint {
                time: curr.time,
                signal_type: SignalType::MacdHistReversalSell,
                price: curr_candle.close,
                rsi: 0.0,
                source: "macd_hist".to_string(),
            });
        }
    }
    signals
}

/// 9. IBS (Internal Bar Strength) mean reversion + RSI confirmation.
pub fn detect_ibs_mean_reversion(rsi: &[RsiPoint], candles: &[Candle]) -> Vec<SignalPoint> {
    let mut signals = Vec::new();
    let rsi_map: HashMap<i64, f64> = rsi.iter().map(|r| (r.time, r.value)).collect();

    for candle in candles {
        let range = candle.high - candle.low;
        if range <= f64::EPSILON {
            continue;
        }
        let ibs = (candle.close - candle.low) / range;
        let rsi_val = rsi_map.get(&candle.time).copied().unwrap_or(50.0);

        if ibs < 0.2 && rsi_val < 35.0 {
            signals.push(SignalPoint {
                time: candle.time,
                signal_type: SignalType::IbsMeanRevBuy,
                price: candle.close,
                rsi: rsi_val,
                source: "ibs_mean_rev".to_string(),
            });
        }
        if ibs > 0.8 && rsi_val > 65.0 {
            signals.push(SignalPoint {
                time: candle.time,
                signal_type: SignalType::IbsMeanRevSell,
                price: candle.close,
                rsi: rsi_val,
                source: "ibs_mean_rev".to_string(),
            });
        }
    }
    signals
}

/// 10. RSI Divergence: price-RSI divergence via swing point detection.
pub fn detect_rsi_divergence(
    rsi: &[RsiPoint],
    candles: &[Candle],
    swing_length: usize,
) -> Vec<SignalPoint> {
    let mut signals = Vec::new();
    if candles.len() < swing_length * 2 + 1 || rsi.len() < swing_length * 2 + 1 {
        return signals;
    }
    let rsi_map: HashMap<i64, f64> = rsi.iter().map(|r| (r.time, r.value)).collect();

    // Find swing lows and swing highs in price
    let mut swing_lows: Vec<(usize, f64, f64)> = Vec::new(); // (index, price_low, rsi)
    let mut swing_highs: Vec<(usize, f64, f64)> = Vec::new();

    for i in swing_length..candles.len().saturating_sub(swing_length) {
        let candle = &candles[i];
        let rsi_val = rsi_map.get(&candle.time).copied().unwrap_or(50.0);

        // Swing low: lowest low in window
        let is_swing_low = (1..=swing_length).all(|j| {
            candle.low <= candles[i - j].low && candle.low <= candles[i + j].low
        });
        if is_swing_low {
            swing_lows.push((i, candle.low, rsi_val));
        }

        // Swing high: highest high in window
        let is_swing_high = (1..=swing_length).all(|j| {
            candle.high >= candles[i - j].high && candle.high >= candles[i + j].high
        });
        if is_swing_high {
            swing_highs.push((i, candle.high, rsi_val));
        }
    }

    // Bullish divergence: price makes lower low but RSI makes higher low
    for i in 1..swing_lows.len() {
        let (idx, price, rsi_val) = swing_lows[i];
        let (_, prev_price, prev_rsi) = swing_lows[i - 1];
        if price < prev_price && rsi_val > prev_rsi {
            signals.push(SignalPoint {
                time: candles[idx].time,
                signal_type: SignalType::RsiDivergenceBuy,
                price: candles[idx].close,
                rsi: rsi_val,
                source: "rsi_divergence".to_string(),
            });
        }
    }

    // Bearish divergence: price makes higher high but RSI makes lower high
    for i in 1..swing_highs.len() {
        let (idx, price, rsi_val) = swing_highs[i];
        let (_, prev_price, prev_rsi) = swing_highs[i - 1];
        if price > prev_price && rsi_val < prev_rsi {
            signals.push(SignalPoint {
                time: candles[idx].time,
                signal_type: SignalType::RsiDivergenceSell,
                price: candles[idx].close,
                rsi: rsi_val,
                source: "rsi_divergence".to_string(),
            });
        }
    }

    signals
}
