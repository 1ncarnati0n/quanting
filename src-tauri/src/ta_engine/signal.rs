use std::collections::HashMap;

use crate::models::{
    BollingerBandsPoint, Candle, MacdResult, RsiPoint, SignalFilterParams, SignalPoint, SignalType,
    StochasticResult,
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
