import { useCallback, useState } from "react";
import { useStrategyStore, type PairTradingResult } from "@/stores/useStrategyStore";
import { fetchMultiSymbolCandles } from "@/services/tauriApi";
import {
  ols,
  adfTest,
  computeZScore,
  halfLife as computeHalfLife,
  getZScoreSignal,
} from "@/utils/strategyB/pairCointegration";
import { Button } from "@/components/ui/button";
import PairSelector from "./PairSelector";
import CointegrationResult from "./CointegrationResult";
import ZScoreChart from "./ZScoreChart";

export default function PairTradingPanel() {
  const selectedPair = useStrategyStore((s) => s.selectedPair);
  const setSelectedPair = useStrategyStore((s) => s.setSelectedPair);
  const pairResult = useStrategyStore((s) => s.pairResult);
  const setPairResult = useStrategyStore((s) => s.setPairResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!selectedPair) return;
    setLoading(true);
    setError(null);

    try {
      const resp = await fetchMultiSymbolCandles({
        symbols: [selectedPair.a, selectedPair.b],
        interval: "1d",
        limit: 500,
      });

      const candlesA = resp.data[selectedPair.a];
      const candlesB = resp.data[selectedPair.b];

      if (!candlesA || !candlesB || candlesA.length < 30 || candlesB.length < 30) {
        setError("데이터가 충분하지 않습니다.");
        setLoading(false);
        return;
      }

      // Align by time
      const timeSetB = new Set(candlesB.map((c) => c.time));
      const alignedA: number[] = [];
      const alignedB: number[] = [];
      const alignedTimes: number[] = [];

      for (const ca of candlesA) {
        if (timeSetB.has(ca.time)) {
          const cb = candlesB.find((c) => c.time === ca.time);
          if (cb) {
            alignedA.push(ca.close);
            alignedB.push(cb.close);
            alignedTimes.push(ca.time);
          }
        }
      }

      if (alignedA.length < 30) {
        setError("공통 데이터가 부족합니다.");
        setLoading(false);
        return;
      }

      // OLS: Y = α + β·X → residuals
      const regression = ols(alignedA, alignedB);
      const adf = adfTest(regression.residuals);
      const hl = computeHalfLife(regression.residuals);
      const zScoreWindow = Math.max(20, Math.min(60, Math.round(hl)));
      const zScores = computeZScore(regression.residuals, zScoreWindow);

      // Map z-scores to actual times
      const zScoresWithTime = zScores.map((z) => ({
        time: alignedTimes[z.time] ?? z.time,
        value: z.value,
      }));

      const currentZ = zScores.length > 0 ? zScores[zScores.length - 1].value : 0;
      const signal = getZScoreSignal(currentZ);

      const result: PairTradingResult = {
        pairA: selectedPair.a,
        pairB: selectedPair.b,
        beta: regression.beta,
        alpha: regression.alpha,
        adfStatistic: adf.statistic,
        isCointegrated: adf.isCointegrated,
        halfLife: hl,
        zScores: zScoresWithTime,
        currentZScore: currentZ,
        signal,
      };

      setPairResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [selectedPair, setPairResult]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="ds-type-label font-semibold text-[var(--foreground)]">
          공적분 페어 트레이딩
        </h3>
        <p className="ds-type-caption text-[var(--muted-foreground)] mt-0.5">
          두 종목 간 공적분 관계를 검정하고 Z-Score 기반 매매 신호를 생성합니다
        </p>
      </div>

      <PairSelector selected={selectedPair} onSelect={setSelectedPair} />

      {selectedPair && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5">
            <span className="font-mono ds-type-label font-bold text-[var(--foreground)]">
              {selectedPair.a}
            </span>
            <span className="ds-type-caption text-[var(--muted-foreground)]">/</span>
            <span className="font-mono ds-type-label font-bold text-[var(--foreground)]">
              {selectedPair.b}
            </span>
          </div>
          <Button size="sm" onClick={handleAnalyze} disabled={loading} className="h-8">
            {loading ? "분석 중..." : "공적분 분석"}
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-[var(--destructive)] p-2">
          <span className="ds-type-caption text-[var(--destructive)]">{error}</span>
        </div>
      )}

      {pairResult && (
        <>
          <CointegrationResult result={pairResult} />
          {pairResult.zScores.length > 0 && (
            <ZScoreChart data={pairResult.zScores} />
          )}
        </>
      )}
    </div>
  );
}
