use crate::models::{Candle, VwapPoint, VwapResult};

/// Anchored VWAP: Same as standard VWAP but starts accumulation from anchor_time.
/// Only produces data points from anchor_time onward.
pub fn calculate(candles: &[Candle], anchor_time: i64) -> VwapResult {
    // Find the candle at or after anchor_time
    let start_idx = candles
        .iter()
        .position(|c| c.time >= anchor_time)
        .unwrap_or(candles.len());

    if start_idx >= candles.len() {
        return VwapResult { data: Vec::new() };
    }

    let mut cumulative_pv = 0.0_f64;
    let mut cumulative_volume = 0.0_f64;
    let mut data = Vec::with_capacity(candles.len() - start_idx);

    for candle in &candles[start_idx..] {
        let typical_price = (candle.high + candle.low + candle.close) / 3.0;
        cumulative_pv += typical_price * candle.volume;
        cumulative_volume += candle.volume.max(0.0);

        let value = if cumulative_volume > f64::EPSILON {
            cumulative_pv / cumulative_volume
        } else {
            typical_price
        };

        data.push(VwapPoint {
            time: candle.time,
            value,
        });
    }

    VwapResult { data }
}
