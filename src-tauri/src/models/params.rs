use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum MarketType {
    Crypto,
    #[default]
    UsStock,
    KrStock,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisParams {
    pub symbol: String,
    pub interval: String,
    #[serde(default = "default_bb_period")]
    pub bb_period: usize,
    #[serde(default = "default_bb_multiplier")]
    pub bb_multiplier: f64,
    #[serde(default = "default_rsi_period")]
    pub rsi_period: usize,
    #[serde(default)]
    pub market: MarketType,
}

fn default_bb_period() -> usize { 20 }
fn default_bb_multiplier() -> f64 { 2.0 }
fn default_rsi_period() -> usize { 14 }
