use tauri::State;

use crate::api_client::{BinanceClient, YahooClient};
use crate::cache::CacheDb;
use crate::models::{
    AnalysisParams, AnalysisResponse, FundamentalsParams, FundamentalsResponse, MarketType,
    WatchlistSnapshot, WatchlistSnapshotParams,
};
use crate::ta_engine;

#[tauri::command]
pub async fn fetch_analysis(
    params: AnalysisParams,
    binance_client: State<'_, BinanceClient>,
    yahoo_client: State<'_, YahooClient>,
    cache: State<'_, CacheDb>,
) -> Result<AnalysisResponse, String> {
    let market_prefix = match params.market {
        MarketType::Crypto => "crypto",
        MarketType::Forex => "fx",
        MarketType::UsStock => "us",
        MarketType::KrStock => "kr",
    };
    let cache_key_symbol = format!("{}:{}", market_prefix, params.symbol);

    // Check cache first
    if let Some(cached_candles) = cache.get(&cache_key_symbol, &params.interval) {
        let response = ta_engine::analyze(&cached_candles, &params);
        return Ok(response);
    }

    // Fetch from appropriate API
    let candles = match params.market {
        MarketType::Crypto => {
            binance_client
                .fetch_klines(&params.symbol, &params.interval, 500)
                .await?
        }
        MarketType::Forex | MarketType::UsStock | MarketType::KrStock => {
            yahoo_client
                .fetch_klines(&params.symbol, &params.interval, 500)
                .await?
        }
    };

    // Store in cache
    let _ = cache.set(&cache_key_symbol, &params.interval, &candles);

    // Run analysis
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

    for item in params.items.iter().take(24) {
        let market_prefix = match item.market {
            MarketType::Crypto => "crypto",
            MarketType::Forex => "fx",
            MarketType::UsStock => "us",
            MarketType::KrStock => "kr",
        };
        let cache_key_symbol = format!("{}:{}", market_prefix, item.symbol);

        let candles = if let Some(cached) = cache.get(&cache_key_symbol, &interval) {
            cached
        } else {
            let fetched_result = match item.market {
                MarketType::Crypto => {
                    binance_client
                        .fetch_klines(&item.symbol, &interval, limit as u32)
                        .await
                }
                MarketType::Forex | MarketType::UsStock | MarketType::KrStock => {
                    yahoo_client
                        .fetch_klines(&item.symbol, &interval, limit as u32)
                        .await
                }
            };
            let fetched = match fetched_result {
                Ok(candles) => candles,
                Err(_) => continue,
            };
            let _ = cache.set(&cache_key_symbol, &interval, &fetched);
            fetched
        };

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
