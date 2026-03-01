use super::helpers;
use crate::models::{Candle, WillrPoint, WillrResult};

/// Williams %R: -100 × (HH - Close) / (HH - LL) over period
pub fn calculate(candles: &[Candle], period: usize) -> WillrResult {
    if candles.len() < period || period == 0 {
        return WillrResult {
            period,
            data: Vec::new(),
        };
    }

    let hh = helpers::highest_high(candles, period);
    let ll = helpers::lowest_low(candles, period);

    let data = hh
        .iter()
        .zip(ll.iter())
        .enumerate()
        .map(|(i, (&high, &low))| {
            let candle_idx = i + period - 1;
            let close = candles[candle_idx].close;
            let range = high - low;
            let value = if range.abs() < f64::EPSILON {
                -50.0
            } else {
                -100.0 * (high - close) / range
            };
            WillrPoint {
                time: candles[candle_idx].time,
                value,
            }
        })
        .collect();

    WillrResult { period, data }
}
