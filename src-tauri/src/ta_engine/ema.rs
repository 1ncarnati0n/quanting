use super::sma;
use crate::models::{Candle, MaPoint, MovingAverageResult};

/// Calculate EMA from raw candle close prices.
pub fn calculate(candles: &[Candle], period: usize) -> MovingAverageResult {
    let closes: Vec<f64> = candles.iter().map(|c| c.close).collect();
    let ema_values = calculate_from_values(&closes, period);

    // EMA starts at index (period - 1) — the first SMA seed
    let data = ema_values
        .into_iter()
        .enumerate()
        .map(|(i, value)| MaPoint {
            time: candles[i + period - 1].time,
            value,
        })
        .collect();

    MovingAverageResult { period, data }
}

/// Calculate EMA from a slice of f64 values.
/// Uses initial SMA as seed, then applies multiplier = 2 / (period + 1).
/// Returns Vec<f64> of length `values.len() - period + 1`.
pub fn calculate_from_values(values: &[f64], period: usize) -> Vec<f64> {
    if values.len() < period || period == 0 {
        return Vec::new();
    }

    let sma_seed = sma::calculate_from_values(&values[..period], period);
    if sma_seed.is_empty() {
        return Vec::new();
    }

    let multiplier = 2.0 / (period as f64 + 1.0);
    let mut result = Vec::with_capacity(values.len() - period + 1);
    result.push(sma_seed[0]); // first EMA = SMA of initial period

    for value in values.iter().skip(period) {
        let prev = *result.last().unwrap();
        let ema = (*value - prev) * multiplier + prev;
        result.push(ema);
    }

    result
}
