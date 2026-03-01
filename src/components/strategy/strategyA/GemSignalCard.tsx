import type { GemSignal } from "@/utils/strategyA/gemStrategy";

interface GemSignalCardProps {
  signal: GemSignal | null;
}

export default function GemSignalCard({ signal }: GemSignalCardProps) {
  if (!signal) return null;

  const assetColor =
    signal.asset === "SPY"
      ? "var(--success)"
      : signal.asset === "VEU"
        ? "var(--primary)"
        : "var(--warning)";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3">
      <div className="flex items-center justify-between">
        <span className="ds-type-caption font-semibold text-[var(--primary)]">
          GEM 모멘텀 신호
        </span>
        <span className="ds-type-caption text-[var(--muted-foreground)]">{signal.month}</span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-lg font-bold font-mono" style={{ color: assetColor }}>
          {signal.asset}
        </span>
        <span className="ds-type-caption text-[var(--muted-foreground)]">{signal.reason}</span>
      </div>

      <div className="mt-2 flex gap-4">
        <div>
          <span className="ds-type-caption text-[var(--muted-foreground)]">SPY 12M</span>
          <span
            className="ml-1 font-mono ds-type-caption font-semibold"
            style={{ color: signal.spyReturn12m >= 0 ? "var(--success)" : "var(--destructive)" }}
          >
            {(signal.spyReturn12m * 100).toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="ds-type-caption text-[var(--muted-foreground)]">VEU 12M</span>
          <span
            className="ml-1 font-mono ds-type-caption font-semibold"
            style={{ color: signal.veuReturn12m >= 0 ? "var(--success)" : "var(--destructive)" }}
          >
            {(signal.veuReturn12m * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
