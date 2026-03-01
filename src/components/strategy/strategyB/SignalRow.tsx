import type { MACDBBSignal } from "@/stores/useStrategyStore";

interface SignalRowProps {
  signal: MACDBBSignal;
}

export default function SignalRow({ signal }: SignalRowProps) {
  const date = new Date(signal.time * 1000);
  const dateStr = date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const isBuy = signal.direction === "buy";
  const dirColor = isBuy ? "var(--success)" : "var(--destructive)";
  const dirLabel = isBuy ? "매수" : "매도";

  return (
    <div className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-[var(--secondary)]">
      <span className="ds-type-caption font-mono text-[var(--muted-foreground)] w-20 shrink-0">
        {dateStr}
      </span>
      <span
        className="ds-type-caption font-semibold rounded px-1.5 py-0.5 shrink-0"
        style={{
          background: dirColor,
          color: "white",
          opacity: signal.confidence === "strong" ? 1 : 0.75,
        }}
      >
        {signal.confidence === "strong" ? `강한 ${dirLabel}` : dirLabel}
      </span>
      <span className="font-mono ds-type-label text-[var(--foreground)] shrink-0">
        ${signal.price.toFixed(2)}
      </span>
      <span className="ds-type-caption text-[var(--muted-foreground)] truncate">
        {signal.conditions.join(" · ")}
      </span>
    </div>
  );
}
