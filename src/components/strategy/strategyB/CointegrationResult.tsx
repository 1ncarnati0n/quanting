import type { PairTradingResult } from "@/stores/useStrategyStore";

interface CointegrationResultProps {
  result: PairTradingResult;
}

const SIGNAL_LABELS: Record<string, { label: string; color: string }> = {
  long: { label: "롱 스프레드 (A매수, B매도)", color: "var(--success)" },
  short: { label: "숏 스프레드 (A매도, B매수)", color: "var(--destructive)" },
  close: { label: "포지션 청산 (익절)", color: "var(--primary)" },
  stoploss: { label: "손절 (공적분 붕괴 위험)", color: "var(--warning)" },
  none: { label: "대기", color: "var(--muted-foreground)" },
};

export default function CointegrationResult({ result }: CointegrationResultProps) {
  const sig = SIGNAL_LABELS[result.signal] ?? SIGNAL_LABELS.none;

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          label="ADF 통계량"
          value={result.adfStatistic.toFixed(3)}
          sub={result.isCointegrated ? "공적분 ✓" : "비공적분 ✗"}
          subColor={result.isCointegrated ? "var(--success)" : "var(--destructive)"}
        />
        <StatCard
          label="헤지 비율 (β)"
          value={result.beta.toFixed(4)}
        />
        <StatCard
          label="반감기"
          value={result.halfLife === Infinity ? "∞" : `${result.halfLife.toFixed(1)}일`}
          sub={result.halfLife < 30 ? "빠른 회귀" : result.halfLife < 90 ? "보통" : "느린 회귀"}
          subColor={result.halfLife < 30 ? "var(--success)" : "var(--warning)"}
        />
        <StatCard
          label="현재 Z-Score"
          value={result.currentZScore.toFixed(2)}
        />
      </div>

      {/* Signal */}
      <div
        className="rounded-lg border p-3"
        style={{ borderColor: sig.color }}
      >
        <div className="ds-type-caption text-[var(--muted-foreground)]">트레이딩 신호</div>
        <div className="mt-1 font-semibold ds-type-label" style={{ color: sig.color }}>
          {sig.label}
        </div>
        <div className="mt-1 ds-type-caption text-[var(--muted-foreground)]">
          Z &gt; +2: 숏 · Z &lt; -2: 롱 · |Z| &lt; 0.5: 익절 · |Z| &gt; 3.5: 손절
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  subColor,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2">
      <div className="ds-type-caption text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-bold text-[var(--foreground)]">{value}</div>
      {sub && (
        <div className="ds-type-caption font-semibold" style={{ color: subColor ?? "var(--muted-foreground)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
