use tauri::State;

use crate::api_client::{BinanceClient, YahooClient};
use crate::cache::CacheDb;
use crate::models::{
    AnalysisParams, AnalysisResponse, Candle, FundamentalsParams, FundamentalsResponse, MarketType,
    WatchlistSnapshot, WatchlistSnapshotParams,
};
use crate::ta_engine;

const ANALYSIS_OUTPUT_LIMIT: u32 = 500;
const MAX_WATCHLIST_ITEMS: usize = 24;

#[derive(Debug, Clone)]
struct IntervalPlan {
    requested: String,
    source: String,
    factor: u32,
    needs_resample: bool,
}

fn market_prefix(market: &MarketType) -> &'static str {
    match market {
        MarketType::Crypto => "crypto",
        MarketType::Forex => "fx",
        MarketType::UsStock => "us",
        MarketType::KrStock => "kr",
    }
}

fn native_intervals(market: &MarketType) -> &'static [&'static str] {
    match market {
        MarketType::Crypto => &[
            "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "1w",
            "1M",
        ],
        MarketType::Forex | MarketType::UsStock | MarketType::KrStock => {
            &["1m", "2m", "5m", "15m", "30m", "1h", "1d", "1w", "1M"]
        }
    }
}

fn interval_seconds(interval: &str) -> Option<i64> {
    let normalized = interval.trim();
    if normalized.is_empty() {
        return None;
    }

    let mut digits = String::new();
    let mut unit: Option<char> = None;
    for ch in normalized.chars() {
        if ch.is_ascii_digit() {
            digits.push(ch);
        } else {
            unit = Some(ch);
            break;
        }
    }

    if digits.is_empty() {
        return None;
    }
    let value = digits.parse::<i64>().ok()?;
    if value <= 0 {
        return None;
    }

    match unit {
        Some('m') => Some(value * 60),
        Some('h') => Some(value * 3_600),
        Some('d') => Some(value * 86_400),
        Some('w') => Some(value * 604_800),
        Some('M') => Some(value * 2_592_000),
        _ => None,
    }
}

fn resolve_interval_plan(interval: &str, market: &MarketType) -> IntervalPlan {
    let requested = {
        let trimmed = interval.trim();
        if trimmed.is_empty() {
            "1d".to_string()
        } else {
            trimmed.to_string()
        }
    };

    let native = native_intervals(market);
    if native.iter().any(|candidate| *candidate == requested) {
        return IntervalPlan {
            requested: requested.clone(),
            source: requested,
            factor: 1,
            needs_resample: false,
        };
    }

    let target_seconds = interval_seconds(&requested);
    let Some(target_seconds) = target_seconds else {
        return IntervalPlan {
            requested: "1d".to_string(),
            source: "1d".to_string(),
            factor: 1,
            needs_resample: false,
        };
    };

    let mut best_source = "1d";
    let mut best_seconds = 86_400_i64;
    let mut found_divisor = false;

    for candidate in native {
        let Some(source_seconds) = interval_seconds(candidate) else {
            continue;
        };
        if source_seconds > target_seconds {
            continue;
        }
        if target_seconds % source_seconds != 0 {
            continue;
        }
        if !found_divisor || source_seconds > best_seconds {
            found_divisor = true;
            best_source = candidate;
            best_seconds = source_seconds;
        }
    }

    if !found_divisor {
        best_source = native.first().copied().unwrap_or("1d");
        best_seconds = interval_seconds(best_source).unwrap_or(86_400);
    }

    let factor = if best_seconds > 0 {
        (target_seconds / best_seconds).max(1) as u32
    } else {
        1
    };

    IntervalPlan {
        requested: requested.clone(),
        source: best_source.to_string(),
        factor,
        needs_resample: requested != best_source,
    }
}

fn requested_source_limit(output_limit: u32, plan: &IntervalPlan, market: &MarketType) -> u32 {
    let factor = plan.factor.max(1);
    let expanded = output_limit.saturating_mul(factor.saturating_add(1));
    match market {
        MarketType::Crypto => expanded.clamp(output_limit, 1_000),
        MarketType::Forex | MarketType::UsStock | MarketType::KrStock => {
            expanded.clamp(output_limit, 2_500)
        }
    }
}

fn resample_candles(candles: &[Candle], plan: &IntervalPlan) -> Vec<Candle> {
    if !plan.needs_resample || candles.is_empty() {
        return candles.to_vec();
    }

    let Some(bucket_seconds) = interval_seconds(&plan.requested) else {
        return candles.to_vec();
    };

    let mut output: Vec<Candle> = Vec::new();
    for candle in candles {
        let bucket_start = (candle.time / bucket_seconds) * bucket_seconds;

        if let Some(last) = output.last_mut() {
            if last.time == bucket_start {
                if candle.high > last.high {
                    last.high = candle.high;
                }
                if candle.low < last.low {
                    last.low = candle.low;
                }
                last.close = candle.close;
                last.volume += candle.volume;
                continue;
            }
        }

        output.push(Candle {
            time: bucket_start,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
        });
    }

    output
}

