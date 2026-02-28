use tauri::State;

use crate::api_client::{BinanceClient, YahooClient};
use crate::cache::CacheDb;
use crate::models::{AnalysisParams, AnalysisResponse, MarketType};
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
        MarketType::UsStock | MarketType::KrStock => {
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
