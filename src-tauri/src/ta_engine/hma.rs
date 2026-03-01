use super::wma;
use crate::models::{Candle, MaPoint, MovingAverageResult};

/// Hull Moving Average: WMA( 2×WMA(n/2) − WMA(n), √n )
pub fn calculate(candles: &[Candle], period: usize) -> MovingAverageResult {
    let closes: Vec<f64> = candles.iter().map(|c| c.close).collect();
    let hma_values = calculate_from_values(&closes, period);

    if hma_values.is_empty() {
        return MovingAverageResult {
            period,
            data: Vec::new(),
        };
    }

    // Total offset: (period - 1) from WMA(n), then (sqrt_period - 1) from final WMA
    let sqrt_period = ((period as f64).sqrt() as usize).max(1);
    // WMA(n) starts at index (period - 1)
    // WMA(half) starts at index (half - 1)
    // Combined diff starts at index (period - 1) (the later of the two)
    // Final WMA starts at index (period - 1) + (sqrt_period - 1)
    let total_offset = period - 1 + sqrt_period - 1;

    let data = hma_values
        .iter()
        .enumerate()
        .map(|(i, &value)| MaPoint {
            time: candles[total_offset + i].time,
            value,
        })
        .collect();

    MovingAverageResult { period, data }
}

pub fn calculate_from_values(values: &[f64], period: usize) -> Vec<f64> {
    if period < 2 || values.len() < period {
        return Vec::new();
    }

    let half = (period / 2).max(1);
    let sqrt_period = ((period as f64).sqrt() as usize).max(1);

    let wma_half = wma::calculate_from_values(values, half);
    let wma_full = wma::calculate_from_values(values, period);

    if wma_half.is_empty() || wma_full.is_empty() {
        return Vec::new();
    }

    // Align: wma_half starts at index (half-1), wma_full at (period-1)
    // Diff should start where wma_full starts
    let offset = period - half; // wma_half has this many extra leading values
    if wma_half.len() <= offset {
        return Vec::new();
    }

    let diff: Vec<f64> = (0..wma_full.len())
        .map(|i| 2.0 * wma_half[i + offset] - wma_full[i])
        .collect();

    wma::calculate_from_values(&diff, sqrt_period)
}
