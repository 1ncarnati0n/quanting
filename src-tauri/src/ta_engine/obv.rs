use crate::models::{Candle, ObvPoint, ObvResult};

/// Calculate On-Balance Volume (OBV).
/// - If close > prev close: OBV += volume
/// - If close < prev close: OBV -= volume
/// - If close == prev close: OBV unchanged
pub fn calculate(candles: &[Candle]) -> ObvResult {
    if candles.len() < 2 {
        return ObvResult { data: Vec::new() };
    }

    let mut data = Vec::with_capacity(candles.len());
    let mut obv: f64 = 0.0;

    // First candle starts at 0
    data.push(ObvPoint {
        time: candles[0].time,
        value: obv,
    });

    for i in 1..candles.len() {
        if candles[i].close > candles[i - 1].close {
            obv += candles[i].volume;
        } else if candles[i].close < candles[i - 1].close {
            obv -= candles[i].volume;
        }
        // else: unchanged

        data.push(ObvPoint {
            time: candles[i].time,
            value: obv,
        });
    }

    ObvResult { data }
}
