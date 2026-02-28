use serde::Serialize;

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum SignalType {
    StrongBuy,
    WeakBuy,
    StrongSell,
    WeakSell,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignalPoint {
    pub time: i64,
    pub signal_type: SignalType,
    pub price: f64,
    pub rsi: f64,
}
