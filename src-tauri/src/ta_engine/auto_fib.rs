use crate::models::{AutoFibLevel, AutoFibResult, Candle};

/// Auto Fibonacci Retracement: Detect recent swing high and swing low,
/// then compute standard Fibonacci retracement levels.
///
/// `lookback` — number of bars to scan for swing high/low detection.
/// `swing_length` — bars on each side for a valid swing pivot.
pub fn calculate(candles: &[Candle], lookback: usize, swing_length: usize) -> AutoFibResult {
    let empty = AutoFibResult {
        high_time: 0,
        high_price: 0.0,
        low_time: 0,
        low_price: 0.0,
        is_uptrend: true,
        levels: Vec::new(),
    };

    if candles.len() < swing_length * 2 + 1 || lookback == 0 || swing_length == 0 {
        return empty;
    }

    let scan_start = if candles.len() > lookback {
        candles.len() - lookback
    } else {
        0
    };

    // Find swing highs and lows within lookback range
    let mut swing_highs: Vec<(usize, f64)> = Vec::new();
    let mut swing_lows: Vec<(usize, f64)> = Vec::new();

    let range_start = scan_start.max(swing_length);
    let range_end = candles.len().saturating_sub(swing_length);

    for i in range_start..range_end {
        let mut is_high = true;
        let mut is_low = true;

        for j in 1..=swing_length {
            if i < j || i + j >= candles.len() {
                is_high = false;
                is_low = false;
                break;
            }
            if candles[i].high < candles[i - j].high || candles[i].high < candles[i + j].high {
                is_high = false;
            }
            if candles[i].low > candles[i - j].low || candles[i].low > candles[i + j].low {
                is_low = false;
            }
            if !is_high && !is_low {
                break;
            }
        }

        if is_high {
            swing_highs.push((i, candles[i].high));
        }
        if is_low {
            swing_lows.push((i, candles[i].low));
        }
    }

    // Use the most recent significant swing high and swing low
    let highest = swing_highs
        .iter()
        .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));
    let lowest = swing_lows
        .iter()
        .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));

    let (high_idx, high_price) = match highest {
        Some(&(idx, price)) => (idx, price),
        None => return empty,
    };

    let (low_idx, low_price) = match lowest {
        Some(&(idx, price)) => (idx, price),
        None => return empty,
    };

    if (high_price - low_price).abs() < f64::EPSILON {
        return empty;
    }

    // Determine trend direction: if swing low came before swing high → uptrend, else downtrend
    let is_uptrend = low_idx < high_idx;

    // Standard Fibonacci levels
    let fib_ratios = [0.0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
    let range = high_price - low_price;

    let levels = fib_ratios
        .iter()
        .map(|&ratio| {
            let price = if is_uptrend {
                // Retracement from high: high - ratio * range
                high_price - ratio * range
            } else {
                // Retracement from low: low + ratio * range
                low_price + ratio * range
            };
            AutoFibLevel { ratio, price }
        })
        .collect();

    AutoFibResult {
        high_time: candles[high_idx].time,
        high_price,
        low_time: candles[low_idx].time,
        low_price,
        is_uptrend,
        levels,
    }
}
