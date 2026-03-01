use super::helpers;
use crate::models::{Candle, ChoppinessPoint, ChoppinessResult};

/// Choppiness Index: 100 × LOG10(Σ TR / (HH - LL)) / LOG10(period)
pub fn calculate(candles: &[Candle], period: usize) -> ChoppinessResult {
    if candles.len() < period + 1 || period < 2 {
        return ChoppinessResult {
            period,
            data: Vec::new(),
        };
    }

    // True Range for each candle (starting from index 1)
    let mut tr = Vec::with_capacity(candles.len());
    tr.push(candles[0].high - candles[0].low); // index 0 fallback
    for i in 1..candles.len() {
        let prev_close = candles[i - 1].close;
        let val = (candles[i].high - candles[i].low)
            .max((candles[i].high - prev_close).abs())
            .max((candles[i].low - prev_close).abs());
        tr.push(val);
    }

    let hh = helpers::highest_high(candles, period);
    let ll = helpers::lowest_low(candles, period);

    let log_period = (period as f64).log10();
    let mut data = Vec::with_capacity(hh.len());

    // hh/ll start at candle index (period - 1)
    for i in 0..hh.len() {
        let candle_idx = i + period - 1;
        let start = candle_idx + 1 - period;
        let tr_sum: f64 = tr[start..=candle_idx].iter().sum();
        let range = hh[i] - ll[i];

        let chop = if range.abs() < f64::EPSILON || log_period.abs() < f64::EPSILON {
            50.0
        } else {
            100.0 * (tr_sum / range).log10() / log_period
        };

        data.push(ChoppinessPoint {
            time: candles[candle_idx].time,
            value: chop.clamp(0.0, 100.0),
        });
    }

    ChoppinessResult { period, data }
}
