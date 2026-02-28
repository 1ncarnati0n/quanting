use crate::models::{Candle, ParabolicSarPoint, ParabolicSarResult};

pub fn calculate(candles: &[Candle], step: f64, max_step: f64) -> ParabolicSarResult {
    let mut data = Vec::new();
    if candles.is_empty() {
        return ParabolicSarResult {
            step,
            max_step,
            data,
        };
    }

    if candles.len() == 1 {
        data.push(ParabolicSarPoint {
            time: candles[0].time,
            value: candles[0].close,
        });
        return ParabolicSarResult {
            step,
            max_step,
            data,
        };
    }

    let mut uptrend = candles[1].close >= candles[0].close;
    let mut sar = if uptrend {
        candles[0].low
    } else {
        candles[0].high
    };
    let mut ep = if uptrend {
        candles[0].high.max(candles[1].high)
    } else {
        candles[0].low.min(candles[1].low)
    };
    let mut af = step;

    data.push(ParabolicSarPoint {
        time: candles[0].time,
        value: sar,
    });

    for i in 1..candles.len() {
        sar = sar + af * (ep - sar);

        if uptrend {
            sar = sar.min(candles[i - 1].low);
            if i > 1 {
                sar = sar.min(candles[i - 2].low);
            }

            if candles[i].low < sar {
                uptrend = false;
                sar = ep;
                ep = candles[i].low;
                af = step;
            } else if candles[i].high > ep {
                ep = candles[i].high;
                af = (af + step).min(max_step);
            }
        } else {
            sar = sar.max(candles[i - 1].high);
            if i > 1 {
                sar = sar.max(candles[i - 2].high);
            }

            if candles[i].high > sar {
                uptrend = true;
                sar = ep;
                ep = candles[i].high;
                af = step;
            } else if candles[i].low < ep {
                ep = candles[i].low;
                af = (af + step).min(max_step);
            }
        }

        data.push(ParabolicSarPoint {
            time: candles[i].time,
            value: sar,
        });
    }

    ParabolicSarResult {
        step,
        max_step,
        data,
    }
}
