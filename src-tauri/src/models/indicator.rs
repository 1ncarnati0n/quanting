use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BollingerBandsPoint {
    pub time: i64,
    pub upper: f64,
    pub middle: f64,
    pub lower: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RsiPoint {
    pub time: i64,
    pub value: f64,
}
