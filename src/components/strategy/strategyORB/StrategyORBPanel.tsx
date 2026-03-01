import { useCallback, useState } from "react";
import { useStrategyStore } from "@/stores/useStrategyStore";
import { fetchPremarketSnapshots } from "@/services/tauriApi";
import { filterStocksInPlay } from "@/utils/strategyORB/orbLogic";
import { Button } from "@/components/ui/button";
import ORBSettings from "./ORBSettings";
import PremarketScreener from "./PremarketScreener";
import ORBSignalList from "./ORBSignalList";

const DEFAULT_SCAN_SYMBOLS = [
  "AAPL", "TSLA", "NVDA", "AMD", "AMZN", "META", "GOOGL", "MSFT",
  "NFLX", "COIN", "MARA", "RIOT", "PLTR", "SOFI", "NIO", "BABA",
];

export default function StrategyORBPanel() {
  const config = useStrategyStore((s) => s.orbConfig);
  const premarketStocks = useStrategyStore((s) => s.premarketStocks);
  const setPremarketStocks = useStrategyStore((s) => s.setPremarketStocks);
  const orbSignals = useStrategyStore((s) => s.orbSignals);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshots = await fetchPremarketSnapshots({
        symbols: DEFAULT_SCAN_SYMBOLS,
      });

      const filtered = filterStocksInPlay(snapshots, config);
      setPremarketStocks(filtered);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [config, setPremarketStocks]);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="ds-type-title font-bold text-[var(--foreground)]">
          Strategy ORB — 시가 범위 돌파
        </h2>
        <p className="ds-type-caption text-[var(--muted-foreground)] mt-1">
          Opening Range Breakout: 장 시작 첫 {config.rangeMinutes}분 범위를 설정하고 돌파를 감지합니다
        </p>
      </div>

      <ORBSettings />

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleScan} disabled={loading} className="h-8">
          {loading ? "스캔 중..." : "프리마켓 스캔"}
        </Button>
        <span className="ds-type-caption text-[var(--muted-foreground)]">
          RVOL ≥ {config.rvolThreshold}x · 변동 ≥ ±{config.premarketChangeThreshold}%
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--destructive)] p-2">
          <span className="ds-type-caption text-[var(--destructive)]">{error}</span>
        </div>
      )}

      <div>
        <h3 className="ds-type-label font-semibold text-[var(--foreground)] mb-2">
          Stocks in Play
        </h3>
        <PremarketScreener stocks={premarketStocks} />
      </div>

      <div>
        <h3 className="ds-type-label font-semibold text-[var(--foreground)] mb-2">
          돌파 신호
        </h3>
        <ORBSignalList signals={orbSignals} />
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3">
        <div className="ds-type-caption font-semibold text-[var(--primary)] mb-1">ORB 규칙</div>
        <div className="ds-type-caption text-[var(--muted-foreground)] space-y-0.5">
          <p>• 롱: 1분봉 종가 &gt; Range High {config.useVwapFilter && "+ 가격 > VWAP"}</p>
          <p>• 숏: 1분봉 종가 &lt; Range Low {config.useVwapFilter && "+ 가격 < VWAP"}</p>
          <p>• T1: 레인지 폭만큼 (50% 청산) · T2: 1.5배 (25% 청산)</p>
          <p>• 스톱: Range 반대편 - $0.02</p>
        </div>
      </div>
    </div>
  );
}
