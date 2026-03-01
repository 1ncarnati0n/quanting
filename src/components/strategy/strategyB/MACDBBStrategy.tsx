import { useCallback, useState } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useStrategyStore } from "@/stores/useStrategyStore";
import { fetchAnalysis } from "@/services/tauriApi";
import { buildAnalysisParams } from "@/utils/analysisParams";
import { detectMACDBBSignals } from "@/utils/strategyB/macdBBSignals";
import { Button } from "@/components/ui/button";
import SignalDashboard from "./SignalDashboard";

export default function MACDBBStrategy() {
  const symbol = useSettingsStore((s) => s.symbol);
  const interval = useSettingsStore((s) => s.interval);
  const market = useSettingsStore((s) => s.market);
  const indicators = useSettingsStore((s) => s.indicators);
  const signals = useStrategyStore((s) => s.macdbbSignals);
  const setSignals = useStrategyStore((s) => s.setMacdbbSignals);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedSymbol, setScannedSymbol] = useState<string | null>(null);

  const handleScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Force-enable BB and MACD for the scan
      const params = buildAnalysisParams({
        symbol,
        interval,
        market,
        indicators: {
          ...indicators,
          bb: { ...indicators.bb, enabled: true },
          macd: { ...indicators.macd, enabled: true },
          rsi: { ...indicators.rsi, enabled: true },
        },
      });

      const data = await fetchAnalysis(params);
      const detected = detectMACDBBSignals(data);
      setSignals(detected);
      setScannedSymbol(symbol);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, market, indicators, setSignals]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="ds-type-label font-semibold text-[var(--foreground)]">
          MACD + Bollinger Bands Mean Reversion
        </h3>
        <p className="ds-type-caption text-[var(--muted-foreground)] mt-0.5">
          BB 하단 접촉 + MACD 크로스 + 거래량 급증 조건이 동시 충족되면 매수 신호 생성
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5">
          <span className="ds-type-caption text-[var(--muted-foreground)]">종목</span>
          <span className="font-mono ds-type-label font-bold text-[var(--foreground)]">
            {symbol}
          </span>
          <span className="ds-type-caption text-[var(--muted-foreground)]">({interval})</span>
        </div>

        <Button size="sm" onClick={handleScan} disabled={loading} className="h-8">
          {loading ? "스캔 중..." : "신호 스캔"}
        </Button>

        <div className="ds-type-caption text-[var(--muted-foreground)]">
          매수: BB하단 + MACD골든크로스 + 거래량 1.2x + RSI&lt;30(강)
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--destructive)] p-2">
          <span className="ds-type-caption text-[var(--destructive)]">{error}</span>
        </div>
      )}

      {scannedSymbol && (
        <div className="ds-type-caption text-[var(--muted-foreground)]">
          {scannedSymbol} 스캔 결과:
        </div>
      )}

      <SignalDashboard signals={signals} />
    </div>
  );
}
