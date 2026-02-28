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

// MA (SMA/EMA) 공용 포인트
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MaPoint {
    pub time: i64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MovingAverageResult {
    pub period: usize,
    pub data: Vec<MaPoint>,
}

// MACD
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MacdPoint {
    pub time: i64,
    pub macd: f64,
    pub signal: f64,
    pub histogram: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MacdResult {
    pub data: Vec<MacdPoint>,
}

// Stochastic
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StochasticPoint {
    pub time: i64,
    pub k: f64,
    pub d: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StochasticResult {
    pub data: Vec<StochasticPoint>,
}

// OBV (On-Balance Volume)
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ObvPoint {
    pub time: i64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ObvResult {
    pub data: Vec<ObvPoint>,
}
