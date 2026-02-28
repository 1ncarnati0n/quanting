use crate::models::{AtrPoint, AtrResult, Candle};

pub fn calculate(candles: &[Candle], period: usize) -> AtrResult {
    if candles.is_empty() || period == 0 {
        return AtrResult {
            period,
            data: Vec::new(),
        };
    }

    let mut true_ranges = Vec::with_capacity(candles.len());
    for (i, candle) in candles.iter().enumerate() {
        if i == 0 {
            true_ranges.push(candle.high - candle.low);
            continue;
        }
        let prev_close = candles[i - 1].close;
        let tr = (candle.high - candle.low)
            .max((candle.high - prev_close).abs())
            .max((candle.low - prev_close).abs());
        true_ranges.push(tr);
    }

    if candles.len() < period {
        return AtrResult {
            period,
            data: Vec::new(),
        };
    }

    let mut data = Vec::with_capacity(candles.len() - period + 1);
    let mut atr = true_ranges.iter().take(period).sum::<f64>() / period as f64;
    data.push(AtrPoint {
        time: candles[period - 1].time,
        value: atr,
    });

    for i in period..candles.len() {
        atr = ((atr * (period as f64 - 1.0)) + true_ranges[i]) / period as f64;
        data.push(AtrPoint {
            time: candles[i].time,
            value: atr,
        });
    }

    AtrResult { period, data }
}
