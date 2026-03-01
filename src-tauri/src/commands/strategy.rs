use std::collections::HashMap;
use tauri::State;

use crate::api_client::YahooClient;
use crate::cache::CacheDb;
use crate::models::{
    MultiSymbolCandlesParams, MultiSymbolCandlesResponse, PremarketSnapshot,
    PremarketSnapshotParams,
};

const MAX_STRATEGY_SYMBOLS: usize = 30;

#[tauri::command]
pub async fn fetch_multi_symbol_candles(
    params: MultiSymbolCandlesParams,
    yahoo_client: State<'_, YahooClient>,
    cache: State<'_, CacheDb>,
) -> Result<MultiSymbolCandlesResponse, String> {
    let interval = if params.interval.trim().is_empty() {
        "1mo".to_string()
    } else {
        params.interval.clone()
    };

    let yahoo_interval = match interval.as_str() {
        "1mo" | "1M" => "1mo",
        "1w" | "1wk" => "1wk",
        "1d" => "1d",
        other => other,
    };

    let limit = params.limit.clamp(50, 600);
    let mut data: HashMap<String, Vec<crate::models::Candle>> = HashMap::new();
    let mut errors: HashMap<String, String> = HashMap::new();

    for symbol in params.symbols.iter().take(MAX_STRATEGY_SYMBOLS) {
        let cache_key = format!("us:{}", symbol);

        if let Some(cached) = cache.get(&cache_key, yahoo_interval) {
            data.insert(symbol.clone(), cached);
            continue;
        }

        match yahoo_client.fetch_klines(symbol, yahoo_interval, limit).await {
            Ok(candles) => {
                let _ = cache.set(&cache_key, yahoo_interval, &candles);
                data.insert(symbol.clone(), candles);
            }
            Err(e) => {
                errors.insert(symbol.clone(), e);
            }
        }
    }

    Ok(MultiSymbolCandlesResponse { data, errors })
}

#[tauri::command]
pub async fn fetch_premarket_snapshots(
    params: PremarketSnapshotParams,
    yahoo_client: State<'_, YahooClient>,
) -> Result<Vec<PremarketSnapshot>, String> {
    let mut snapshots = Vec::new();

    for symbol in params.symbols.iter().take(MAX_STRATEGY_SYMBOLS) {
        match yahoo_client.fetch_premarket(symbol).await {
            Ok(snap) => snapshots.push(snap),
            Err(_) => {
                snapshots.push(PremarketSnapshot {
                    symbol: symbol.clone(),
                    pre_market_price: None,
                    pre_market_change: None,
                    pre_market_volume: None,
                    regular_market_price: None,
                    regular_market_volume: None,
                });
            }
        }
    }

    Ok(snapshots)
}
