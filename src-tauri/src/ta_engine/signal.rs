use std::collections::HashMap;

use crate::models::{BollingerBandsPoint, Candle, RsiPoint, SignalPoint, SignalType};

pub fn detect(
    bb: &[BollingerBandsPoint],
    rsi: &[RsiPoint],
    candles: &[Candle],
) -> Vec<SignalPoint> {
    // Index BB and RSI by timestamp for alignment
    let bb_map: HashMap<i64, &BollingerBandsPoint> = bb.iter().map(|b| (b.time, b)).collect();
    let rsi_map: HashMap<i64, &RsiPoint> = rsi.iter().map(|r| (r.time, r)).collect();

    let mut signals = Vec::new();

    for candle in candles {
        let bb_point = match bb_map.get(&candle.time) {
            Some(b) => b,
            None => continue,
        };
        let rsi_point = match rsi_map.get(&candle.time) {
            Some(r) => r,
            None => continue,
        };

        let close = candle.close;
        let rsi_val = rsi_point.value;

        // Check buy signals (close <= lower band)
        if close <= bb_point.lower {
            // Strong Buy first: RSI < 30
            if rsi_val < 30.0 {
                signals.push(SignalPoint {
                    time: candle.time,
                    signal_type: SignalType::StrongBuy,
                    price: close,
                    rsi: rsi_val,
                });
            } else if rsi_val < 50.0 {
                // Weak Buy: 30 <= RSI < 50
                signals.push(SignalPoint {
                    time: candle.time,
                    signal_type: SignalType::WeakBuy,
                    price: close,
                    rsi: rsi_val,
                });
            }
        }

        // Check sell signals (close >= upper band)
        if close >= bb_point.upper {
            // Strong Sell first: RSI > 70
            if rsi_val > 70.0 {
                signals.push(SignalPoint {
                    time: candle.time,
                    signal_type: SignalType::StrongSell,
                    price: close,
                    rsi: rsi_val,
                });
            } else if rsi_val > 50.0 {
                // Weak Sell: 50 < RSI <= 70
                signals.push(SignalPoint {
                    time: candle.time,
                    signal_type: SignalType::WeakSell,
                    price: close,
                    rsi: rsi_val,
                });
            }
        }
    }

    signals
}
