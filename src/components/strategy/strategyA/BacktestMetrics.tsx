import type { BacktestResult } from "@/stores/useStrategyStore";

interface BacktestMetricsProps {
  result: BacktestResult;
}

const METRIC_CARDS: {
  label: string;
  key: keyof BacktestResult;
  format: (v: number) => string;
  colorFn?: (v: number) => string;
}[] = [
  {
    label: "CAGR",
    key: "cagr",
    format: (v) => `${(v * 100).toFixed(2)}%`,
    colorFn: (v) => (v >= 0 ? "var(--success)" : "var(--destructive)"),
  },
  {
    label: "총수익률",
    key: "totalReturn",
    format: (v) => `${(v * 100).toFixed(1)}%`,
    colorFn: (v) => (v >= 0 ? "var(--success)" : "var(--destructive)"),
  },
  {
    label: "Sharpe",
    key: "sharpe",
    format: (v) => v.toFixed(2),
    colorFn: (v) => (v >= 1 ? "var(--success)" : v >= 0.5 ? "var(--warning)" : "var(--destructive)"),
  },
  {
    label: "Max DD",
    key: "maxDrawdown",
    format: (v) => `-${(v * 100).toFixed(1)}%`,
    colorFn: (v) => (v < 0.15 ? "var(--success)" : v < 0.3 ? "var(--warning)" : "var(--destructive)"),
  },
  {
    label: "Win Rate",
    key: "winRate",
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
  {
    label: "Calmar",
    key: "calmar",
    format: (v) => v.toFixed(2),
  },
];

export default function BacktestMetrics({ result }: BacktestMetricsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {METRIC_CARDS.map((card) => {
        const value = result[card.key] as number;
        const color = card.colorFn?.(value) ?? "var(--foreground)";
        return (
          <div
            key={card.label}
            className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2"
          >
            <div className="ds-type-caption text-[var(--muted-foreground)]">{card.label}</div>
            <div className="mt-0.5 font-mono text-sm font-bold" style={{ color }}>
              {card.format(value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
