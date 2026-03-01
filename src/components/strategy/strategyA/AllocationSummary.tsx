import type { BacktestResult } from "@/stores/useStrategyStore";

interface AllocationSummaryProps {
  allocation: NonNullable<BacktestResult["currentAllocation"]>;
}

export default function AllocationSummary({ allocation }: AllocationSummaryProps) {
  return (
    <div className="space-y-3">
      <h3 className="ds-type-label font-semibold text-[var(--foreground)]">
        현재 월 추천 배분
      </h3>

      <div className="grid gap-2 sm:grid-cols-3">
        {/* GEM */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3">
          <div className="ds-type-caption font-semibold text-[var(--primary)]">
            GEM ({(allocation.gem.weight * 100).toFixed(0)}%)
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-[var(--foreground)]">
            {allocation.gem.asset}
          </div>
        </div>

        {/* TAA */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3">
          <div className="ds-type-caption font-semibold text-[var(--primary)]">
            TAA ({(allocation.taa.reduce((s, a) => s + a.weight, 0) * 100).toFixed(0)}%)
          </div>
          <div className="mt-1 space-y-0.5">
            {allocation.taa.map((a) => (
              <div key={a.asset} className="flex items-center justify-between">
                <span className="font-mono ds-type-caption text-[var(--foreground)]">{a.asset}</span>
                <span
                  className="ds-type-caption font-semibold"
                  style={{ color: a.invested ? "var(--success)" : "var(--muted-foreground)" }}
                >
                  {a.invested ? "투자" : "캐시"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sector */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3">
          <div className="ds-type-caption font-semibold text-[var(--primary)]">
            Sector ({(allocation.sectors.reduce((s, a) => s + a.weight, 0) * 100).toFixed(0)}%)
          </div>
          <div className="mt-1 space-y-0.5">
            {allocation.sectors.length > 0 ? (
              allocation.sectors.map((s) => (
                <div key={s.asset} className="flex items-center justify-between">
                  <span className="font-mono ds-type-caption text-[var(--foreground)]">{s.asset}</span>
                  <span className="ds-type-caption text-[var(--muted-foreground)]">#{s.rank}</span>
                </div>
              ))
            ) : (
              <span className="ds-type-caption text-[var(--muted-foreground)]">캐시 (조건 미충족)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
