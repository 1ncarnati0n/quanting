use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum MarketType {
    Crypto,
    Forex,
    #[default]
    UsStock,
    KrStock,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MacdParams {
    #[serde(default = "default_macd_fast")]
    pub fast_period: usize,
    #[serde(default = "default_macd_slow")]
    pub slow_period: usize,
    #[serde(default = "default_macd_signal")]
    pub signal_period: usize,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StochasticParams {
    #[serde(default = "default_stoch_k")]
    pub k_period: usize,
    #[serde(default = "default_stoch_d")]
    pub d_period: usize,
    #[serde(default = "default_stoch_smooth")]
    pub smooth: usize,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignalFilterParams {
    #[serde(default = "default_signal_filter_enabled")]
    pub enabled: bool,
    #[serde(default = "default_apply_regime_filter")]
    pub apply_regime_filter: bool,
    #[serde(default = "default_apply_momentum_filter")]
    pub apply_momentum_filter: bool,
    #[serde(default = "default_apply_volatility_filter")]
    pub apply_volatility_filter: bool,
    #[serde(default = "default_regime_period")]
    pub regime_period: usize,
    #[serde(default = "default_regime_buffer")]
    pub regime_buffer: f64,
    #[serde(default = "default_momentum_period")]
    pub momentum_period: usize,
    #[serde(default = "default_min_momentum_for_buy")]
    pub min_momentum_for_buy: f64,
    #[serde(default = "default_max_momentum_for_sell")]
    pub max_momentum_for_sell: f64,
    #[serde(default = "default_volatility_period")]
    pub volatility_period: usize,
    #[serde(default = "default_volatility_rank_period")]
    pub volatility_rank_period: usize,
    #[serde(default = "default_high_vol_percentile")]
    pub high_vol_percentile: f64,
    #[serde(default = "default_keep_strong_counter_trend")]
    pub keep_strong_counter_trend: bool,
    #[serde(default = "default_keep_strong_in_high_vol")]
    pub keep_strong_in_high_vol: bool,
}

impl Default for SignalFilterParams {
    fn default() -> Self {
        Self {
            enabled: default_signal_filter_enabled(),
            apply_regime_filter: default_apply_regime_filter(),
            apply_momentum_filter: default_apply_momentum_filter(),
            apply_volatility_filter: default_apply_volatility_filter(),
            regime_period: default_regime_period(),
            regime_buffer: default_regime_buffer(),
            momentum_period: default_momentum_period(),
            min_momentum_for_buy: default_min_momentum_for_buy(),
            max_momentum_for_sell: default_max_momentum_for_sell(),
            volatility_period: default_volatility_period(),
            volatility_rank_period: default_volatility_rank_period(),
            high_vol_percentile: default_high_vol_percentile(),
            keep_strong_counter_trend: default_keep_strong_counter_trend(),
            keep_strong_in_high_vol: default_keep_strong_in_high_vol(),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DonchianParams {
    #[serde(default = "default_donchian_period")]
    pub period: usize,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeltnerParams {
    #[serde(default = "default_keltner_ema_period")]
    pub ema_period: usize,
    #[serde(default = "default_keltner_atr_period")]
    pub atr_period: usize,
    #[serde(default = "default_keltner_atr_multiplier")]
    pub atr_multiplier: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MfiParams {
    #[serde(default = "default_mfi_period")]
    pub period: usize,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CmfParams {
    #[serde(default = "default_cmf_period")]
    pub period: usize,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChoppinessParams {
    #[serde(default = "default_choppiness_period")]
    pub period: usize,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WillrParams {
    #[serde(default = "default_willr_period")]
    pub period: usize,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdxParams {
    #[serde(default = "default_adx_period")]
    pub period: usize,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StcParams {
    #[serde(default = "default_stc_tc_len")]
    pub tc_len: usize,
    #[serde(default = "default_stc_fast_ma")]
    pub fast_ma: usize,
    #[serde(default = "default_stc_slow_ma")]
    pub slow_ma: usize,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SmcParams {
    #[serde(default = "default_smc_swing_length")]
    pub swing_length: usize,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnchoredVwapParams {
    pub anchor_time: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoFibParams {
    #[serde(default = "default_auto_fib_lookback")]
    pub lookback: usize,
    #[serde(default = "default_auto_fib_swing_length")]
    pub swing_length: usize,
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
    #[serde(default)]
    pub sma_periods: Vec<usize>,
    #[serde(default)]
    pub ema_periods: Vec<usize>,
    #[serde(default)]
    pub hma_periods: Vec<usize>,
    #[serde(default)]
    pub macd: Option<MacdParams>,
    #[serde(default)]
    pub stochastic: Option<StochasticParams>,
    #[serde(default)]
    #[allow(dead_code)]
    pub show_volume: bool,
    #[serde(default)]
    pub show_obv: bool,
    #[serde(default)]
    pub show_cvd: bool,
    #[serde(default)]
    pub donchian: Option<DonchianParams>,
    #[serde(default)]
    pub keltner: Option<KeltnerParams>,
    #[serde(default)]
    pub mfi: Option<MfiParams>,
    #[serde(default)]
    pub cmf: Option<CmfParams>,
    #[serde(default)]
    pub choppiness: Option<ChoppinessParams>,
    #[serde(default)]
    pub williams_r: Option<WillrParams>,
    #[serde(default)]
    pub adx: Option<AdxParams>,
    #[serde(default)]
    pub stc: Option<StcParams>,
    #[serde(default)]
    pub smc: Option<SmcParams>,
    #[serde(default)]
    pub anchored_vwap: Option<AnchoredVwapParams>,
    #[serde(default)]
    pub auto_fib: Option<AutoFibParams>,
    #[serde(default)]
    pub signal_filter: SignalFilterParams,
}

fn default_bb_period() -> usize {
    20
}
fn default_bb_multiplier() -> f64 {
    2.0
}
fn default_rsi_period() -> usize {
    14
}
fn default_macd_fast() -> usize {
    12
}
fn default_macd_slow() -> usize {
    26
}
fn default_macd_signal() -> usize {
    9
}
fn default_stoch_k() -> usize {
    14
}
fn default_stoch_d() -> usize {
    3
}
fn default_stoch_smooth() -> usize {
    3
}
fn default_signal_filter_enabled() -> bool {
    true
}
fn default_apply_regime_filter() -> bool {
    true
}
fn default_apply_momentum_filter() -> bool {
    true
}
fn default_apply_volatility_filter() -> bool {
    true
}
fn default_regime_period() -> usize {
    200
}
fn default_regime_buffer() -> f64 {
    0.002
}
fn default_momentum_period() -> usize {
    63
}
fn default_min_momentum_for_buy() -> f64 {
    -0.05
}
fn default_max_momentum_for_sell() -> f64 {
    0.05
}
fn default_volatility_period() -> usize {
    20
}
fn default_volatility_rank_period() -> usize {
    120
}
fn default_high_vol_percentile() -> f64 {
    0.90
}
fn default_keep_strong_counter_trend() -> bool {
    true
}
fn default_keep_strong_in_high_vol() -> bool {
    true
}
fn default_donchian_period() -> usize {
    20
}
fn default_keltner_ema_period() -> usize {
    20
}
fn default_keltner_atr_period() -> usize {
    10
}
fn default_keltner_atr_multiplier() -> f64 {
    2.0
}
fn default_mfi_period() -> usize {
    14
}
fn default_cmf_period() -> usize {
    20
}
fn default_choppiness_period() -> usize {
    14
}
fn default_willr_period() -> usize {
    14
}
fn default_adx_period() -> usize {
    14
}
fn default_stc_tc_len() -> usize {
    10
}
fn default_stc_fast_ma() -> usize {
    23
}
fn default_stc_slow_ma() -> usize {
    50
}
fn default_smc_swing_length() -> usize {
    5
}
fn default_auto_fib_lookback() -> usize {
    120
}
fn default_auto_fib_swing_length() -> usize {
    5
}
