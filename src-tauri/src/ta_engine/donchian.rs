use super::helpers;
use crate::models::{Candle, DonchianPoint, DonchianResult};

pub fn calculate(candles: &[Candle], period: usize) -> DonchianResult {
    if candles.len() < period || period == 0 {
        return DonchianResult {
            period,
            data: Vec::new(),
        };
    }

    let hh = helpers::highest_high(candles, period);
    let ll = helpers::lowest_low(candles, period);

    let data = hh
        .iter()
        .zip(ll.iter())
        .enumerate()
        .map(|(i, (&upper, &lower))| DonchianPoint {
            time: candles[i + period - 1].time,
            upper,
            middle: (upper + lower) / 2.0,
            lower,
        })
        .collect();

    DonchianResult { period, data }
}
