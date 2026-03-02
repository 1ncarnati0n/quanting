import { useState, useRef, useEffect, useMemo, type KeyboardEvent } from "react";
import { useSettingsStore } from "../stores/useSettingsStore";
import { PRESET_CATEGORIES, getSymbolLabel, detectMarket } from "../utils/constants";
import type { MarketType, SymbolSearchResult } from "../types";
import { getInstrumentDisplay } from "../utils/marketView";
import { searchSymbols } from "../services/tauriApi";
import { trackUxAction } from "../utils/uxMetrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import SettingRow from "./patterns/SettingRow";

type MarketFilter = "all" | MarketType;

function watchKey(symbol: string, market: MarketType): string {
  return `${market}:${symbol}`;
}

function marketMeta(market: MarketType) {
  if (market === "crypto") return { text: "코인", color: "var(--warning)" };
  if (market === "krStock") return { text: "KR", color: "#EC4899" };
  if (market === "forex") return { text: "FX", color: "#14B8A6" };
  return { text: "US", color: "var(--primary)" };
}

const MARKET_FILTER_OPTIONS: Array<{ value: MarketFilter; label: string }> = [
  { value: "all", label: "전체" },
  { value: "usStock", label: "US" },
  { value: "krStock", label: "KR" },
  { value: "crypto", label: "코인" },
  { value: "forex", label: "FX" },
];

interface SymbolSearchProps {
  hideTrigger?: boolean;
}

