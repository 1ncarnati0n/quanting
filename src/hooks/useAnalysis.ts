import { useEffect } from "react";
import { useChartStore } from "../stores/useChartStore";
import { useSettingsStore } from "../stores/useSettingsStore";

export function useAnalysis() {
  const { data, isLoading, error, fetchData } = useChartStore();
  const { symbol, interval, market, indicators } = useSettingsStore();

  useEffect(() => {
    fetchData({
      symbol,
      interval,
      bbPeriod: indicators.bb.period,
      bbMultiplier: indicators.bb.multiplier,
      rsiPeriod: indicators.rsi.period,
      market,
      smaPeriods: indicators.sma.enabled ? indicators.sma.periods : [],
      emaPeriods: indicators.ema.enabled ? indicators.ema.periods : [],
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
      showVolume: indicators.volume.enabled,
      showObv: indicators.obv.enabled,
      signalFilter: indicators.signalFilter,
    });
  }, [symbol, interval, market, indicators, fetchData]);

  return { data, isLoading, error };
}
