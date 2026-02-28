import { useMemo, useState } from "react";
import { useSettingsStore } from "../stores/useSettingsStore";
import {
  PRESET_CATEGORIES,
  getSymbolLabel,
  type PresetSymbol,
} from "../utils/constants";
import type { MarketType } from "../types";

interface WatchlistSidebarProps {
  onClose?: () => void;
  onSelectSymbol?: () => void;
  embedded?: boolean;
}

type MarketFilter = "all" | MarketType;

function marketBadge(market: MarketType) {
  if (market === "crypto") return { text: "CRYPTO", color: "var(--warning-color)" };
  if (market === "krStock") return { text: "KR", color: "#EC4899" };
  return { text: "US", color: "var(--accent-primary)" };
}

export default function WatchlistSidebar({
  onClose,
  onSelectSymbol,
  embedded = false,
}: WatchlistSidebarProps) {
  const { symbol, setSymbol } = useSettingsStore();
  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");

  const activeLabel = getSymbolLabel(symbol);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: PresetSymbol[] = [];

    for (const category of PRESET_CATEGORIES) {
      for (const item of category.items) {
        if (marketFilter !== "all" && item.market !== marketFilter) continue;
        if (
          q &&
          !item.symbol.toLowerCase().includes(q) &&
          !item.label.toLowerCase().includes(q)
        ) {
          continue;
        }
        items.push(item);
      }
    }

    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.symbol)) return false;
      seen.add(item.symbol);
      return true;
    });
  }, [marketFilter, query]);

  return (
    <aside
      className={`flex h-full w-[min(22rem,calc(100vw-1rem))] min-w-0 flex-col ${
        embedded ? "rounded-lg border" : "border-l"
      }`}
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
        boxShadow: "var(--panel-shadow)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-2.5"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Watchlist
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
            {activeLabel ? `${symbol} · ${activeLabel}` : symbol}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost rounded p-1.5"
            style={{ color: "var(--text-secondary)" }}
            title="Close watchlist"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbols..."
          spellCheck={false}
          className="w-full rounded px-3 py-1.5 text-sm outline-none"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
          }}
        />
        <div className="mt-2 flex gap-1">
          {(["all", "usStock", "krStock", "crypto"] as const).map((mf) => (
            <button
              key={mf}
              type="button"
              onClick={() => setMarketFilter(mf)}
              className="rounded px-2 py-1 text-[10px] font-medium"
              style={{
                background: marketFilter === mf ? "var(--accent-primary)" : "var(--bg-tertiary)",
                color: marketFilter === mf ? "var(--accent-contrast)" : "var(--text-secondary)",
                border: `1px solid ${marketFilter === mf ? "var(--accent-primary)" : "var(--border-color)"}`,
              }}
            >
              {mf === "all"
                ? "ALL"
                : mf === "usStock"
                ? "US"
                : mf === "krStock"
                ? "KR"
                : "CRYPTO"}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const badge = marketBadge(item.market);
            const active = symbol === item.symbol;
            return (
              <button
                key={item.symbol}
                type="button"
                onClick={() => {
                  setSymbol(item.symbol, item.market);
                  onSelectSymbol?.();
                }}
                className="flex w-full items-center justify-between rounded-md border px-2.5 py-2 text-left transition-colors"
                style={{
                  background: active ? "var(--bg-tertiary)" : "transparent",
                  borderColor: active ? "var(--accent-primary)" : "var(--border-color)",
                }}
              >
                <div className="min-w-0">
                  <p
                    className="truncate text-xs font-semibold font-mono"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.symbol}
                  </p>
                  <p className="truncate text-[10px]" style={{ color: "var(--text-secondary)" }}>
                    {item.label}
                  </p>
                </div>
                <span
                  className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold"
                  style={{
                    background: `color-mix(in srgb, ${badge.color} 18%, transparent)`,
                    color: badge.color,
                  }}
                >
                  {badge.text}
                </span>
              </button>
            );
          })}
          {visibleItems.length === 0 && (
            <div className="rounded border px-3 py-4 text-center text-xs" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
              No symbols found
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
