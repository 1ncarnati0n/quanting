import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { fetchWatchlistSnapshots, searchSymbols } from "../services/tauriApi";
import { useSettingsStore } from "../stores/useSettingsStore";
import type { MarketType, SymbolSearchResult, WatchlistSnapshot } from "../types";
import { getIntervalLabel, PRESET_CATEGORIES, type Interval, type PresetSymbol } from "../utils/constants";
import { formatPrice } from "../utils/formatters";
import { getInstrumentDisplay, getInstrumentLogoMeta } from "../utils/marketView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import PanelHeader from "./patterns/PanelHeader";
import SegmentButton from "./patterns/SegmentButton";

interface WatchlistSidebarProps {
  onClose?: () => void;
  onSelectSymbol?: () => void;
  embedded?: boolean;
}

type MarketFilter = "all" | MarketType;
type ListMode = "all" | "favorite" | "recent";

const SNAPSHOT_LIMIT = 26;
const MARKET_INFO_ITEMS: PresetSymbol[] = [
  { symbol: "SPY", label: "S&P 500", market: "usStock" },
  { symbol: "QQQ", label: "NASDAQ 100", market: "usStock" },
  { symbol: "USDKRW=X", label: "USD/KRW", market: "forex" },
];

function snapshotKey(symbol: string, market: MarketType): string {
  return `${market}:${symbol}`;
}

function marketBadge(market: MarketType) {
  if (market === "crypto") return { text: "코인", color: "var(--warning)" };
  if (market === "krStock") return { text: "KR", color: "var(--brand-kr)" };
  if (market === "forex") return { text: "FX", color: "var(--brand-fx)" };
  return { text: "US", color: "var(--primary)" };
}

