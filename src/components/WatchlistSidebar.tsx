import { useEffect, useMemo, useState } from "react";
import { fetchWatchlistSnapshots } from "../services/tauriApi";
import { useSettingsStore } from "../stores/useSettingsStore";
import type { WatchlistSnapshot } from "../types";
import {
  PRESET_CATEGORIES,
  getSymbolLabel,
  type PresetSymbol,
} from "../utils/constants";
import type { MarketType } from "../types";
import { formatPrice } from "../utils/formatters";

interface WatchlistSidebarProps {
  onClose?: () => void;
  onSelectSymbol?: () => void;
  embedded?: boolean;
}

type MarketFilter = "all" | MarketType;
const SNAPSHOT_REQUEST_SIZE = 18;

function snapshotKey(symbol: string, market: MarketType): string {
  return `${market}:${symbol}`;
}

function marketBadge(market: MarketType) {
  if (market === "crypto") return { text: "코인", color: "var(--warning-color)" };
  if (market === "krStock") return { text: "KR", color: "#EC4899" };
  return { text: "US", color: "var(--accent-primary)" };
}

function Sparkline({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  if (!values || values.length < 2) {
    return (
      <div
        className="h-7 w-full rounded border border-dashed"
        style={{ borderColor: "var(--border-color)", opacity: 0.5 }}
      />
    );
  }

  const width = 112;
  const height = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1e-9);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (width - 2) + 1;
      const y = height - 1 - ((v - min) / range) * (height - 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="가격 추세"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WatchlistSidebar({
  onClose,
  onSelectSymbol,
  embedded = false,
}: WatchlistSidebarProps) {
  const { symbol, interval, setSymbol } = useSettingsStore();
  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");
  const [snapshots, setSnapshots] = useState<Record<string, WatchlistSnapshot>>(
    {},
  );
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);

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

  const snapshotTargets = useMemo(
    () =>
      visibleItems
        .slice(0, SNAPSHOT_REQUEST_SIZE)
        .map(({ symbol: targetSymbol, market }) => ({
          symbol: targetSymbol,
          market,
        })),
    [visibleItems],
  );

  useEffect(() => {
    let cancelled = false;
    if (snapshotTargets.length === 0) return () => {};

    const timer = window.setTimeout(async () => {
      setIsLoadingSnapshots(true);
      try {
        const result = await fetchWatchlistSnapshots({
          items: snapshotTargets,
          interval,
          limit: 96,
        });
        if (cancelled) return;

        setSnapshots((prev) => {
          const next = { ...prev };
          for (const snapshot of result) {
            next[snapshotKey(snapshot.symbol, snapshot.market)] = snapshot;
          }
          return next;
        });
      } catch (error) {
        if (!cancelled) {
          console.warn("watchlist snapshot fetch failed:", error);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSnapshots(false);
        }
      }
    }, 160);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [interval, snapshotTargets]);

  return (
    <aside
      className={`flex h-full min-w-0 flex-col ${
        embedded ? "w-full rounded-lg border" : "w-[min(22rem,calc(100vw-1rem))] border-l"
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
            관심종목
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
            {activeLabel ? `${symbol} · ${activeLabel}` : symbol} ·{" "}
            {isLoadingSnapshots ? "스냅샷 갱신중" : `${interval} 기준 스냅샷`}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost rounded p-1.5"
            style={{ color: "var(--text-secondary)" }}
            title="관심종목 닫기"
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
          placeholder="심볼 검색..."
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
                ? "전체"
                : mf === "usStock"
                ? "US"
                : mf === "krStock"
                ? "KR"
                : "코인"}
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
                className="w-full rounded-md border px-2.5 py-2 text-left transition-colors"
                style={{
                  background: active
                    ? "color-mix(in srgb, var(--accent-primary) 10%, var(--bg-tertiary))"
                    : "transparent",
                  borderColor: active ? "var(--accent-primary)" : "var(--border-color)",
                }}
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p
                        className="truncate text-xs font-semibold font-mono"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.symbol}
                      </p>
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                        style={{
                          background: `color-mix(in srgb, ${badge.color} 18%, transparent)`,
                          color: badge.color,
                        }}
                      >
                        {badge.text}
                      </span>
                    </div>
                    <p className="truncate text-[10px]" style={{ color: "var(--text-secondary)" }}>
                      {item.label}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {(() => {
                      const snapshot = snapshots[snapshotKey(item.symbol, item.market)];
                      const isUp = snapshot ? snapshot.change >= 0 : null;
                      const priceColor =
                        isUp === null
                          ? "var(--text-primary)"
                          : isUp
                            ? "var(--success-color)"
                            : "var(--danger-color)";
                      const changeLabel = snapshot
                        ? `${snapshot.changePct >= 0 ? "+" : ""}${snapshot.changePct.toFixed(2)}%`
                        : "로딩중";
                      return (
                        <>
                          <div className="font-mono text-[11px] font-semibold" style={{ color: priceColor }}>
                            {snapshot ? formatPrice(snapshot.lastPrice, item.market) : "-"}
                          </div>
                          <div className="text-[10px]" style={{ color: priceColor }}>
                            {changeLabel}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {(() => {
                  const snapshot = snapshots[snapshotKey(item.symbol, item.market)];
                  const trendColor = snapshot
                    ? snapshot.change >= 0
                      ? "var(--success-color)"
                      : "var(--danger-color)"
                    : "var(--text-secondary)";
                  return (
                    <div className="mt-1.5">
                      <Sparkline values={snapshot?.sparkline ?? []} color={trendColor} />
                      {snapshot && (
                        <p
                          className="mt-0.5 text-[10px]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          H {formatPrice(snapshot.high, item.market)} · L{" "}
                          {formatPrice(snapshot.low, item.market)}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </button>
            );
          })}
          {visibleItems.length === 0 && (
            <div className="rounded border px-3 py-4 text-center text-xs" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
              심볼이 없습니다
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
