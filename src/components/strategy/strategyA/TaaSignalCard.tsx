import type { TaaAssetSignal } from "@/utils/strategyA/taaStrategy";

interface TaaSignalCardProps {
  signals: TaaAssetSignal[];
}

export default function TaaSignalCard({ signals }: TaaSignalCardProps) {
  if (signals.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3">
      <div className="ds-type-caption font-semibold text-[var(--primary)] mb-2">
        TAA 자산 SMA 필터
      </div>
      <div className="space-y-1.5">
        {signals.map((s) => (
          <div key={s.asset} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono ds-type-label font-semibold text-[var(--foreground)]">
                {s.asset}
              </span>
              <span className="ds-type-caption text-[var(--muted-foreground)]">
                ${s.price.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="ds-type-caption text-[var(--muted-foreground)]">
                SMA₁₀ ${s.sma10.toFixed(2)}
              </span>
              <span
                className="ds-type-caption font-semibold rounded px-1.5 py-0.5"
                style={{
                  background: s.invested ? "var(--success)" : "var(--secondary)",
                  color: s.invested ? "white" : "var(--muted-foreground)",
                  border: s.invested ? "none" : "1px solid var(--border)",
                }}
              >
                {s.invested ? "투자" : "캐시"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
