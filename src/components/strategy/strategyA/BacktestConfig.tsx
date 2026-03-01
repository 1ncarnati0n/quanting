import { useStrategyStore } from "@/stores/useStrategyStore";
import { Button } from "@/components/ui/button";

interface BacktestConfigProps {
  onRun: () => void;
  isLoading: boolean;
}

export default function BacktestConfig({ onRun, isLoading }: BacktestConfigProps) {
  const config = useStrategyStore((s) => s.strategyAConfig);
  const setConfig = useStrategyStore((s) => s.setStrategyAConfig);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="ds-type-caption font-medium text-[var(--muted-foreground)]">시작연도</span>
        <input
          type="number"
          min={2000}
          max={2025}
          value={config.startYear}
          onChange={(e) => setConfig({ startYear: Number(e.target.value) })}
          className="h-8 w-20 rounded border border-[var(--border)] bg-[var(--secondary)] px-2 font-mono ds-type-label text-[var(--foreground)]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="ds-type-caption font-medium text-[var(--muted-foreground)]">초기자본($)</span>
        <input
          type="number"
          min={1000}
          step={10000}
          value={config.initialCapital}
          onChange={(e) => setConfig({ initialCapital: Number(e.target.value) })}
          className="h-8 w-28 rounded border border-[var(--border)] bg-[var(--secondary)] px-2 font-mono ds-type-label text-[var(--foreground)]"
        />
      </label>

      <div className="flex items-center gap-2">
        <span className="ds-type-caption font-medium text-[var(--muted-foreground)]">가중치</span>
        <span className="ds-type-caption font-mono text-[var(--foreground)]">
          GEM {(config.gemWeight * 100).toFixed(0)}% · TAA {(config.taaWeight * 100).toFixed(0)}% · Sector {(config.sectorWeight * 100).toFixed(0)}%
        </span>
      </div>

      <Button
        size="sm"
        onClick={onRun}
        disabled={isLoading}
        className="h-8"
      >
        {isLoading ? "실행 중..." : "백테스트 실행"}
      </Button>
    </div>
  );
}