export default function SymbolSearch({ hideTrigger = false }: SymbolSearchProps) {
  const {
    symbol,
    market,
    setSymbol,
    favorites,
    recentSymbols,
    toggleFavorite,
    clearRecentSymbols,
  } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [apiResults, setApiResults] = useState<SymbolSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchVersionRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentLabel = getSymbolLabel(symbol);
  const currentInstrument = getInstrumentDisplay(symbol, currentLabel, market);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setFilter("");
      setManualInput("");
      setFavoriteOnly(false);
      setMarketFilter("all");
      setActiveIndex(-1);
      setApiResults([]);
      setIsSearching(false);
      searchVersionRef.current += 1;
    }
  }, [isOpen]);

  useEffect(() => {
    const openFromShortcut = () => {
      setIsOpen(true);
      trackUxAction("symbol_search", "open_dialog_shortcut");
    };
    window.addEventListener("quanting:open-symbol-search", openFromShortcut as EventListener);
    return () =>
      window.removeEventListener("quanting:open-symbol-search", openFromShortcut as EventListener);
  }, []);

  const lowerFilter = filter.toLowerCase();
  const favoriteSet = useMemo(
    () => new Set(favorites.map((item) => watchKey(item.symbol, item.market))),
    [favorites],
  );

  // 프리셋에 있는 심볼 Set (API 결과 중복 제거용)
  const presetSymbolSet = useMemo(() => {
    const set = new Set<string>();
    for (const cat of PRESET_CATEGORIES) {
      for (const item of cat.items) {
        set.add(item.symbol.toUpperCase());
      }
    }
    return set;
  }, []);

  // Debounce API 검색
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const isCryptoOrForex = marketFilter === "crypto" || marketFilter === "forex";
    if (filter.length < 2 || isCryptoOrForex) {
      setApiResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const version = ++searchVersionRef.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const mf = marketFilter === "all" ? null : marketFilter;
        const results = await searchSymbols({ query: filter, marketFilter: mf });
        if (searchVersionRef.current !== version) return; // stale 응답 무시
        // 프리셋에 이미 있는 심볼 제거
        setApiResults(results.filter((r) => !presetSymbolSet.has(r.symbol.toUpperCase())));
      } catch {
        if (searchVersionRef.current !== version) return;
        setApiResults([]);
      } finally {
        if (searchVersionRef.current === version) setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filter, marketFilter, presetSymbolSet]);

  const favoriteItems = useMemo(
    () =>
      favorites
        .map((item) => ({
          ...item,
          label: getSymbolLabel(item.symbol) ?? "사용자 즐겨찾기",
        }))
        .filter(
          (item) =>
            (marketFilter === "all" || item.market === marketFilter) &&
            (item.symbol.toLowerCase().includes(lowerFilter) ||
              item.label.toLowerCase().includes(lowerFilter)),
        ),
    [favorites, lowerFilter, marketFilter],
  );

  const recentItems = useMemo(
    () =>
      recentSymbols
        .map((item) => ({
          ...item,
          label: getSymbolLabel(item.symbol) ?? "최근 조회",
        }))
        .filter((item) => {
          const key = watchKey(item.symbol, item.market);
          if (favoriteOnly && !favoriteSet.has(key)) return false;
          if (marketFilter !== "all" && item.market !== marketFilter) return false;
          if (!lowerFilter) return true;
          return (
            item.symbol.toLowerCase().includes(lowerFilter) ||
            item.label.toLowerCase().includes(lowerFilter)
          );
        }),
    [favoriteOnly, favoriteSet, lowerFilter, marketFilter, recentSymbols],
  );

  const filteredCategories = useMemo(
    () =>
      PRESET_CATEGORIES
        .map((cat) => ({
          ...cat,
          items: cat.items
            .filter((item) => {
              const key = watchKey(item.symbol, item.market);
              const isFavorite = favoriteSet.has(key);
              if (marketFilter !== "all" && item.market !== marketFilter) return false;

              if (!favoriteOnly && isFavorite) {
                return false;
              }

              if (
                lowerFilter &&
                !item.symbol.toLowerCase().includes(lowerFilter) &&
                !item.label.toLowerCase().includes(lowerFilter)
              ) {
                return false;
              }
              if (favoriteOnly && !isFavorite) {
                return false;
              }
              return true;
            })
            .sort((a, b) => {
              const aFav = favoriteSet.has(watchKey(a.symbol, a.market));
              const bFav = favoriteSet.has(watchKey(b.symbol, b.market));
              if (aFav !== bFav) return aFav ? -1 : 1;
              const aStarts = a.symbol.toLowerCase().startsWith(lowerFilter);
              const bStarts = b.symbol.toLowerCase().startsWith(lowerFilter);
              if (aStarts !== bStarts) return aStarts ? -1 : 1;
              return a.symbol.localeCompare(b.symbol);
            }),
        }))
        .filter((cat) => cat.items.length > 0),
    [favoriteOnly, favoriteSet, lowerFilter, marketFilter],
  );

  const resultItems = useMemo(() => {
    const ordered: Array<{ symbol: string; market: MarketType; label: string; exchange?: string }> = [];
    const seen = new Set<string>();
    const addUnique = (item: { symbol: string; market: MarketType; label: string; exchange?: string }) => {
      const key = watchKey(item.symbol, item.market);
      if (seen.has(key)) return;
      seen.add(key);
      ordered.push(item);
    };

    if (!favoriteOnly) {
      recentItems.forEach(addUnique);
      filteredCategories.forEach((cat) => cat.items.forEach((item) => addUnique(item)));
      apiResults.forEach(addUnique);
    }
    favoriteItems.forEach(addUnique);
    return ordered;
  }, [apiResults, favoriteItems, favoriteOnly, filteredCategories, recentItems]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(resultItems.length > 0 ? 0 : -1);
  }, [isOpen, resultItems.length, filter, favoriteOnly]);

  const resultIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    resultItems.forEach((item, index) => {
      map.set(watchKey(item.symbol, item.market), index);
    });
    return map;
  }, [resultItems]);

  const activeItem = activeIndex >= 0 ? resultItems[activeIndex] : null;
  const activeKey = activeItem ? watchKey(activeItem.symbol, activeItem.market) : "";

  const selectSymbol = (targetSymbol: string, targetMarket: MarketType) => {
    setSymbol(targetSymbol, targetMarket);
    trackUxAction("symbol_search", "select_symbol");
    setIsOpen(false);
  };

  const handleManualSubmit = () => {
    const trimmed = manualInput.trim().toUpperCase();
    if (trimmed) {
      setSymbol(trimmed, detectMarket(trimmed));
      trackUxAction("symbol_search", "manual_input_apply");
      setIsOpen(false);
    }
  };

  const handleManualKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleManualSubmit();
    if (e.key === "Escape") setIsOpen(false);
  };

  const handleFilterKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && resultItems.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1 + resultItems.length) % resultItems.length);
      return;
    }

    if (e.key === "ArrowUp" && resultItems.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + resultItems.length) % resultItems.length);
      return;
    }

    if (e.key === "Enter" && activeItem) {
      e.preventDefault();
      selectSymbol(activeItem.symbol, activeItem.market);
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const currentKey = watchKey(symbol, market);
  const isCurrentFavorite = favoriteSet.has(currentKey);

  const focusCurrentMarket = () => {
    setMarketFilter(market);
    if (favoriteOnly) {
      setFavoriteOnly(false);
    }
    trackUxAction("symbol_search", "filter_current_market");
  };

  const resetFilters = () => {
    setFilter("");
    setFavoriteOnly(false);
    setMarketFilter("all");
    setActiveIndex(resultItems.length > 0 ? 0 : -1);
    trackUxAction("symbol_search", "reset_filters");
  };

  const renderInstrumentLabel = (item: { symbol: string; label: string; market: MarketType }) => {
    const display = getInstrumentDisplay(item.symbol, item.label, item.market);
    return (
      <>
        <span className={`ds-type-label min-w-[72px] truncate ${item.market === "krStock" ? "" : "font-mono"}`}>
          {display.primary}
        </span>
        {display.secondary && (
          <span className={`ds-type-caption truncate text-[var(--muted-foreground)] ${item.market === "krStock" ? "font-mono" : ""}`}>
            {display.secondary}
          </span>
        )}
      </>
    );
  };

  return (
    <div className="relative">
      {!hideTrigger && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="ds-type-label gap-1.5 px-2 text-[var(--muted-foreground)]"
            onClick={() => {
              setIsOpen(true);
              trackUxAction("symbol_search", "open_dialog");
            }}
            title="종목 검색 열기 (Ctrl/Cmd+K)"
            aria-label="종목 검색 열기"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.65" y1="16.65" x2="21" y2="21" />
            </svg>
            <span className="hidden sm:inline">종목</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              toggleFavorite(symbol, market);
              trackUxAction("symbol_search", isCurrentFavorite ? "unfavorite_current" : "favorite_current");
            }}
            title={isCurrentFavorite ? "현재 종목 즐겨찾기 해제" : "현재 종목 즐겨찾기 추가"}
            aria-label={isCurrentFavorite ? "현재 종목 즐겨찾기 해제" : "현재 종목 즐겨찾기 추가"}
            aria-pressed={isCurrentFavorite}
          >
            {isCurrentFavorite ? "★" : "☆"}
          </Button>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[min(100%-2rem,620px)] overflow-hidden p-0">
          <Command className="h-[min(72vh,580px)] rounded-none border-0 bg-[var(--muted)]">
            <div className="border-b border-[var(--border)] p-2.5">
              <CommandInput
                ref={inputRef}
                type="text"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                }}
                onKeyDown={handleFilterKeyDown}
                placeholder="종목 검색..."
                aria-label="종목 검색"
                spellCheck={false}
                className="h-[var(--control-height-md)] rounded-sm border border-[var(--border)] bg-[var(--secondary)] text-sm"
              />
              <div className="mt-2 flex items-center gap-1.5 rounded border border-[var(--border)] bg-[var(--secondary)] px-2 py-1.5">
                <span className="ds-type-label font-semibold text-[var(--muted-foreground)]">
                  현재
                </span>
                <span
                  className="ds-type-caption rounded px-1 py-0.5 font-bold"
                  style={{
                    background: `color-mix(in srgb, ${marketMeta(market).color} 18%, transparent)`,
                    color: marketMeta(market).color,
                  }}
                >
                  {marketMeta(market).text}
                </span>
                <span className={`ds-type-body text-[var(--foreground)] ${market === "krStock" ? "" : "font-mono"}`}>
                  {currentInstrument.primary}
                </span>
                {currentInstrument.secondary ? (
                  <span className={`ds-type-caption truncate text-[var(--muted-foreground)] ${market === "krStock" ? "font-mono" : ""}`}>
                    {currentInstrument.secondary}
                  </span>
                ) : (
                  <span className="ds-type-caption truncate text-[var(--muted-foreground)]">
                    {currentLabel ?? "직접 입력 종목"}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {MARKET_FILTER_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setMarketFilter(option.value);
                      trackUxAction("symbol_search", `filter_market_${option.value}`);
                    }}
                    variant={marketFilter === option.value ? "default" : "secondary"}
                    size="sm"
                    className="px-2"
                  >
                    {option.label}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="px-2"
                  onClick={focusCurrentMarket}
                >
                  현재 시장만
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="px-2 text-[var(--muted-foreground)]"
                  onClick={resetFilters}
                >
                  필터 초기화
                </Button>
              </div>
              <SettingRow
                className="mt-2"
                label={(
                  <span>
                    즐겨찾기 {favoriteItems.length}개 · 최근 종목 {recentItems.length}개 · 결과 {resultItems.length}개
                  </span>
                )}
                right={(
                  <Button
                    type="button"
                    onClick={() => {
                      trackUxAction("symbol_search", favoriteOnly ? "show_all" : "favorite_only");
                      setFavoriteOnly((prev) => !prev);
                    }}
                    variant={favoriteOnly ? "default" : "secondary"}
                    size="sm"
                    className="px-2"
                  >
                    즐겨찾기만
                  </Button>
                )}
              />
              <span className="sr-only" role="status" aria-live="polite">
                {isSearching
                  ? "종목 검색 결과를 불러오는 중입니다."
                  : `검색 결과 ${resultItems.length}건`}
              </span>
            </div>

            <CommandList className="px-1.5 py-1">
              {!favoriteOnly && recentItems.length > 0 && (
                <section>
                  <div className="ds-type-caption flex items-center justify-between px-2 py-1 font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    <span>최근</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ds-type-caption px-2"
                      onClick={() => {
                        clearRecentSymbols();
                        trackUxAction("symbol_search", "clear_recent");
                      }}
                      title="최근 종목 목록 비우기"
                    >
                      비우기
                    </Button>
                  </div>
                  {recentItems.map((item) => {
                    const badge = marketMeta(item.market);
                    const isActive = symbol === item.symbol && market === item.market;
                    const key = watchKey(item.symbol, item.market);
                    const isHighlighted = activeKey === key;
                    return (
                      <div key={`recent-${key}`} className="flex items-center gap-1 px-1 py-0.5">
                        <CommandItem
                          onClick={() => selectSymbol(item.symbol, item.market)}
                          onMouseEnter={() => {
                            const idx = resultIndexMap.get(key);
                            if (typeof idx === "number") setActiveIndex(idx);
                          }}
                          active={isHighlighted}
                          className="min-w-0 flex-1 gap-2"
                          style={{
                            background: isHighlighted
                              ? "color-mix(in srgb, var(--primary) 16%, transparent)"
                              : isActive
                                ? "var(--secondary)"
                                : undefined,
                          }}
                        >
                          <span
                            className="ds-type-caption rounded px-1 py-0.5 font-bold"
                            style={{
                              background: `color-mix(in srgb, ${badge.color} 18%, transparent)`,
                              color: badge.color,
                            }}
                          >
                            {badge.text}
                          </span>
                          {renderInstrumentLabel(item)}
                        </CommandItem>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            toggleFavorite(item.symbol, item.market);
                            trackUxAction("symbol_search", favoriteSet.has(key) ? "unfavorite_item" : "favorite_item");
                          }}
                          className="text-sm"
                          aria-label={favoriteSet.has(key) ? `${item.symbol} 즐겨찾기 해제` : `${item.symbol} 즐겨찾기 추가`}
                          aria-pressed={favoriteSet.has(key)}
                          title={favoriteSet.has(key) ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                          style={{
                            color: favoriteSet.has(key) ? "var(--warning)" : "var(--muted-foreground)",
                          }}
                        >
                          {favoriteSet.has(key) ? "★" : "☆"}
                        </Button>
                      </div>
                    );
                  })}
                </section>
              )}

              {favoriteItems.length > 0 && (
                <section>
                  <div className="ds-type-caption px-2 py-1 font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    즐겨찾기
                  </div>
                  {favoriteItems.map((item) => {
                    const badge = marketMeta(item.market);
                    const isActive = symbol === item.symbol && market === item.market;
                    const key = watchKey(item.symbol, item.market);
                    const isHighlighted = activeKey === key;
                    return (
                      <div key={`fav-${key}`} className="flex items-center gap-1 px-1 py-0.5">
                        <CommandItem
                          onClick={() => selectSymbol(item.symbol, item.market)}
                          onMouseEnter={() => {
                            const idx = resultIndexMap.get(key);
                            if (typeof idx === "number") setActiveIndex(idx);
                          }}
                          active={isHighlighted}
                          className="min-w-0 flex-1 gap-2"
                          style={{
                            background: isHighlighted
                              ? "color-mix(in srgb, var(--primary) 16%, transparent)"
                              : isActive
                                ? "var(--secondary)"
                                : undefined,
                          }}
                        >
                          <span
                            className="ds-type-caption rounded px-1 py-0.5 font-bold"
                            style={{
                              background: `color-mix(in srgb, ${badge.color} 18%, transparent)`,
                              color: badge.color,
                            }}
                          >
                            {badge.text}
                          </span>
                          {renderInstrumentLabel(item)}
                        </CommandItem>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            toggleFavorite(item.symbol, item.market);
                            trackUxAction("symbol_search", "unfavorite_item");
                          }}
                          className="text-sm text-[var(--warning)]"
                          aria-label={`${item.symbol} 즐겨찾기 해제`}
                          aria-pressed
                          title="즐겨찾기 해제"
                        >
                          ★
                        </Button>
                      </div>
                    );
                  })}
                </section>
              )}

              {!favoriteOnly &&
                filteredCategories.map((cat) => (
                  <section key={cat.name}>
                    <div className="ds-type-caption px-2 py-1 font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                      {cat.name}
                    </div>
                    {cat.items.map((item) => {
                      const itemKey = watchKey(item.symbol, item.market);
                      const isFavorite = favoriteSet.has(itemKey);
                      const isActive = symbol === item.symbol && market === item.market;
                      const badge = marketMeta(item.market);
                      const isHighlighted = activeKey === itemKey;
                      return (
                        <div key={`${cat.name}:${itemKey}`} className="flex items-center gap-1 px-1 py-0.5">
                          <CommandItem
                            onClick={() => selectSymbol(item.symbol, item.market)}
                            onMouseEnter={() => {
                              const idx = resultIndexMap.get(itemKey);
                              if (typeof idx === "number") setActiveIndex(idx);
                            }}
                            active={isHighlighted}
                            className="min-w-0 flex-1 gap-2"
                            style={{
                              background: isHighlighted
                                ? "color-mix(in srgb, var(--primary) 16%, transparent)"
                                : isActive
                                  ? "var(--secondary)"
                                  : undefined,
                            }}
                          >
                            <span
                              className="ds-type-caption rounded px-1 py-0.5 font-bold"
                              style={{
                                background: `color-mix(in srgb, ${badge.color} 18%, transparent)`,
                                color: badge.color,
                              }}
                            >
                              {badge.text}
                            </span>
                            {renderInstrumentLabel(item)}
                          </CommandItem>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              toggleFavorite(item.symbol, item.market);
                              trackUxAction("symbol_search", isFavorite ? "unfavorite_item" : "favorite_item");
                            }}
                            className="text-sm"
                            aria-label={isFavorite ? `${item.symbol} 즐겨찾기 해제` : `${item.symbol} 즐겨찾기 추가`}
                            aria-pressed={isFavorite}
                            title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                            style={{
                              color: isFavorite ? "var(--warning)" : "var(--muted-foreground)",
                            }}
                          >
                            {isFavorite ? "★" : "☆"}
                          </Button>
                        </div>
                      );
                    })}
                  </section>
                ))}

              {!favoriteOnly && apiResults.length > 0 && (
                <section>
                  <div className="ds-type-caption px-2 py-1 font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    검색 결과
                  </div>
                  {apiResults.map((item) => {
                    const itemKey = watchKey(item.symbol, item.market);
                    const isFavorite = favoriteSet.has(itemKey);
                    const isActive = symbol === item.symbol && market === item.market;
                    const badge = marketMeta(item.market);
                    const isHighlighted = activeKey === itemKey;
                    return (
                      <div key={`api-${itemKey}`} className="flex items-center gap-1 px-1 py-0.5">
                        <CommandItem
                          onClick={() => selectSymbol(item.symbol, item.market)}
                          onMouseEnter={() => {
                            const idx = resultIndexMap.get(itemKey);
                            if (typeof idx === "number") setActiveIndex(idx);
                          }}
                          active={isHighlighted}
                          className="min-w-0 flex-1 gap-2"
                          style={{
                            background: isHighlighted
                              ? "color-mix(in srgb, var(--primary) 16%, transparent)"
                              : isActive
                                ? "var(--secondary)"
                                : undefined,
                          }}
                        >
                          <span
                            className="ds-type-caption rounded px-1 py-0.5 font-bold"
                            style={{
                              background: `color-mix(in srgb, ${badge.color} 18%, transparent)`,
                              color: badge.color,
                            }}
                          >
                            {badge.text}
                          </span>
                          {renderInstrumentLabel(item)}
                          {item.exchange && (
                            <span className="ds-type-caption ml-auto truncate text-[var(--muted-foreground)]">
                              {item.exchange}
                            </span>
                          )}
                        </CommandItem>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            toggleFavorite(item.symbol, item.market);
                            trackUxAction("symbol_search", isFavorite ? "unfavorite_item" : "favorite_item");
                          }}
                          className="text-sm"
                          aria-label={isFavorite ? `${item.symbol} 즐겨찾기 해제` : `${item.symbol} 즐겨찾기 추가`}
                          aria-pressed={isFavorite}
                          title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                          style={{
                            color: isFavorite ? "var(--warning)" : "var(--muted-foreground)",
                          }}
                        >
                          {isFavorite ? "★" : "☆"}
                        </Button>
                      </div>
                    );
                  })}
                </section>
              )}

              {isSearching && (
                <div className="ds-type-caption px-3 py-2 text-[var(--muted-foreground)]">
                  검색 중...
                </div>
              )}

              {resultItems.length === 0 && !isSearching && <CommandEmpty>검색 결과가 없습니다</CommandEmpty>}
            </CommandList>

            <CommandSeparator />

            <div className="space-y-1.5 p-2">
              <SettingRow
                label="직접 입력"
                description="종목 코드를 입력해 바로 이동"
                hint={(
                  <div className="flex items-center justify-between">
                    <span>↑↓ 이동 · Enter 선택 · Esc 닫기</span>
                    <span>Ctrl/Cmd+K 검색</span>
                  </div>
                )}
              >
                <div className="flex gap-1.5">
                  <Input
                    type="text"
                    size="sm"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                    onKeyDown={handleManualKeyDown}
                    placeholder="종목 코드 직접 입력..."
                    spellCheck={false}
                    className="flex-1 font-mono"
                  />
                  <Button onClick={handleManualSubmit} size="sm" className="ds-type-caption px-2">
                    적용
                  </Button>
                </div>
              </SettingRow>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
}
