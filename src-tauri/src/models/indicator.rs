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

// VWAP
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VwapPoint {
    pub time: i64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VwapResult {
    pub data: Vec<VwapPoint>,
}

// ATR
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AtrPoint {
    pub time: i64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AtrResult {
    pub period: usize,
    pub data: Vec<AtrPoint>,
}

// Ichimoku
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IchimokuPoint {
    pub time: i64,
    pub conversion: Option<f64>,
    pub base: Option<f64>,
    pub span_a: Option<f64>,
    pub span_b: Option<f64>,
    pub lagging: Option<f64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IchimokuResult {
    pub data: Vec<IchimokuPoint>,
}

// Supertrend
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SupertrendPoint {
    pub time: i64,
    pub value: f64,
    pub direction: i8,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SupertrendResult {
    pub period: usize,
    pub multiplier: f64,
    pub data: Vec<SupertrendPoint>,
}

// Parabolic SAR
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParabolicSarPoint {
    pub time: i64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParabolicSarResult {
    pub step: f64,
    pub max_step: f64,
    pub data: Vec<ParabolicSarPoint>,
}
