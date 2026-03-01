use crate::models::Candle;

/// Rolling highest high over `period` candles.
/// Returns Vec<f64> of length `candles.len() - period + 1`, starting at index `period - 1`.
pub fn highest_high(candles: &[Candle], period: usize) -> Vec<f64> {
    if candles.len() < period || period == 0 {
        return Vec::new();
    }

    let mut result = Vec::with_capacity(candles.len() - period + 1);
    for i in (period - 1)..candles.len() {
        let window = &candles[(i + 1 - period)..=i];
        let hh = window
            .iter()
            .map(|c| c.high)
            .fold(f64::NEG_INFINITY, f64::max);
        result.push(hh);
    }
    result
}

/// Rolling lowest low over `period` candles.
/// Returns Vec<f64> of length `candles.len() - period + 1`, starting at index `period - 1`.
pub fn lowest_low(candles: &[Candle], period: usize) -> Vec<f64> {
    if candles.len() < period || period == 0 {
        return Vec::new();
    }

    let mut result = Vec::with_capacity(candles.len() - period + 1);
    for i in (period - 1)..candles.len() {
        let window = &candles[(i + 1 - period)..=i];
        let ll = window
            .iter()
            .map(|c| c.low)
            .fold(f64::INFINITY, f64::min);
        result.push(ll);
    }
    result
}
