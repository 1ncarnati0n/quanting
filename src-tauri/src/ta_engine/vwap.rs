use crate::models::{Candle, VwapPoint, VwapResult};

pub fn calculate(candles: &[Candle]) -> VwapResult {
    let mut cumulative_pv = 0.0_f64;
    let mut cumulative_volume = 0.0_f64;
    let mut data = Vec::with_capacity(candles.len());

    for candle in candles {
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
