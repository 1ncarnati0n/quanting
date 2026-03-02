use serde::{Deserialize, Serialize};

use super::MarketType;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SymbolSearchParams {
    pub query: String,
    pub market_filter: Option<MarketType>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SymbolSearchResult {
    pub symbol: String,
    pub label: String,
    pub market: MarketType,
    pub exchange: String,
}
