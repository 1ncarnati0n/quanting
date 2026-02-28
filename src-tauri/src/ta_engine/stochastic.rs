use super::sma;
use crate::models::{Candle, StochasticPoint, StochasticResult};

/// Calculate Stochastic Oscillator.
/// raw_K = 100 * (close - LL) / (HH - LL)  over k_period
/// %K = SMA(raw_K, smooth)
/// %D = SMA(%K, d_period)
pub fn calculate(
    candles: &[Candle],
    k_period: usize,
    d_period: usize,
    smooth: usize,
) -> StochasticResult {
    if candles.len() < k_period {
        return StochasticResult { data: Vec::new() };
    }

    // Step 1: Calculate raw K for each candle starting at index (k_period - 1)
    let mut raw_k = Vec::with_capacity(candles.len() - k_period + 1);
    for i in (k_period - 1)..candles.len() {
        let window = &candles[(i + 1 - k_period)..=i];
        let hh = window
            .iter()
            .map(|c| c.high)
            .fold(f64::NEG_INFINITY, f64::max);
        let ll = window.iter().map(|c| c.low).fold(f64::INFINITY, f64::min);
        let close = candles[i].close;

        let k_val = if (hh - ll).abs() < f64::EPSILON {
            50.0 // avoid division by zero
        } else {
            100.0 * (close - ll) / (hh - ll)
        };
        raw_k.push(k_val);
    }

    // Step 2: %K = SMA(raw_K, smooth)
    let k_smoothed = sma::calculate_from_values(&raw_k, smooth);
    if k_smoothed.is_empty() {
        return StochasticResult { data: Vec::new() };
    }

    // Step 3: %D = SMA(%K, d_period)
    let d_values = sma::calculate_from_values(&k_smoothed, d_period);
    if d_values.is_empty() {
        return StochasticResult { data: Vec::new() };
    }

    // Alignment:
    // raw_k[0] → candle index (k_period - 1)
    // k_smoothed[0] → raw_k index (smooth - 1) → candle index (k_period - 1) + (smooth - 1)
    // d_values[0] → k_smoothed index (d_period - 1) → candle index (k_period - 1) + (smooth - 1) + (d_period - 1)
    let candle_offset = k_period - 1 + smooth - 1 + d_period - 1;

    let data = d_values
        .iter()
        .enumerate()
        .map(|(i, &d)| {
            let k_idx = i + d_period - 1;
            StochasticPoint {
                time: candles[candle_offset + i].time,
                k: k_smoothed[k_idx],
                d,
            }
        })
        .collect();

    StochasticResult { data }
}
