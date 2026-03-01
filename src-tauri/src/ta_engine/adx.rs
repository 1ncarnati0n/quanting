use crate::models::{AdxPoint, AdxResult, Candle};

/// ADX with +DI and -DI using Wilder's smoothing.
pub fn calculate(candles: &[Candle], period: usize) -> AdxResult {
    if candles.len() < period * 2 + 1 || period == 0 {
        return AdxResult {
            period,
            data: Vec::new(),
        };
    }

    let len = candles.len();
    let mut plus_dm = Vec::with_capacity(len);
    let mut minus_dm = Vec::with_capacity(len);
    let mut tr = Vec::with_capacity(len);

    plus_dm.push(0.0);
    minus_dm.push(0.0);
    tr.push(candles[0].high - candles[0].low);

    for i in 1..len {
        let up = candles[i].high - candles[i - 1].high;
        let down = candles[i - 1].low - candles[i].low;

        plus_dm.push(if up > down && up > 0.0 { up } else { 0.0 });
        minus_dm.push(if down > up && down > 0.0 { down } else { 0.0 });

        let prev_close = candles[i - 1].close;
        let t = (candles[i].high - candles[i].low)
            .max((candles[i].high - prev_close).abs())
            .max((candles[i].low - prev_close).abs());
        tr.push(t);
    }

    // Wilder's smoothing: first value = sum of period, subsequent = prev - prev/period + current
    let p = period as f64;

    // Initial sums
    let mut smooth_plus_dm: f64 = plus_dm[1..=period].iter().sum();
    let mut smooth_minus_dm: f64 = minus_dm[1..=period].iter().sum();
    let mut smooth_tr: f64 = tr[1..=period].iter().sum();

    let mut dx_values = Vec::with_capacity(len);

    // First DI values at index `period`
    let plus_di_first = if smooth_tr > 0.0 { 100.0 * smooth_plus_dm / smooth_tr } else { 0.0 };
    let minus_di_first = if smooth_tr > 0.0 { 100.0 * smooth_minus_dm / smooth_tr } else { 0.0 };
    let di_sum = plus_di_first + minus_di_first;
    let dx_first = if di_sum > 0.0 { 100.0 * (plus_di_first - minus_di_first).abs() / di_sum } else { 0.0 };
    dx_values.push((candles[period].time, plus_di_first, minus_di_first, dx_first));

    for i in (period + 1)..len {
        smooth_plus_dm = smooth_plus_dm - smooth_plus_dm / p + plus_dm[i];
        smooth_minus_dm = smooth_minus_dm - smooth_minus_dm / p + minus_dm[i];
        smooth_tr = smooth_tr - smooth_tr / p + tr[i];

        let plus_di = if smooth_tr > 0.0 { 100.0 * smooth_plus_dm / smooth_tr } else { 0.0 };
        let minus_di = if smooth_tr > 0.0 { 100.0 * smooth_minus_dm / smooth_tr } else { 0.0 };
        let di_sum = plus_di + minus_di;
        let dx = if di_sum > 0.0 { 100.0 * (plus_di - minus_di).abs() / di_sum } else { 0.0 };
        dx_values.push((candles[i].time, plus_di, minus_di, dx));
    }

    // ADX = Wilder's smoothed DX over `period`
    if dx_values.len() < period {
        return AdxResult {
            period,
            data: Vec::new(),
        };
    }

    let mut adx: f64 = dx_values[..period].iter().map(|d| d.3).sum::<f64>() / p;
    let mut data = Vec::with_capacity(dx_values.len() - period + 1);

    data.push(AdxPoint {
        time: dx_values[period - 1].0,
        adx,
        plus_di: dx_values[period - 1].1,
        minus_di: dx_values[period - 1].2,
    });

    for (time, plus_di, minus_di, dx) in dx_values.iter().skip(period) {
        adx = (adx * (p - 1.0) + *dx) / p;
        data.push(AdxPoint {
            time: *time,
            adx,
            plus_di: *plus_di,
            minus_di: *minus_di,
        });
    }

    AdxResult { period, data }
}
