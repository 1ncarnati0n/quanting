import { PREDEFINED_PAIRS } from "@/utils/strategyB/pairCointegration";

interface PairSelectorProps {
  selected: { a: string; b: string; market: string } | null;
  onSelect: (pair: { a: string; b: string; market: string }) => void;
}

export default function PairSelector({ selected, onSelect }: PairSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PREDEFINED_PAIRS.map((pair) => {
        const isActive = selected?.a === pair.a && selected?.b === pair.b;
        return (
          <button
            key={`${pair.a}-${pair.b}`}
            onClick={() => onSelect({ a: pair.a, b: pair.b, market: pair.market })}
            className="ds-type-caption rounded border px-2 py-1 font-semibold transition-colors"
            style={{
              borderColor: isActive ? "var(--primary)" : "var(--border)",
              background: isActive ? "var(--primary)" : "var(--secondary)",
              color: isActive ? "var(--primary-foreground)" : "var(--muted-foreground)",
            }}
          >
            {pair.label}
          </button>
        );
      })}
    </div>
  );
}
