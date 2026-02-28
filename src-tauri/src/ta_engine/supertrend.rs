use crate::models::{Candle, SupertrendPoint, SupertrendResult};

fn atr_values(candles: &[Candle], period: usize) -> Vec<Option<f64>> {
    if candles.is_empty() || period == 0 {
        return vec![None; candles.len()];
    }

    let mut tr = vec![0.0; candles.len()];
    for i in 0..candles.len() {
        if i == 0 {
            tr[i] = candles[i].high - candles[i].low;
            continue;
        }
        let prev_close = candles[i - 1].close;
        tr[i] = (candles[i].high - candles[i].low)
            .max((candles[i].high - prev_close).abs())
            .max((candles[i].low - prev_close).abs());
    }

    let mut atr = vec![None; candles.len()];
    if candles.len() < period {
        return atr;
    }

    let mut prev_atr = tr.iter().take(period).sum::<f64>() / period as f64;
    atr[period - 1] = Some(prev_atr);
    for i in period..candles.len() {
        prev_atr = ((prev_atr * (period as f64 - 1.0)) + tr[i]) / period as f64;
        atr[i] = Some(prev_atr);
    }

    atr
}

pub fn calculate(candles: &[Candle], period: usize, multiplier: f64) -> SupertrendResult {
    let mut data = Vec::new();
    if candles.len() < period || period == 0 {
        return SupertrendResult {
            period,
            multiplier,
            data,
        };
    }

    let atr = atr_values(candles, period);
    let mut final_upper = vec![0.0; candles.len()];
    let mut final_lower = vec![0.0; candles.len()];

    let mut started = false;
    let mut prev_super = 0.0_f64;

    for i in 0..candles.len() {
        let Some(atr_i) = atr[i] else {
            continue;
        };
        let hl2 = (candles[i].high + candles[i].low) / 2.0;
        let basic_upper = hl2 + multiplier * atr_i;
        let basic_lower = hl2 - multiplier * atr_i;

        if !started {
            final_upper[i] = basic_upper;
            final_lower[i] = basic_lower;
            prev_super = basic_upper;
            started = true;

            data.push(SupertrendPoint {
                time: candles[i].time,
                value: prev_super,
                direction: -1,
            });
            continue;
        }

        let prev_close = candles[i - 1].close;
        let prev_final_upper = final_upper[i - 1];
        let prev_final_lower = final_lower[i - 1];

        final_upper[i] = if basic_upper < prev_final_upper || prev_close > prev_final_upper {
            basic_upper
        } else {
            prev_final_upper
        };
        final_lower[i] = if basic_lower > prev_final_lower || prev_close < prev_final_lower {
            basic_lower
        } else {
            prev_final_lower
        };

        let (current_super, current_dir) = if prev_super == prev_final_upper {
            if candles[i].close <= final_upper[i] {
                (final_upper[i], -1)
            } else {
                (final_lower[i], 1)
            }
        } else if candles[i].close >= final_lower[i] {
            (final_lower[i], 1)
        } else {
            (final_upper[i], -1)
        };

        prev_super = current_super;
        data.push(SupertrendPoint {
            time: candles[i].time,
            value: current_super,
            direction: current_dir,
        });
    }

    SupertrendResult {
        period,
        multiplier,
        data,
    }
}
