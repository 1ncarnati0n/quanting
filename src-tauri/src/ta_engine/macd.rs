use super::ema;
use crate::models::{Candle, MacdPoint, MacdResult};

/// Calculate MACD: EMA(fast) - EMA(slow), Signal = EMA(signal_period, MACD line), Histogram = MACD - Signal.
pub fn calculate(
    candles: &[Candle],
    fast_period: usize,
    slow_period: usize,
    signal_period: usize,
) -> MacdResult {
    let closes: Vec<f64> = candles.iter().map(|c| c.close).collect();

    let fast_ema = ema::calculate_from_values(&closes, fast_period);
    let slow_ema = ema::calculate_from_values(&closes, slow_period);

    if fast_ema.is_empty() || slow_ema.is_empty() {
        return MacdResult { data: Vec::new() };
    }

    // Align: fast EMA starts at index (fast_period - 1), slow at (slow_period - 1).
    // MACD line starts where both are available: at slow_period - 1.
    // fast_ema offset relative to slow_ema: slow_period - fast_period
    let offset = slow_period - fast_period;
    let macd_values: Vec<f64> = slow_ema
        .iter()
        .enumerate()
        .map(|(i, slow)| fast_ema[i + offset] - slow)
        .collect();

    // Signal line = EMA of MACD values
    let signal_values = ema::calculate_from_values(&macd_values, signal_period);

    if signal_values.is_empty() {
        return MacdResult { data: Vec::new() };
    }

    // The signal starts at (signal_period - 1) within macd_values.
    // macd_values[0] corresponds to candle index (slow_period - 1).
    // signal_values[0] corresponds to macd_values index (signal_period - 1).
    // So signal_values[0] maps to candle index: (slow_period - 1) + (signal_period - 1).
    let candle_start = slow_period - 1 + signal_period - 1;

    let data = signal_values
        .iter()
        .enumerate()
        .map(|(i, &sig)| {
            let macd_idx = i + signal_period - 1;
            let macd_val = macd_values[macd_idx];
            MacdPoint {
                time: candles[candle_start + i].time,
                macd: macd_val,
                signal: sig,
                histogram: macd_val - sig,
            }
        })
        .collect();

    MacdResult { data }
}
