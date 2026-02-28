import { useEffect } from "react";
import { useChartStore } from "../stores/useChartStore";
import { useSettingsStore } from "../stores/useSettingsStore";

export function useAnalysis() {
  const { data, isLoading, error, fetchData } = useChartStore();
  const { symbol, interval, bbPeriod, bbMultiplier, rsiPeriod, market } =
    useSettingsStore();

  useEffect(() => {
    fetchData({ symbol, interval, bbPeriod, bbMultiplier, rsiPeriod, market });
  }, [symbol, interval, bbPeriod, bbMultiplier, rsiPeriod, market, fetchData]);

  return { data, isLoading, error };
}
