import type { MACDBBSignal } from "@/stores/useStrategyStore";
import StatePanel from "@/components/patterns/StatePanel";
import SignalRow from "./SignalRow";

interface SignalDashboardProps {
  signals: MACDBBSignal[];
}

export default function SignalDashboard({ signals }: SignalDashboardProps) {
  if (signals.length === 0) {
    return (
      <StatePanel
        variant="empty"
        size="compact"
        title="감지된 신호가 없습니다"
        description="조건을 변경한 뒤 다시 스캔해 보세요."
        className="h-24 border-dashed bg-transparent flex items-center justify-center"
      />
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
