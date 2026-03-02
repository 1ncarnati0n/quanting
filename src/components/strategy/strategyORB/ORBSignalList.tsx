import type { ORBSignal } from "@/stores/useStrategyStore";
import StatePanel from "@/components/patterns/StatePanel";

interface ORBSignalListProps {
  signals: ORBSignal[];
}

export default function ORBSignalList({ signals }: ORBSignalListProps) {
  if (signals.length === 0) {
    return (
      <StatePanel
        variant="empty"
        size="compact"
        title="감지된 돌파 신호가 없습니다"
        description="프리마켓 스캔 후 장중 돌파를 확인하세요."
        className="h-20 border-dashed bg-transparent flex items-center justify-center"
      />
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-[var(--secondary)] ds-type-caption text-[var(--muted-foreground)]">
            <th className="px-3 py-1.5 text-left font-semibold">종목</th>
            <th className="px-3 py-1.5 text-center font-semibold">방향</th>
            <th className="px-3 py-1.5 text-right font-semibold">진입가</th>
            <th className="px-3 py-1.5 text-right font-semibold">T1 (50%)</th>
            <th className="px-3 py-1.5 text-right font-semibold">T2 (25%)</th>
            <th className="px-3 py-1.5 text-right font-semibold">손절</th>
            <th className="px-3 py-1.5 text-right font-semibold">레인지</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {signals.map((signal, idx) => {
            const isLong = signal.direction === "long";
            const dirColor = isLong ? "var(--success)" : "var(--destructive)";
            return (
              <tr key={`${signal.symbol}-${idx}`} className="hover:bg-[var(--secondary)]">
                <td className="px-3 py-1.5 font-mono ds-type-label font-semibold text-[var(--foreground)]">
                  {signal.symbol}
                </td>
                <td className="px-3 py-1.5 text-center">
                  <span
                    className="ds-type-caption rounded px-1.5 py-0.5 font-semibold"
                    style={{ background: dirColor, color: "white" }}
                  >
                    {isLong ? "롱" : "숏"}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right font-mono ds-type-label text-[var(--foreground)]">
                  ${signal.entry.toFixed(2)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono ds-type-label" style={{ color: "var(--success)" }}>
                  ${signal.target1.toFixed(2)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono ds-type-label" style={{ color: "var(--success)" }}>
                  ${signal.target2.toFixed(2)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono ds-type-label" style={{ color: "var(--destructive)" }}>
                  ${signal.stop.toFixed(2)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono ds-type-caption text-[var(--muted-foreground)]">
                  ${signal.rangeHigh.toFixed(2)}-${signal.rangeLow.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
