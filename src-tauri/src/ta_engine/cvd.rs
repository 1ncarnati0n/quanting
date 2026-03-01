use crate::models::{Candle, CvdPoint, CvdResult};

/// Cumulative Volume Delta: close>open → +volume, close<open → -volume, cumulative sum.
pub fn calculate(candles: &[Candle]) -> CvdResult {
    if candles.is_empty() {
        return CvdResult { data: Vec::new() };
    }

    let mut cumulative = 0.0;
    let data = candles
        .iter()
        .map(|c| {
            let delta = if c.close > c.open {
                c.volume
            } else if c.close < c.open {
                -c.volume
            } else {
                0.0
            };
            cumulative += delta;
            CvdPoint {
                time: c.time,
                value: cumulative,
            }
        })
        .collect();

    CvdResult { data }
}
