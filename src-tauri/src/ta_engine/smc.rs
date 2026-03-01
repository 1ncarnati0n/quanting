use crate::models::{Candle, SmcEvent, SmcResult};

/// Smart Money Concepts: Detect swing highs/lows, then identify BOS and CHoCH events.
///
/// - **Swing High**: candle whose high is >= all candles in the lookback window on both sides
/// - **Swing Low**: candle whose low is <= all candles in the lookback window on both sides
/// - **BOS (Break of Structure)**: price breaks past a swing in the direction of the existing trend
/// - **CHoCH (Change of Character)**: price breaks past a swing against the existing trend
pub fn calculate(candles: &[Candle], swing_length: usize) -> SmcResult {
    if candles.len() < swing_length * 2 + 1 || swing_length == 0 {
        return SmcResult { data: Vec::new() };
    }

    // Step 1: Detect swing highs and swing lows
    let mut swing_highs: Vec<(usize, f64)> = Vec::new(); // (candle_index, price)
    let mut swing_lows: Vec<(usize, f64)> = Vec::new();

    for i in swing_length..(candles.len() - swing_length) {
        let mut is_high = true;
        let mut is_low = true;

        for j in 1..=swing_length {
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

    // Step 2: Detect BOS and CHoCH events
    let mut events: Vec<SmcEvent> = Vec::new();
    // Track current trend: 1 = bullish, -1 = bearish, 0 = undefined
    let mut trend: i8 = 0;
    let mut last_swing_high: Option<(usize, f64)> = None;
    let mut last_swing_low: Option<(usize, f64)> = None;

    // Merge swings chronologically
    let mut all_swings: Vec<(usize, f64, bool)> = Vec::new(); // (index, price, is_high)
    for &(idx, price) in &swing_highs {
        all_swings.push((idx, price, true));
    }
    for &(idx, price) in &swing_lows {
        all_swings.push((idx, price, false));
    }
    all_swings.sort_by_key(|s| s.0);

    for &(swing_idx, swing_price, is_high) in &all_swings {
        if is_high {
            // Check if we can detect a bullish break: price exceeds previous swing high
            if let Some((prev_idx, prev_high)) = last_swing_high {
                if swing_price > prev_high {
                    if trend <= 0 {
                        // CHoCH — trend was bearish/undefined, now breaking higher
                        events.push(SmcEvent {
                            time: candles[swing_idx].time,
                            event_type: "choch_bull".to_string(),
                            price: swing_price,
                            swing_time: candles[prev_idx].time,
                            swing_price: prev_high,
                        });
                        trend = 1;
                    } else {
                        // BOS — continuation of bullish trend
                        events.push(SmcEvent {
                            time: candles[swing_idx].time,
                            event_type: "bos_bull".to_string(),
                            price: swing_price,
                            swing_time: candles[prev_idx].time,
                            swing_price: prev_high,
                        });
                    }
                }
            }
            last_swing_high = Some((swing_idx, swing_price));
        } else {
            // Check if we can detect a bearish break: price goes below previous swing low
            if let Some((prev_idx, prev_low)) = last_swing_low {
                if swing_price < prev_low {
                    if trend >= 0 {
                        // CHoCH — trend was bullish/undefined, now breaking lower
                        events.push(SmcEvent {
                            time: candles[swing_idx].time,
                            event_type: "choch_bear".to_string(),
                            price: swing_price,
                            swing_time: candles[prev_idx].time,
                            swing_price: prev_low,
                        });
                        trend = -1;
                    } else {
                        // BOS — continuation of bearish trend
                        events.push(SmcEvent {
                            time: candles[swing_idx].time,
                            event_type: "bos_bear".to_string(),
                            price: swing_price,
                            swing_time: candles[prev_idx].time,
                            swing_price: prev_low,
                        });
                    }
                }
            }
            last_swing_low = Some((swing_idx, swing_price));
        }
    }

    SmcResult { data: events }
}
