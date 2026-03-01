use crate::models::{Candle, MfiPoint, MfiResult};

/// Money Flow Index — volume-weighted RSI using Typical Price.
pub fn calculate(candles: &[Candle], period: usize) -> MfiResult {
    if candles.len() < period + 1 || period == 0 {
        return MfiResult {
            period,
            data: Vec::new(),
        };
    }

    // Typical price and raw money flow for each candle
    let typical: Vec<f64> = candles
        .iter()
        .map(|c| (c.high + c.low + c.close) / 3.0)
        .collect();

    let mut data = Vec::with_capacity(candles.len() - period);

    for i in period..candles.len() {
        let mut pos_flow = 0.0;
        let mut neg_flow = 0.0;

        for j in (i + 1 - period)..=i {
            let mf = typical[j] * candles[j].volume;
            if typical[j] > typical[j - 1] {
                pos_flow += mf;
            } else if typical[j] < typical[j - 1] {
                neg_flow += mf;
            }
        }

        let mfi = if neg_flow.abs() < f64::EPSILON {
            100.0
        } else {
            100.0 - 100.0 / (1.0 + pos_flow / neg_flow)
        };

        data.push(MfiPoint {
            time: candles[i].time,
            value: mfi,
        });
    }

    MfiResult { period, data }
}