#[tauri::command]
pub async fn fetch_analysis(
    params: AnalysisParams,
    binance_client: State<'_, BinanceClient>,
    yahoo_client: State<'_, YahooClient>,
    cache: State<'_, CacheDb>,
) -> Result<AnalysisResponse, String> {
    let market_prefix = market_prefix(&params.market);
    let cache_key_symbol = format!("{}:{}", market_prefix, params.symbol);
    let plan = resolve_interval_plan(&params.interval, &params.market);
    let source_limit = requested_source_limit(ANALYSIS_OUTPUT_LIMIT, &plan, &params.market);

    if let Some(cached_source_candles) = cache.get(&cache_key_symbol, &plan.source) {
        let candles = resample_candles(&cached_source_candles, &plan);
        let response = ta_engine::analyze(&candles, &params);
        return Ok(response);
    }

    let source_candles = match params.market {
        MarketType::Crypto => {
            binance_client
                .fetch_klines(&params.symbol, &plan.source, source_limit)
                .await?
        }
        MarketType::Forex | MarketType::UsStock | MarketType::KrStock => {
            yahoo_client
                .fetch_klines(&params.symbol, &plan.source, source_limit)
                .await?
        }
    };

    let _ = cache.set(&cache_key_symbol, &plan.source, &source_candles);
    let candles = resample_candles(&source_candles, &plan);

    let response = ta_engine::analyze(&candles, &params);
    Ok(response)
}

#[tauri::command]
pub async fn fetch_watchlist_snapshots(
    params: WatchlistSnapshotParams,
    binance_client: State<'_, BinanceClient>,
    yahoo_client: State<'_, YahooClient>,
    cache: State<'_, CacheDb>,
) -> Result<Vec<WatchlistSnapshot>, String> {
    if params.items.is_empty() {
        return Ok(Vec::new());
    }

    let interval = if params.interval.trim().is_empty() {
        "1d".to_string()
    } else {
        params.interval.clone()
    };
    let limit = params.limit.clamp(32, 240) as usize;
    let mut snapshots: Vec<WatchlistSnapshot> = Vec::with_capacity(params.items.len());

    for item in params.items.iter().take(MAX_WATCHLIST_ITEMS) {
        let market_prefix = market_prefix(&item.market);
        let cache_key_symbol = format!("{}:{}", market_prefix, item.symbol);
        let plan = resolve_interval_plan(&interval, &item.market);
        let source_limit = requested_source_limit(limit as u32, &plan, &item.market);

        let source_candles = if let Some(cached) = cache.get(&cache_key_symbol, &plan.source) {
            cached
        } else {
            let fetched_result = match item.market {
                MarketType::Crypto => {
                    binance_client
                        .fetch_klines(&item.symbol, &plan.source, source_limit)
                        .await
                }
                MarketType::Forex | MarketType::UsStock | MarketType::KrStock => {
                    yahoo_client
                        .fetch_klines(&item.symbol, &plan.source, source_limit)
                        .await
                }
            };
            let fetched = match fetched_result {
                Ok(candles) => candles,
                Err(_) => continue,
            };
            let _ = cache.set(&cache_key_symbol, &plan.source, &fetched);
            fetched
        };
        let candles = resample_candles(&source_candles, &plan);

        if candles.len() < 2 {
            continue;
        }

        let tail_len = candles.len().min(limit);
        let tail = &candles[candles.len() - tail_len..];
        let last = &tail[tail.len() - 1];
        let prev = &tail[tail.len() - 2];
        let change = last.close - prev.close;
        let change_pct = if prev.close.abs() > f64::EPSILON {
            (change / prev.close) * 100.0
        } else {
            0.0
        };
        let high = tail
            .iter()
            .fold(f64::MIN, |acc, candle| if candle.high > acc { candle.high } else { acc });
        let low = tail
            .iter()
            .fold(f64::MAX, |acc, candle| if candle.low < acc { candle.low } else { acc });
        let sparkline_count = tail.len().min(32);
        let sparkline = tail[tail.len() - sparkline_count..]
            .iter()
            .map(|candle| candle.close)
            .collect::<Vec<f64>>();

        snapshots.push(WatchlistSnapshot {
            symbol: item.symbol.clone(),
            market: item.market.clone(),
            last_price: last.close,
            change,
            change_pct,
            high,
            low,
            sparkline,
        });
    }

    Ok(snapshots)
}

#[tauri::command]
pub async fn fetch_fundamentals(
    params: FundamentalsParams,
    yahoo_client: State<'_, YahooClient>,
) -> Result<FundamentalsResponse, String> {
    if matches!(params.market, MarketType::Crypto) {
        return Err("재무 데이터는 주식/ETF/외환 심볼에서만 지원됩니다".to_string());
    }

    yahoo_client
        .fetch_fundamentals(&params.symbol, params.market.clone())
        .await
}
