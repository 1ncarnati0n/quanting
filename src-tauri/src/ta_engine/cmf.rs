use crate::models::{Candle, CmfPoint, CmfResult};

/// Chaikin Money Flow: Σ[((C-L)-(H-C))/(H-L) × V] / Σ(V) over period.
pub fn calculate(candles: &[Candle], period: usize) -> CmfResult {
    if candles.len() < period || period == 0 {
        return CmfResult {
            period,
            data: Vec::new(),
        };
    }

    // Money Flow Multiplier for each candle
    let mfm: Vec<f64> = candles
        .iter()
        .map(|c| {
            let hl = c.high - c.low;
            if hl.abs() < f64::EPSILON {
                0.0
            } else {
                ((c.close - c.low) - (c.high - c.close)) / hl
            }
        })
        .collect();

    let mut data = Vec::with_capacity(candles.len() - period + 1);

    for i in (period - 1)..candles.len() {
        let start = i + 1 - period;
        let mut mfv_sum = 0.0;
        let mut vol_sum = 0.0;
        for j in start..=i {
            mfv_sum += mfm[j] * candles[j].volume;
            vol_sum += candles[j].volume;
        }
        let cmf = if vol_sum.abs() < f64::EPSILON {
            0.0
        } else {
            mfv_sum / vol_sum
        };
        data.push(CmfPoint {
            time: candles[i].time,
            value: cmf,
        });
    }

    CmfResult { period, data }
}
