use crate::models::{Candle, IchimokuPoint, IchimokuResult};

fn mid_price(candles: &[Candle], start: usize, end: usize) -> f64 {
    let mut highest = f64::MIN;
    let mut lowest = f64::MAX;
    for candle in &candles[start..=end] {
        highest = highest.max(candle.high);
        lowest = lowest.min(candle.low);
    }
    (highest + lowest) / 2.0
}

pub fn calculate(
    candles: &[Candle],
    conversion_period: usize,
    base_period: usize,
    span_b_period: usize,
    displacement: usize,
) -> IchimokuResult {
    if candles.is_empty() {
        return IchimokuResult { data: Vec::new() };
    }

    let n = candles.len();
    let mut conversion: Vec<Option<f64>> = vec![None; n];
    let mut base: Vec<Option<f64>> = vec![None; n];
    let mut span_a: Vec<Option<f64>> = vec![None; n];
    let mut span_b: Vec<Option<f64>> = vec![None; n];
    let mut lagging: Vec<Option<f64>> = vec![None; n];

    for i in 0..n {
        if i + 1 >= conversion_period {
            conversion[i] = Some(mid_price(candles, i + 1 - conversion_period, i));
        }
        if i + 1 >= base_period {
            base[i] = Some(mid_price(candles, i + 1 - base_period, i));
        }
        if let (Some(c), Some(b)) = (conversion[i], base[i]) {
            span_a[i] = Some((c + b) / 2.0);
        }
        if i + 1 >= span_b_period {
            span_b[i] = Some(mid_price(candles, i + 1 - span_b_period, i));
        }

        if i + displacement < n {
            lagging[i] = Some(candles[i + displacement].close);
        }
    }

    let data = candles
        .iter()
        .enumerate()
        .map(|(i, candle)| IchimokuPoint {
            time: candle.time,
            conversion: conversion[i],
            base: base[i],
            span_a: span_a[i],
            span_b: span_b[i],
            lagging: lagging[i],
        })
        .collect::<Vec<_>>();

    IchimokuResult { data }
}
