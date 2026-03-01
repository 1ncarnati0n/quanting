use std::collections::HashMap;

use crate::models::{
    AdxResult, BollingerBandsPoint, Candle, CmfResult, KeltnerResult, MacdResult,
    MovingAverageResult, ObvResult, ParabolicSarResult, RsiPoint, SignalPoint,
    SignalType, StochasticResult, SupertrendResult, VwapResult,
};

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
