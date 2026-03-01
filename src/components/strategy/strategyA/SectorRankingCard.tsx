import type { SectorRanking } from "@/utils/strategyA/sectorTimingStrategy";

interface SectorRankingCardProps {
  rankings: SectorRanking[];
}

export default function SectorRankingCard({ rankings }: SectorRankingCardProps) {
  if (rankings.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3">
      <div className="ds-type-caption font-semibold text-[var(--primary)] mb-2">
        섹터 ETF 순위 (12개월 수익률)
      </div>
      <div className="space-y-1">
        {rankings.map((r) => (
          <div
            key={r.asset}
            className="flex items-center justify-between rounded px-1.5 py-0.5"
            style={{
              background: r.selected ? "color-mix(in srgb, var(--success) 10%, transparent)" : "transparent",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="ds-type-caption font-mono text-[var(--muted-foreground)] w-5 text-right">
                #{r.rank}
              </span>
              <span className="font-mono ds-type-label font-semibold text-[var(--foreground)]">
                {r.asset}
              </span>
              {r.selected && (
                <span className="ds-type-caption rounded bg-[var(--success)] px-1 py-0.5 text-white font-semibold">
                  선택
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="font-mono ds-type-caption font-semibold"
                style={{ color: r.return12m >= 0 ? "var(--success)" : "var(--destructive)" }}
              >
                {(r.return12m * 100).toFixed(1)}%
              </span>
              <span
                className="ds-type-caption"
                style={{ color: r.aboveSma ? "var(--success)" : "var(--muted-foreground)" }}
              >
                {r.aboveSma ? ">SMA" : "<SMA"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
