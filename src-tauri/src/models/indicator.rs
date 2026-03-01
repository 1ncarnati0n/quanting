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

// Donchian Channels
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DonchianPoint {
    pub time: i64,
    pub upper: f64,
    pub middle: f64,
    pub lower: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DonchianResult {
    pub period: usize,
    pub data: Vec<DonchianPoint>,
}

// Keltner Channels
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KeltnerPoint {
    pub time: i64,
    pub upper: f64,
    pub middle: f64,
    pub lower: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KeltnerResult {
    pub ema_period: usize,
    pub atr_period: usize,
    pub atr_multiplier: f64,
    pub data: Vec<KeltnerPoint>,
}

// MFI (Money Flow Index)
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MfiPoint {
    pub time: i64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MfiResult {
    pub period: usize,
    pub data: Vec<MfiPoint>,
}

// CMF (Chaikin Money Flow)
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CmfPoint {
    pub time: i64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CmfResult {
    pub period: usize,
    pub data: Vec<CmfPoint>,
}

// Choppiness Index
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChoppinessPoint {
    pub time: i64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChoppinessResult {
    pub period: usize,
    pub data: Vec<ChoppinessPoint>,
}

// Williams %R
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WillrPoint {
    pub time: i64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WillrResult {
    pub period: usize,
    pub data: Vec<WillrPoint>,
}

// ADX / DI+ / DI-
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdxPoint {
    pub time: i64,
    pub adx: f64,
    pub plus_di: f64,
    pub minus_di: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdxResult {
    pub period: usize,
    pub data: Vec<AdxPoint>,
}

// CVD (Cumulative Volume Delta)
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CvdPoint {
    pub time: i64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CvdResult {
    pub data: Vec<CvdPoint>,
}

// STC (Schaff Trend Cycle)
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StcPoint {
    pub time: i64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StcResult {
    pub tc_len: usize,
    pub fast_ma: usize,
    pub slow_ma: usize,
    pub data: Vec<StcPoint>,
}

// SMC (Smart Money Concepts — BOS/CHoCH)
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SmcEvent {
    pub time: i64,
    pub event_type: String, // "bos_bull", "bos_bear", "choch_bull", "choch_bear"
    pub price: f64,
    pub swing_time: i64,
    pub swing_price: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SmcResult {
    pub data: Vec<SmcEvent>,
}

// Auto Fibonacci Retracement
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoFibLevel {
    pub ratio: f64,
    pub price: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoFibResult {
    pub high_time: i64,
    pub high_price: f64,
    pub low_time: i64,
    pub low_price: f64,
    pub is_uptrend: bool,
    pub levels: Vec<AutoFibLevel>,
}
