use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::Candle;

fn default_interval() -> String {
    "1mo".to_string()
}

fn default_limit() -> u32 {
    300
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MultiSymbolCandlesParams {
    pub symbols: Vec<String>,
    #[serde(default = "default_interval")]
    pub interval: String,
    #[serde(default = "default_limit")]
    pub limit: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MultiSymbolCandlesResponse {
    pub data: HashMap<String, Vec<Candle>>,
    pub errors: HashMap<String, String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PremarketSnapshotParams {
    pub symbols: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PremarketSnapshot {
    pub symbol: String,
    pub pre_market_price: Option<f64>,
    pub pre_market_change: Option<f64>,
    pub pre_market_volume: Option<f64>,
    pub regular_market_price: Option<f64>,
    pub regular_market_volume: Option<f64>,
}
