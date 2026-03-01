use serde::Serialize;

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum SignalType {
    StrongBuy,
    WeakBuy,
    StrongSell,
    WeakSell,
    MacdBullish,
    MacdBearish,
    StochOversold,
    StochOverbought,
    // Quant signal strategies
    SupertrendBuy,
    SupertrendSell,
    EmaCrossoverBuy,
    EmaCrossoverSell,
    StochRsiBuy,
    StochRsiSell,
    CmfObvBuy,
    CmfObvSell,
    TtmSqueezeBuy,
    TtmSqueezeSell,
    VwapBreakoutBuy,
    VwapBreakoutSell,
    ParabolicSarBuy,
    ParabolicSarSell,
    MacdHistReversalBuy,
    MacdHistReversalSell,
    IbsMeanRevBuy,
    IbsMeanRevSell,
    RsiDivergenceBuy,
    RsiDivergenceSell,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignalPoint {
    pub time: i64,
    pub signal_type: SignalType,
    pub price: f64,
    pub rsi: f64,
    pub source: String,
}
