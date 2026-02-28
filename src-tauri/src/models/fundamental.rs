use serde::{Deserialize, Serialize};

use super::MarketType;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FundamentalsParams {
    pub symbol: String,
    #[serde(default)]
    pub market: MarketType,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FundamentalsResponse {
    pub symbol: String,
    pub market: MarketType,
    pub short_name: Option<String>,
    pub currency: Option<String>,
    pub market_cap: Option<f64>,
    pub trailing_pe: Option<f64>,
    pub forward_pe: Option<f64>,
    pub price_to_book: Option<f64>,
    pub trailing_eps: Option<f64>,
    pub forward_eps: Option<f64>,
    pub dividend_yield: Option<f64>,
    pub return_on_equity: Option<f64>,
    pub debt_to_equity: Option<f64>,
    pub revenue_growth: Option<f64>,
    pub gross_margins: Option<f64>,
    pub operating_margins: Option<f64>,
    pub profit_margins: Option<f64>,
    pub fifty_two_week_high: Option<f64>,
    pub fifty_two_week_low: Option<f64>,
    pub average_volume: Option<f64>,
}
