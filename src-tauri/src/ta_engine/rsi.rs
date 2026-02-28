use crate::models::{Candle, RsiPoint};

pub fn calculate(candles: &[Candle], period: usize) -> Vec<RsiPoint> {
    if candles.len() < period + 1 {
        return Vec::new();
    }

    let closes: Vec<f64> = candles.iter().map(|c| c.close).collect();

    // Calculate price changes
    let changes: Vec<f64> = closes.windows(2).map(|w| w[1] - w[0]).collect();

    let gains: Vec<f64> = changes.iter().map(|&c| if c > 0.0 { c } else { 0.0 }).collect();
    let losses: Vec<f64> = changes.iter().map(|&c| if c < 0.0 { -c } else { 0.0 }).collect();

    let mut result = Vec::with_capacity(candles.len() - period);

    // First average: simple SMA
    let first_avg_gain: f64 = gains[..period].iter().sum::<f64>() / period as f64;
    let first_avg_loss: f64 = losses[..period].iter().sum::<f64>() / period as f64;

    let mut avg_gain = first_avg_gain;
    let mut avg_loss = first_avg_loss;

    // RSI for the first complete period
    let rsi_value = if avg_loss == 0.0 {
        100.0
    } else {
        let rs = avg_gain / avg_loss;
        100.0 - (100.0 / (1.0 + rs))
    };

    result.push(RsiPoint {
        time: candles[period].time,
        value: rsi_value,
    });

    // Subsequent values: Wilder's Smoothing
    for i in period..changes.len() {
        avg_gain = (avg_gain * (period as f64 - 1.0) + gains[i]) / period as f64;
        avg_loss = (avg_loss * (period as f64 - 1.0) + losses[i]) / period as f64;

        let rsi_value = if avg_loss == 0.0 {
            100.0
        } else {
            let rs = avg_gain / avg_loss;
            100.0 - (100.0 / (1.0 + rs))
        };

        result.push(RsiPoint {
            // changes[i] corresponds to candles[i+1]
            time: candles[i + 1].time,
            value: rsi_value,
        });
    }

    result
}
