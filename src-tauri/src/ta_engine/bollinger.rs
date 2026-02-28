use crate::models::{BollingerBandsPoint, Candle};

pub fn calculate(
    candles: &[Candle],
    period: usize,
    multiplier: f64,
) -> Vec<BollingerBandsPoint> {
    if candles.len() < period {
        return Vec::new();
    }

    let closes: Vec<f64> = candles.iter().map(|c| c.close).collect();
    let mut result = Vec::with_capacity(candles.len() - period + 1);

    for i in (period - 1)..candles.len() {
        let window = &closes[(i + 1 - period)..=i];

        // SMA
        let sum: f64 = window.iter().sum();
        let sma = sum / period as f64;

        // Population standard deviation (divide by N, not N-1)
        let variance: f64 = window.iter().map(|x| (x - sma).powi(2)).sum::<f64>() / period as f64;
        let std_dev = variance.sqrt();

        result.push(BollingerBandsPoint {
            time: candles[i].time,
            upper: sma + multiplier * std_dev,
            middle: sma,
            lower: sma - multiplier * std_dev,
        });
    }

    result
}
