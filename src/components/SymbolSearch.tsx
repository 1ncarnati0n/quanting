import { useState, useRef, useEffect, useMemo, type KeyboardEvent } from "react";
import { useSettingsStore } from "../stores/useSettingsStore";
import { PRESET_CATEGORIES, getSymbolLabel, detectMarket } from "../utils/constants";
import type { MarketType } from "../types";
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

function watchKey(symbol: string, market: MarketType): string {
  return `${market}:${symbol}`;
}

function marketMeta(market: MarketType) {
  if (market === "crypto") return { text: "코인", color: "var(--warning-color)" };
  if (market === "krStock") return { text: "KR", color: "#EC4899" };
  return { text: "US", color: "var(--accent-primary)" };
}

export default function SymbolSearch() {
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setFilter("");
      setManualInput("");
      setFavoriteOnly(false);
      setActiveIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    const openFromShortcut = () => setIsOpen(true);
    window.addEventListener("quanting:open-symbol-search", openFromShortcut as EventListener);
    return () =>
      window.removeEventListener("quanting:open-symbol-search", openFromShortcut as EventListener);
  }, []);

  const lowerFilter = filter.toLowerCase();
  const favoriteSet = useMemo(
    () => new Set(favorites.map((item) => watchKey(item.symbol, item.market))),
    [favorites],
  );

  const favoriteItems = useMemo(
    () =>
      favorites
        .map((item) => ({
          ...item,
          label: getSymbolLabel(item.symbol) ?? "사용자 즐겨찾기",
        }))
        .filter(
          (item) =>
            item.symbol.toLowerCase().includes(lowerFilter) ||
            item.label.toLowerCase().includes(lowerFilter),
        ),
    [favorites, lowerFilter],
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
          if (!lowerFilter) return true;
          return (
            item.symbol.toLowerCase().includes(lowerFilter) ||
            item.label.toLowerCase().includes(lowerFilter)
          );
        }),
    [favoriteOnly, favoriteSet, lowerFilter, recentSymbols],
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
    [favoriteOnly, favoriteSet, lowerFilter],
  );

  const resultItems = useMemo(() => {
    const ordered: Array<{ symbol: string; market: MarketType; label: string }> = [];
    const seen = new Set<string>();
    const addUnique = (item: { symbol: string; market: MarketType; label: string }) => {
      const key = watchKey(item.symbol, item.market);
      if (seen.has(key)) return;
      seen.add(key);
      ordered.push(item);
    };

    if (!favoriteOnly) {
      recentItems.forEach(addUnique);
      filteredCategories.forEach((cat) => cat.items.forEach((item) => addUnique(item)));
    }
    favoriteItems.forEach(addUnique);
    return ordered;
  }, [favoriteItems, favoriteOnly, filteredCategories, recentItems]);

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
    setIsOpen(false);
  };

  const handleManualSubmit = () => {
    const trimmed = manualInput.trim().toUpperCase();
    if (trimmed) {
      setSymbol(trimmed, detectMarket(trimmed));
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

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => toggleFavorite(symbol, market)}
          title={isCurrentFavorite ? "현재 종목 즐겨찾기 해제" : "현재 종목 즐겨찾기 추가"}
        >
          {isCurrentFavorite ? "★" : "☆"}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[min(100%-2rem,620px)] overflow-hidden p-0">
          <Command className="h-[min(72vh,580px)] rounded-none border-0 bg-[var(--surface-elevated)]">
            <div className="border-b border-[var(--border-color)] p-2.5">
              <CommandInput
                ref={inputRef}
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                onKeyDown={handleFilterKeyDown}
                placeholder="심볼 검색..."
                spellCheck={false}
                className="h-8 rounded-md border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-sm"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                  즐겨찾기 {favorites.length}개 · 최근 {recentSymbols.length}개
                </div>
                <Button
                  type="button"
                  onClick={() => setFavoriteOnly((prev) => !prev)}
                  variant={favoriteOnly ? "default" : "secondary"}
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                >
                  즐겨찾기만
                </Button>
              </div>
            </div>

            <CommandList className="px-1.5 py-1">
              {!favoriteOnly && recentItems.length > 0 && (
                <section>
                  <div
                    className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span>최근</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px]"
                      onClick={clearRecentSymbols}
                      title="최근 심볼 목록 비우기"
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
                          className="min-w-0 flex-1 gap-2 py-1.5"
                          style={{
                            background: isHighlighted
                              ? "color-mix(in srgb, var(--accent-primary) 16%, transparent)"
                              : isActive
                                ? "var(--bg-tertiary)"
                                : undefined,
                          }}
                        >
                          <span
                            className="rounded px-1 py-0.5 text-[9px] font-bold"
                            style={{
                              background: `color-mix(in srgb, ${badge.color} 18%, transparent)`,
                              color: badge.color,
                            }}
                          >
                            {badge.text}
                          </span>
                          <span className="min-w-[72px] font-mono text-xs">{item.symbol}</span>
                          <span className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                            {item.label}
                          </span>
                        </CommandItem>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(item.symbol, item.market)}
                          className="h-7 w-7 text-[13px]"
                          title={favoriteSet.has(key) ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                          style={{
                            color: favoriteSet.has(key) ? "var(--warning-color)" : "var(--text-secondary)",
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
                  <div
                    className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--text-secondary)" }}
                  >
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
                          className="min-w-0 flex-1 gap-2 py-1.5"
                          style={{
                            background: isHighlighted
                              ? "color-mix(in srgb, var(--accent-primary) 16%, transparent)"
                              : isActive
                                ? "var(--bg-tertiary)"
                                : undefined,
                          }}
                        >
                          <span
                            className="rounded px-1 py-0.5 text-[9px] font-bold"
                            style={{
                              background: `color-mix(in srgb, ${badge.color} 18%, transparent)`,
                              color: badge.color,
                            }}
                          >
                            {badge.text}
                          </span>
                          <span className="min-w-[72px] font-mono text-xs">{item.symbol}</span>
                          <span className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                            {item.label}
                          </span>
                        </CommandItem>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(item.symbol, item.market)}
                          className="h-7 w-7 text-[13px]"
                          title="즐겨찾기 해제"
                          style={{ color: "var(--warning-color)" }}
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
                    <div
                      className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
                    >
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
                            className="min-w-0 flex-1 gap-2 py-1.5"
                            style={{
                              background: isHighlighted
                                ? "color-mix(in srgb, var(--accent-primary) 16%, transparent)"
                                : isActive
                                  ? "var(--bg-tertiary)"
                                  : undefined,
                            }}
                          >
                            <span
                              className="rounded px-1 py-0.5 text-[9px] font-bold"
                              style={{
                                background: `color-mix(in srgb, ${badge.color} 18%, transparent)`,
                                color: badge.color,
                              }}
                            >
                              {badge.text}
                            </span>
                            <span className="min-w-[72px] font-mono text-xs">{item.symbol}</span>
                            <span className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                              {item.label}
                            </span>
                          </CommandItem>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(item.symbol, item.market)}
                            className="h-7 w-7 text-[13px]"
                            title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                            style={{
                              color: isFavorite ? "var(--warning-color)" : "var(--text-secondary)",
                            }}
                          >
                            {isFavorite ? "★" : "☆"}
                          </Button>
                        </div>
                      );
                    })}
                  </section>
                ))}

              {resultItems.length === 0 && <CommandEmpty>검색 결과가 없습니다</CommandEmpty>}
            </CommandList>

            <CommandSeparator />

            <div className="flex gap-1.5 p-2">
              <Input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                onKeyDown={handleManualKeyDown}
                placeholder="티커 직접 입력..."
                spellCheck={false}
                className="h-7 flex-1 font-mono text-xs"
              />
              <Button onClick={handleManualSubmit} size="sm" className="h-7 px-2 text-xs">
                적용
              </Button>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
}
