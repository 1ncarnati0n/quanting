import type { MACDBBSignal } from "@/stores/useStrategyStore";
import SignalRow from "./SignalRow";

interface SignalDashboardProps {
  signals: MACDBBSignal[];
}

export default function SignalDashboard({ signals }: SignalDashboardProps) {
  if (signals.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-[var(--border)]">
        <span className="ds-type-body text-[var(--muted-foreground)]">
          감지된 신호가 없습니다
        </span>
      </div>
    );
  }

  const recent = signals.slice(-20).reverse();
  const buyCount = signals.filter((s) => s.direction === "buy").length;
  const sellCount = signals.filter((s) => s.direction === "sell").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="ds-type-caption text-[var(--muted-foreground)]">
          총 {signals.length}개 신호
        </span>
        <span className="ds-type-caption font-semibold" style={{ color: "var(--success)" }}>
          매수 {buyCount}
        </span>
        <span className="ds-type-caption font-semibold" style={{ color: "var(--destructive)" }}>
          매도 {sellCount}
        </span>
      </div>

      <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
        {recent.map((signal, idx) => (
          <SignalRow key={`${signal.time}-${idx}`} signal={signal} />
        ))}
      </div>
    </div>
  );
}
