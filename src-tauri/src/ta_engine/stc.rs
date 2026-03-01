use super::ema;
use crate::models::{Candle, StcPoint, StcResult};

/// Schaff Trend Cycle: Double Stochastic smoothing of MACD line (EMA fast - EMA slow).
pub fn calculate(candles: &[Candle], tc_len: usize, fast_ma: usize, slow_ma: usize) -> StcResult {
    let closes: Vec<f64> = candles.iter().map(|c| c.close).collect();

    let ema_fast = ema::calculate_from_values(&closes, fast_ma);
    let ema_slow = ema::calculate_from_values(&closes, slow_ma);

    if ema_fast.is_empty() || ema_slow.is_empty() {
        return StcResult {
            tc_len,
            fast_ma,
            slow_ma,
            data: Vec::new(),
        };
    }

    // Align: fast starts at (fast_ma-1), slow starts at (slow_ma-1)
    let fast_start = fast_ma - 1;
    let slow_start = slow_ma - 1;
    let offset = slow_start - fast_start; // slow_ma > fast_ma always

    if ema_fast.len() <= offset {
        return StcResult {
            tc_len,
            fast_ma,
            slow_ma,
            data: Vec::new(),
        };
    }

    let macd_line: Vec<f64> = (0..ema_slow.len())
        .map(|i| ema_fast[i + offset] - ema_slow[i])
        .collect();

    if macd_line.len() < tc_len || tc_len == 0 {
        return StcResult {
            tc_len,
            fast_ma,
            slow_ma,
            data: Vec::new(),
        };
    }

    // First Stochastic smoothing
    let stoch1 = stochastic_smooth(&macd_line, tc_len);
    if stoch1.len() < tc_len {
        return StcResult {
            tc_len,
            fast_ma,
            slow_ma,
            data: Vec::new(),
        };
    }

    // Second Stochastic smoothing
    let stoch2 = stochastic_smooth(&stoch1, tc_len);

    // Candle time alignment: slow EMA starts at candle index (slow_ma-1)
    // First stoch starts tc_len-1 after that, second stoch another tc_len-1
    let total_offset = slow_start + (tc_len - 1) * 2;

    let data = stoch2
        .iter()
        .enumerate()
        .filter_map(|(i, &value)| {
            let candle_idx = total_offset + i;
            if candle_idx < candles.len() {
                Some(StcPoint {
                    time: candles[candle_idx].time,
                    value: value.clamp(0.0, 100.0),
                })
            } else {
                None
            }
        })
        .collect();

    StcResult {
        tc_len,
        fast_ma,
        slow_ma,
        data,
    }
}

/// Stochastic transformation with EMA smoothing (factor 0.5).
fn stochastic_smooth(values: &[f64], period: usize) -> Vec<f64> {
    if values.len() < period || period == 0 {
        return Vec::new();
    }

    let mut result = Vec::with_capacity(values.len() - period + 1);
    let factor = 0.5;
    let mut prev_stoch = 0.0;

    for i in (period - 1)..values.len() {
        let window = &values[(i + 1 - period)..=i];
        let highest = window.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
        let lowest = window.iter().cloned().fold(f64::INFINITY, f64::min);
        let range = highest - lowest;

        let raw = if range.abs() < f64::EPSILON {
            prev_stoch
        } else {
            100.0 * (values[i] - lowest) / range
        };

        let smoothed = prev_stoch + factor * (raw - prev_stoch);
        prev_stoch = smoothed;
        result.push(smoothed);
    }

    result
}
