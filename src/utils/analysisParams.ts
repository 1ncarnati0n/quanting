import type { AnalysisParams, MarketType } from "../types";
import type { IndicatorConfig } from "../stores/useSettingsStore";

interface BuildAnalysisParamsInput {
  symbol: string;
  interval: string;
  market: MarketType;
  indicators: IndicatorConfig;
}

export function buildAnalysisParams({
  symbol,
  interval,
  market,
  indicators,
}: BuildAnalysisParamsInput): AnalysisParams {
  return {
    symbol,
    interval,
    market,
    bbPeriod: indicators.bb.period,
    bbMultiplier: indicators.bb.multiplier,
    rsiPeriod: indicators.rsi.period,
    smaPeriods: indicators.sma.enabled ? indicators.sma.periods : [],
    emaPeriods: indicators.ema.enabled ? indicators.ema.periods : [],
    hmaPeriods: indicators.hma.enabled ? indicators.hma.periods : [],
    macd: indicators.macd.enabled
      ? {
          fastPeriod: indicators.macd.fastPeriod,
          slowPeriod: indicators.macd.slowPeriod,
          signalPeriod: indicators.macd.signalPeriod,
        }
      : null,
    stochastic: indicators.stochastic.enabled
      ? {
          kPeriod: indicators.stochastic.kPeriod,
          dPeriod: indicators.stochastic.dPeriod,
          smooth: indicators.stochastic.smooth,
        }
      : null,
    showObv: indicators.obv.enabled,
    showCvd: indicators.cvd.enabled,
    donchian: indicators.donchian.enabled
      ? { period: indicators.donchian.period }
      : null,
    keltner: indicators.keltner.enabled
      ? {
          emaPeriod: indicators.keltner.emaPeriod,
          atrPeriod: indicators.keltner.atrPeriod,
          atrMultiplier: indicators.keltner.atrMultiplier,
        }
      : null,
    mfi: indicators.mfi.enabled ? { period: indicators.mfi.period } : null,
    cmf: indicators.cmf.enabled ? { period: indicators.cmf.period } : null,
    choppiness: indicators.choppiness.enabled
      ? { period: indicators.choppiness.period }
      : null,
    williamsR: indicators.williamsR.enabled
      ? { period: indicators.williamsR.period }
      : null,
    adx: indicators.adx.enabled ? { period: indicators.adx.period } : null,
    stc: indicators.stc.enabled
      ? {
          tcLen: indicators.stc.tcLen,
          fastMa: indicators.stc.fastMa,
          slowMa: indicators.stc.slowMa,
        }
      : null,
    smc: indicators.smc.enabled
      ? { swingLength: indicators.smc.swingLength }
      : null,
    anchoredVwap:
      indicators.anchoredVwap.enabled && indicators.anchoredVwap.anchorTime
        ? { anchorTime: indicators.anchoredVwap.anchorTime }
        : null,
    autoFib: indicators.autoFib.enabled
      ? {
          lookback: indicators.autoFib.lookback,
          swingLength: indicators.autoFib.swingLength,
        }
      : null,
    signalStrategies: indicators.signalStrategies,
  };
}