function mergeUnique(items: PresetSymbol[]): PresetSymbol[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = snapshotKey(item.symbol, item.market);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function WatchlistSidebar({
  onClose,
  onSelectSymbol,
  embedded = false,
}: WatchlistSidebarProps) {
  const {
    symbol,
    market,
    interval,
    favorites,
    customSymbols,
    recentSymbols,
    setSymbol,
    toggleFavorite,
    addCustomSymbol,
    removeCustomSymbol,
  } = useSettingsStore(
    useShallow((state) => ({
      symbol: state.symbol,
      market: state.market,
      interval: state.interval,
      favorites: state.favorites,
      customSymbols: state.customSymbols,
      recentSymbols: state.recentSymbols,
      setSymbol: state.setSymbol,
      toggleFavorite: state.toggleFavorite,
      addCustomSymbol: state.addCustomSymbol,
      removeCustomSymbol: state.removeCustomSymbol,
    })),
  );

  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");
  const [listMode, setListMode] = useState<ListMode>("all");
  const [snapshots, setSnapshots] = useState<Record<string, WatchlistSnapshot>>({});
  const [apiSearchResults, setApiSearchResults] = useState<SymbolSearchResult[]>([]);
  const [isApiSearching, setIsApiSearching] = useState(false);
  const [lastSnapshotUpdatedAt, setLastSnapshotUpdatedAt] = useState<number | null>(null);

  const basePresetItems = useMemo(
    () =>
      mergeUnique([
        ...PRESET_CATEGORIES.flatMap((category) => category.items),
        ...customSymbols,
      ]),
    [customSymbols],
  );

  const favoriteItems = useMemo(
    () =>
      favorites.map((item) => {
        const matched = basePresetItems.find(
          (candidate) => candidate.symbol === item.symbol && candidate.market === item.market,
        );
        return matched ?? { symbol: item.symbol, label: item.symbol, market: item.market };
      }),
    [basePresetItems, favorites],
  );

  const recentItems = useMemo(
    () =>
      recentSymbols.map((item) => {
        const matched = basePresetItems.find(
          (candidate) => candidate.symbol === item.symbol && candidate.market === item.market,
        );
        return matched ?? { symbol: item.symbol, label: item.symbol, market: item.market };
      }),
    [basePresetItems, recentSymbols],
  );

  const sourceItems = useMemo(() => {
    if (listMode === "favorite") return favoriteItems;
    if (listMode === "recent") return recentItems;
    return basePresetItems;
  }, [basePresetItems, favoriteItems, listMode, recentItems]);

  const visibleItems = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();
    return sourceItems.filter((item) => {
      if (marketFilter !== "all" && item.market !== marketFilter) return false;
      if (!loweredQuery) return true;
      return (
        item.symbol.toLowerCase().includes(loweredQuery) ||
        item.label.toLowerCase().includes(loweredQuery)
      );
    });
  }, [marketFilter, query, sourceItems]);

  const snapshotTargets = useMemo(
    () =>
      mergeUnique([
        ...visibleItems.slice(0, SNAPSHOT_LIMIT),
        ...MARKET_INFO_ITEMS,
      ]).map((item) => ({
        symbol: item.symbol,
        market: item.market,
      })),
    [visibleItems],
  );

  const snapshotRefreshMs = useMemo(
    () => (snapshotTargets.some((item) => item.market === "crypto") ? 30000 : 60000),
    [snapshotTargets],
  );

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    const runFetch = async () => {
      if (cancelled || inFlight || snapshotTargets.length === 0) return;
      inFlight = true;
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
        setLastSnapshotUpdatedAt(Date.now());
      } catch {
        if (!cancelled) {
          setSnapshots((prev) => ({ ...prev }));
        }
      } finally {
        inFlight = false;
      }
    };

    const initialTimer = window.setTimeout(() => {
      void runFetch();
    }, 120);
    const refreshTimer = window.setInterval(() => {
      void runFetch();
    }, snapshotRefreshMs);

    return () => {
      cancelled = true;
      window.clearTimeout(initialTimer);
      window.clearInterval(refreshTimer);
    };
  }, [interval, snapshotRefreshMs, snapshotTargets]);

  useEffect(() => {
    let cancelled = false;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setApiSearchResults([]);
      setIsApiSearching(false);
      return;
    }

    setIsApiSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const results = await searchSymbols({
          query: trimmed,
          marketFilter: marketFilter === "all" ? null : marketFilter,
        });
        if (cancelled) return;
        const knownKeys = new Set(
          mergeUnique([...basePresetItems, ...customSymbols]).map((item) => snapshotKey(item.symbol, item.market)),
        );
        setApiSearchResults(
          results
            .filter((item) => !knownKeys.has(snapshotKey(item.symbol, item.market)))
            .slice(0, 6),
        );
      } catch {
        if (!cancelled) setApiSearchResults([]);
      } finally {
        if (!cancelled) setIsApiSearching(false);
      }
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [basePresetItems, customSymbols, marketFilter, query]);

  const handleSelectSymbol = (item: PresetSymbol) => {
    setSymbol(item.symbol, item.market);
    onSelectSymbol?.();
  };

  const activeUpdatedAt = useMemo(() => {
    if (!lastSnapshotUpdatedAt) return `${getIntervalLabel(interval as Interval)} 기준`;
    return `${new Date(lastSnapshotUpdatedAt).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })} 업데이트`;
  }, [interval, lastSnapshotUpdatedAt]);

  return (
    <aside
      className={`dashboard-watchlist flex h-full min-h-0 flex-col ${embedded ? "" : "border-l"}`}
      style={{
        background: embedded ? "transparent" : "var(--panel-fill)",
        borderColor: embedded ? "transparent" : "var(--border)",
      }}
    >
      {!embedded ? (
        <div className="dashboard-watchlist__sheet-header flex h-12 items-center justify-between border-b px-4" style={{ borderColor: "var(--border)" }}>
          <div className="text-[1rem] font-semibold text-[var(--foreground)]">관심종목</div>
          {onClose ? (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="관심종목 닫기" title="닫기">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="dashboard-watchlist__controls">
        <PanelHeader
          title="관심종목"
          subtitle="실시간 흐름과 저장한 종목을 빠르게 탐색합니다."
          density="compact"
          className="dashboard-watchlist__controls-head"
        >
          <div className="dashboard-watchlist__mode-frame grid grid-cols-3 gap-2">
            {([
              { value: "all" as const, label: "실시간" },
              { value: "favorite" as const, label: "관심" },
              { value: "recent" as const, label: "최근" },
            ] as const).map((tab) => (
              <SegmentButton
                key={tab.value}
                type="button"
                size="sm"
                active={listMode === tab.value}
                activeTone="accent"
                inactiveSurface="card"
                onClick={() => setListMode(tab.value)}
              >
                {tab.label}
              </SegmentButton>
            ))}
          </div>
        </PanelHeader>

        <div className="dashboard-watchlist__controls-card">
          <Input
            type="text"
            size="sm"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="종목 검색"
            spellCheck={false}
            className="dashboard-watchlist__search border-0 bg-[var(--panel-control-fill)] shadow-none focus-visible:ring-2"
          />

          <div className="dashboard-watchlist__filters">
            {([
              { value: "all" as const, label: "전체" },
              { value: "usStock" as const, label: "US" },
              { value: "krStock" as const, label: "KR" },
              { value: "crypto" as const, label: "코인" },
              { value: "forex" as const, label: "FX" },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMarketFilter(option.value)}
                className={`dashboard-watchlist__filter ${marketFilter === option.value ? "is-active" : ""}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="dashboard-watchlist__meta">
            <span>{visibleItems.length}개 종목</span>
            <span className="dashboard-watchlist__meta-dot" />
            <span>{activeUpdatedAt}</span>
          </div>
        </div>
      </div>

      {(isApiSearching || apiSearchResults.length > 0) ? (
        <div className="dashboard-watchlist__search-results">
          <div className="dashboard-watchlist__section-label">
            {isApiSearching ? "검색 중..." : "검색 결과"}
          </div>
          <div className="dashboard-watchlist__result-list">
            {apiSearchResults.map((item) => (
              <div
                key={snapshotKey(item.symbol, item.market)}
                className="dashboard-watchlist__result-card"
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => handleSelectSymbol(item)}>
                  <div className="truncate text-[0.8rem] font-semibold text-[var(--foreground)]">{item.symbol}</div>
                  <div className="truncate text-[0.7333rem] text-[var(--muted-foreground)]">{item.label}</div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => addCustomSymbol(item.symbol, item.label, item.market)}
                  title="목록에 추가"
                  aria-label="목록에 추가"
                >
                  +
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <ScrollArea className="min-h-0 flex-1" viewportClassName="h-full">
        <div className="dashboard-watchlist__list">
          {visibleItems.map((item) => {
            const active = item.symbol === symbol && item.market === market;
            const badge = marketBadge(item.market);
            const snapshot = snapshots[snapshotKey(item.symbol, item.market)];
            const instrument = getInstrumentDisplay(item.symbol, item.label, item.market);
            const logoMeta = getInstrumentLogoMeta(item.symbol, item.label, item.market);
            const isFavorite = favorites.some((favorite) => favorite.symbol === item.symbol && favorite.market === item.market);
            const priceColor = snapshot
              ? snapshot.change >= 0
                ? "var(--market-up)"
                : "var(--market-down)"
              : "var(--foreground)";

            return (
              <div
                key={snapshotKey(item.symbol, item.market)}
                className={`dashboard-watchlist__row ${active ? "is-active" : ""}`}
              >
                <div className="dashboard-watchlist__logo" aria-hidden="true">
                  <span
                    className={`dashboard-watchlist__logo-mark${logoMeta.monogram.length >= 3 ? " is-wide" : ""}`}
                    style={{
                      background: logoMeta.background,
                      color: logoMeta.foreground,
                    }}
                  >
                    <span className="dashboard-watchlist__logo-text">{logoMeta.monogram}</span>
                    <span className="dashboard-watchlist__logo-badge">{logoMeta.badge}</span>
                  </span>
                </div>
                <button type="button" className="dashboard-watchlist__row-main" onClick={() => handleSelectSymbol(item)}>
                  <div className="dashboard-watchlist__row-head">
                    <span className="dashboard-watchlist__row-title">{instrument.primary}</span>
                  </div>
                  <div className="dashboard-watchlist__row-subtitle-wrap">
                    <span className="dashboard-watchlist__row-subtitle">
                      {instrument.secondary ?? item.symbol}
                    </span>
                    <span
                      className="dashboard-watchlist__market-chip"
                      style={{
                        background: `color-mix(in srgb, ${badge.color} 14%, transparent)`,
                        color: badge.color,
                      }}
                    >
                      {badge.text}
                    </span>
                  </div>
                </button>

                <div className="dashboard-watchlist__row-side">
                  <div className="dashboard-watchlist__row-price-block">
                    <div className="dashboard-watchlist__price">
                      {snapshot ? formatPrice(snapshot.lastPrice, item.market) : "--"}
                    </div>
                    <div className="dashboard-watchlist__delta" style={{ color: priceColor }}>
                      {snapshot ? `${snapshot.changePct >= 0 ? "+" : ""}${snapshot.changePct.toFixed(2)}%` : ""}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFavorite(item.symbol, item.market)}
                    className={`dashboard-watchlist__action-button ${isFavorite ? "is-favorite" : ""}`}
                    style={{ color: isFavorite ? "var(--warning)" : "var(--muted-foreground)" }}
                    aria-label={isFavorite ? "관심 해제" : "관심 추가"}
                    title={isFavorite ? "관심 해제" : "관심 추가"}
                  >
                    {isFavorite ? "★" : "☆"}
                  </button>

                  {customSymbols.some((custom) => custom.symbol === item.symbol && custom.market === item.market) ? (
                    <button
                      type="button"
                      onClick={() => removeCustomSymbol(item.symbol, item.market)}
                      className="dashboard-watchlist__action-button"
                      aria-label="커스텀 종목 제거"
                      title="커스텀 종목 제거"
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}

          {visibleItems.length === 0 ? (
            <div className="dashboard-watchlist__empty">
              표시할 종목이 없습니다.
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className="dashboard-watchlist__summary">
        <PanelHeader
          title="시장 요약"
          subtitle="주요 벤치마크 흐름"
          density="compact"
          className="dashboard-watchlist__summary-head"
        />
        <div className="dashboard-watchlist__summary-list">
          {MARKET_INFO_ITEMS.map((item) => {
            const snapshot = snapshots[snapshotKey(item.symbol, item.market)];
            const changeColor = snapshot
              ? snapshot.change >= 0
                ? "var(--market-up)"
                : "var(--market-down)"
              : "var(--muted-foreground)";
            return (
              <div key={snapshotKey(item.symbol, item.market)} className="dashboard-watchlist__summary-row">
                <span className="dashboard-watchlist__summary-label">{item.label}</span>
                <span className="dashboard-watchlist__summary-value">
                  <span className="dashboard-watchlist__summary-price">
                    {snapshot ? formatPrice(snapshot.lastPrice, item.market) : "--"}
                  </span>
                  <span className="dashboard-watchlist__summary-delta" style={{ color: changeColor }}>
                    {snapshot ? `${snapshot.changePct >= 0 ? "+" : ""}${snapshot.changePct.toFixed(2)}%` : ""}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
