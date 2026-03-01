import { useCallback, useEffect, useState } from "react";
import { useStrategyStore } from "@/stores/useStrategyStore";
import { fetchMultiSymbolCandles } from "@/services/tauriApi";
import { getUniqueSymbols, runBacktest } from "@/utils/strategyA/backtestEngine";
import { computeGemSignal } from "@/utils/strategyA/gemStrategy";
import { computeTaaSignals } from "@/utils/strategyA/taaStrategy";
import { computeSectorRankings } from "@/utils/strategyA/sectorTimingStrategy";
import BacktestConfig from "./BacktestConfig";
import BacktestMetrics from "./BacktestMetrics";
import EquityCurveChart from "./EquityCurveChart";
import AllocationSummary from "./AllocationSummary";
import GemSignalCard from "./GemSignalCard";
import TaaSignalCard from "./TaaSignalCard";
import SectorRankingCard from "./SectorRankingCard";
import type { Candle } from "@/types";
import type { GemSignal } from "@/utils/strategyA/gemStrategy";
import type { TaaAssetSignal } from "@/utils/strategyA/taaStrategy";
import type { SectorRanking } from "@/utils/strategyA/sectorTimingStrategy";

export default function StrategyAPanel() {
  const config = useStrategyStore((s) => s.strategyAConfig);
  const result = useStrategyStore((s) => s.backtestResult);
  const status = useStrategyStore((s) => s.backtestStatus);
  const error = useStrategyStore((s) => s.backtestError);
  const setResult = useStrategyStore((s) => s.setBacktestResult);
  const setStatus = useStrategyStore((s) => s.setBacktestStatus);

  const [allCandles, setAllCandles] = useState<Record<string, Candle[]> | null>(null);
  const [gemSignal, setGemSignal] = useState<GemSignal | null>(null);
  const [taaSignals, setTaaSignals] = useState<TaaAssetSignal[]>([]);
  const [sectorRankings, setSectorRankings] = useState<SectorRanking[]>([]);

  const handleRun = useCallback(async () => {
    setStatus("loading");
    try {
      const symbols = getUniqueSymbols();
      const resp = await fetchMultiSymbolCandles({
        symbols,
        interval: "1mo",
        limit: 300,
      });

      if (Object.keys(resp.data).length === 0) {
        setStatus("error", "데이터를 가져오지 못했습니다.");
        return;
      }

      setAllCandles(resp.data);

      // Run backtest
      const btResult = runBacktest(resp.data, config);
      setResult(btResult);

      // Compute current signals
      const spy = resp.data["SPY"] ?? [];
      const veu = resp.data["VEU"] ?? [];
      const agg = resp.data["AGG"] ?? [];
      const bil = resp.data["BIL"] ?? [];
      setGemSignal(computeGemSignal(spy, veu, agg, bil));
      setTaaSignals(computeTaaSignals(resp.data));
      setSectorRankings(computeSectorRankings(resp.data));

      setStatus("done");
    } catch (e) {
      setStatus("error", e instanceof Error ? e.message : String(e));
    }
  }, [config, setResult, setStatus]);

  // Re-run backtest when config changes if we already have data
  useEffect(() => {
    if (!allCandles || status !== "done") return;
    const btResult = runBacktest(allCandles, config);
    setResult(btResult);
  }, [config.startYear, config.initialCapital, config.gemWeight, config.taaWeight, config.sectorWeight]);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="ds-type-title font-bold text-[var(--foreground)]">
          Strategy A — 월간 포트폴리오 리밸런싱
        </h2>
        <p className="ds-type-caption text-[var(--muted-foreground)] mt-1">
          GEM(40%) + Faber TAA(40%) + Sector Timing(20%) 합성 전략 백테스트
        </p>
      </div>

      <BacktestConfig onRun={handleRun} isLoading={status === "loading"} />

      {status === "error" && (
        <div className="rounded-lg border border-[var(--destructive)] bg-[color-mix(in_srgb,var(--destructive)_10%,transparent)] p-3">
          <span className="ds-type-label text-[var(--destructive)]">{error}</span>
        </div>
      )}

      {result && status === "done" && (
        <>
          <BacktestMetrics result={result} />
          <EquityCurveChart data={result.equityCurve} />

          {result.currentAllocation && (
            <AllocationSummary allocation={result.currentAllocation} />
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <GemSignalCard signal={gemSignal} />
            <TaaSignalCard signals={taaSignals} />
            <SectorRankingCard rankings={sectorRankings} />
          </div>
        </>
      )}

      {status === "idle" && (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-[var(--border)]">
          <span className="ds-type-body text-[var(--muted-foreground)]">
            "백테스트 실행" 버튼을 눌러 시작하세요
          </span>
        </div>
      )}
    </div>
  );
}
