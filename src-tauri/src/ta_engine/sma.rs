use crate::models::{Candle, MaPoint, MovingAverageResult};

/// Calculate SMA from raw candle close prices.
pub fn calculate(candles: &[Candle], period: usize) -> MovingAverageResult {
    let closes: Vec<f64> = candles.iter().map(|c| c.close).collect();
    let data = calculate_from_values(&closes, period)
        .into_iter()
        .enumerate()
        .map(|(i, value)| MaPoint {
            time: candles[i + period - 1].time,
            value,
        })
        .collect();

    MovingAverageResult { period, data }
}

/// Calculate SMA from a slice of f64 values (reusable for Stochastic %K smoothing, etc.).
/// Returns a Vec<f64> of length `values.len() - period + 1`.
pub fn calculate_from_values(values: &[f64], period: usize) -> Vec<f64> {
    if values.len() < period || period == 0 {
        return Vec::new();
    }

    let mut result = Vec::with_capacity(values.len() - period + 1);
    let mut sum: f64 = values[..period].iter().sum();
    result.push(sum / period as f64);

    for i in period..values.len() {
        sum += values[i] - values[i - period];
        result.push(sum / period as f64);
    }

    result
}
