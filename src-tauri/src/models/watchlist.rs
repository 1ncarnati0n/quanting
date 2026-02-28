use serde::{Deserialize, Serialize};

use super::MarketType;

fn default_interval() -> String {
    "1d".to_string()
}

fn default_limit() -> u32 {
    96
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchlistItemRequest {
    pub symbol: String,
    pub market: MarketType,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchlistSnapshotParams {
    pub items: Vec<WatchlistItemRequest>,
    #[serde(default = "default_interval")]
    pub interval: String,
    #[serde(default = "default_limit")]
    pub limit: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchlistSnapshot {
    pub symbol: String,
    pub market: MarketType,
    pub last_price: f64,
    pub change: f64,
    pub change_pct: f64,
    pub high: f64,
    pub low: f64,
    pub sparkline: Vec<f64>,
}
