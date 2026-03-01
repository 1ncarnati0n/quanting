use super::{atr, ema};
use crate::models::{Candle, KeltnerPoint, KeltnerResult};

pub fn calculate(
    candles: &[Candle],
    ema_period: usize,
    atr_period: usize,
    atr_multiplier: f64,
) -> KeltnerResult {
    let closes: Vec<f64> = candles.iter().map(|c| c.close).collect();
    let ema_values = ema::calculate_from_values(&closes, ema_period);
    let atr_result = atr::calculate(candles, atr_period);

    if ema_values.is_empty() || atr_result.data.is_empty() {
        return KeltnerResult {
            ema_period,
            atr_period,
            atr_multiplier,
            data: Vec::new(),
        };
    }

    // EMA starts at candle index (ema_period - 1)
    // ATR starts at candle index (atr_period - 1)
    let ema_start = ema_period - 1;
    let atr_start = atr_period - 1;
    let common_start = ema_start.max(atr_start);

    let mut data = Vec::new();
    for candle_idx in common_start..candles.len() {
        let ema_idx = candle_idx - ema_start;
        let atr_idx = candle_idx - atr_start;

        if ema_idx >= ema_values.len() || atr_idx >= atr_result.data.len() {
            break;
        }

        let mid = ema_values[ema_idx];
        let atr_val = atr_result.data[atr_idx].value;
        data.push(KeltnerPoint {
            time: candles[candle_idx].time,
            upper: mid + atr_multiplier * atr_val,
            middle: mid,
            lower: mid - atr_multiplier * atr_val,
        });
    }

    KeltnerResult {
        ema_period,
        atr_period,
        atr_multiplier,
        data,
    }
}
