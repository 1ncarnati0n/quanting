import { useEffect, useMemo, useState } from "react";
import { fetchAnalysis, fetchWatchlistSnapshots } from "../services/tauriApi";
import { useSettingsStore } from "../stores/useSettingsStore";
import type { WatchlistSnapshot } from "../types";
import {
  getIntervalsForMarket,
  PRESET_CATEGORIES,
  getSymbolLabel,
  type PresetSymbol,
} from "../utils/constants";
import type { MarketType } from "../types";
import { formatPrice } from "../utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WatchlistSidebarProps {
  onClose?: () => void;
  onSelectSymbol?: () => void;
  embedded?: boolean;
}

type MarketFilter = "all" | MarketType;
type ScreenerCondition =
  | "strongBuy"
  | "rsiOversold"
  | "macdBullish"
  | "bbLowerTouch";
type ScreenerMode = "any" | "all";
type ScreenerSort = "scoreDesc" | "priceDesc" | "priceAsc" | "symbolAsc";

interface ScreenerPreset {
  id: string;
  name: string;
  mode: ScreenerMode;
  sort: ScreenerSort;
  conditions: ScreenerCondition[];
}

interface ScreenerHit {
  symbol: string;
  market: MarketType;
  reasons: string[];
  close: number;
  score: number;
}

const SNAPSHOT_REQUEST_SIZE = 18;
const SCREENER_PRESET_STORAGE_KEY = "quanting-screener-presets";

const SCREENER_CONDITION_ITEMS: { value: ScreenerCondition; label: string }[] = [
  { value: "strongBuy", label: "강매수" },
  { value: "rsiOversold", label: "RSI<30" },
  { value: "macdBullish", label: "MACD↑" },
  { value: "bbLowerTouch", label: "BB 하단" },
];

const DEFAULT_SCREENER_PRESETS: ScreenerPreset[] = [
  {
    id: "preset-momentum",
    name: "모멘텀",
    mode: "any",
    sort: "scoreDesc",
    conditions: ["strongBuy", "macdBullish"],
  },
  {
    id: "preset-rebound",
    name: "반등",
    mode: "all",
    sort: "scoreDesc",
    conditions: ["rsiOversold", "bbLowerTouch"],
  },
];

function normalizeConditions(conditions: unknown): ScreenerCondition[] {
  if (!Array.isArray(conditions)) return [];
  const seen = new Set<ScreenerCondition>();
  const next: ScreenerCondition[] = [];
  for (const condition of conditions) {
    if (
      condition === "strongBuy" ||
      condition === "rsiOversold" ||
      condition === "macdBullish" ||
      condition === "bbLowerTouch"
    ) {
      if (!seen.has(condition)) {
        seen.add(condition);
        next.push(condition);
      }
    }
  }
  return next;
}

function loadScreenerPresets(): ScreenerPreset[] {
  try {
    const raw = localStorage.getItem(SCREENER_PRESET_STORAGE_KEY);
    if (!raw) return DEFAULT_SCREENER_PRESETS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_SCREENER_PRESETS;

    const next: ScreenerPreset[] = parsed
      .filter((item) => item && typeof item.name === "string")
      .map((item): ScreenerPreset => ({
        id: typeof item.id === "string" ? item.id : `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: item.name as string,
        mode: item.mode === "all" ? "all" : "any",
        sort:
          item.sort === "priceDesc" ||
          item.sort === "priceAsc" ||
          item.sort === "symbolAsc"
            ? (item.sort as ScreenerSort)
            : "scoreDesc",
        conditions: normalizeConditions(item.conditions),
      }))
      .filter((item) => item.conditions.length > 0)
      .slice(0, 12);

    return next.length ? next : DEFAULT_SCREENER_PRESETS;
  } catch {
    return DEFAULT_SCREENER_PRESETS;
  }
}

function saveScreenerPresets(presets: ScreenerPreset[]) {
  try {
    localStorage.setItem(SCREENER_PRESET_STORAGE_KEY, JSON.stringify(presets));
  } catch {}
}

function snapshotKey(symbol: string, market: MarketType): string {
  return `${market}:${symbol}`;
}

function marketBadge(market: MarketType) {
  if (market === "crypto") return { text: "코인", color: "var(--warning-color)" };
  if (market === "krStock") return { text: "KR", color: "#EC4899" };
  if (market === "forex") return { text: "FX", color: "#14B8A6" };
  return { text: "US", color: "var(--accent-primary)" };
}

function evaluateScreenerCondition(
  condition: ScreenerCondition,
  response: Awaited<ReturnType<typeof fetchAnalysis>>,
): { matched: boolean; reason?: string; score: number } {
  const candles = response.candles;
  if (!candles.length) return { matched: false, score: 0 };
  const lastCandle = candles[candles.length - 1];
  if (!lastCandle) return { matched: false, score: 0 };

  if (condition === "strongBuy") {
    const recent = response.signals.slice(-4).find((signal) => signal.signalType === "strongBuy");
    if (!recent) return { matched: false, score: 0 };
    return { matched: true, reason: "강매수 시그널", score: 4 };
  }

  if (condition === "macdBullish") {
    const recent = response.signals.slice(-4).find((signal) => signal.signalType === "macdBullish");
    if (!recent) return { matched: false, score: 0 };
    return { matched: true, reason: "MACD 상승 크로스", score: 3 };
  }

  if (condition === "rsiOversold") {
    const lastRsi = response.rsi[response.rsi.length - 1];
    if (!lastRsi || lastRsi.value > 30) return { matched: false, score: 0 };
    return { matched: true, reason: `RSI ${lastRsi.value.toFixed(1)}`, score: 2 };
  }

  const lastBand = response.bollingerBands[response.bollingerBands.length - 1];
  if (!lastBand || lastCandle.close > lastBand.lower) return { matched: false, score: 0 };
  return { matched: true, reason: "BB 하단 터치", score: 2 };
}

function evaluateScreenerHit(
  conditions: ScreenerCondition[],
  mode: ScreenerMode,
  market: MarketType,
  response: Awaited<ReturnType<typeof fetchAnalysis>>,
): ScreenerHit | null {
  if (!conditions.length) return null;
  const candles = response.candles;
  if (!candles.length) return null;
  const lastCandle = candles[candles.length - 1];
  if (!lastCandle) return null;

  const evaluations = conditions.map((condition) =>
    evaluateScreenerCondition(condition, response),
  );
  const matched = evaluations.filter((result) => result.matched);

  if (mode === "all" && matched.length !== conditions.length) return null;
  if (mode === "any" && matched.length === 0) return null;

  const reasons = matched
    .map((result) => result.reason)
    .filter((reason): reason is string => Boolean(reason));
  const score =
    matched.reduce((sum, result) => sum + result.score, 0) +
    (mode === "all" ? matched.length * 0.4 : matched.length * 0.2);

  return {
    symbol: response.symbol,
    market,
    close: lastCandle.close,
    reasons,
    score,
  };
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
  const {
    symbol,
    market,
    interval,
    setSymbol,
    favorites,
    recentSymbols,
    toggleFavorite,
  } = useSettingsStore();
  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [screenerConditions, setScreenerConditions] = useState<ScreenerCondition[]>([
    "strongBuy",
  ]);
  const [screenerMode, setScreenerMode] = useState<ScreenerMode>("any");
  const [screenerSort, setScreenerSort] = useState<ScreenerSort>("scoreDesc");
  const [presetName, setPresetName] = useState("");
  const [screenerPresets, setScreenerPresets] =
    useState<ScreenerPreset[]>(loadScreenerPresets);
  const [screenerHits, setScreenerHits] = useState<ScreenerHit[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedAt, setLastScannedAt] = useState<number | null>(null);
  const [snapshots, setSnapshots] = useState<Record<string, WatchlistSnapshot>>(
    {},
  );
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);

  const activeLabel = getSymbolLabel(symbol);
  const favoriteSet = useMemo(
    () => new Set(favorites.map((item) => snapshotKey(item.symbol, item.market))),
    [favorites],
  );
  const isCurrentFavorite = favoriteSet.has(snapshotKey(symbol, market));

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hasQuery = q.length > 0;
    const items: PresetSymbol[] = [];

    for (const category of PRESET_CATEGORIES) {
      for (const item of category.items) {
        if (marketFilter !== "all" && item.market !== marketFilter) continue;
        if (favoriteOnly && !favoriteSet.has(snapshotKey(item.symbol, item.market))) continue;
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
    return items
      .filter((item) => {
        const key = snapshotKey(item.symbol, item.market);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const aFav = favoriteSet.has(snapshotKey(a.symbol, a.market));
        const bFav = favoriteSet.has(snapshotKey(b.symbol, b.market));
        if (aFav !== bFav) return aFav ? -1 : 1;
        const aStarts = hasQuery && a.symbol.toLowerCase().startsWith(q);
        const bStarts = hasQuery && b.symbol.toLowerCase().startsWith(q);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        return a.symbol.localeCompare(b.symbol);
      });
  }, [favoriteOnly, favoriteSet, marketFilter, query]);

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
  const screenerTargets = useMemo(() => {
    const preferred = favorites.length
      ? favorites
      : visibleItems.map((item) => ({ symbol: item.symbol, market: item.market }));
    const seen = new Set<string>();
    const deduped = preferred.filter((item) => {
      const key = snapshotKey(item.symbol, item.market);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return deduped.slice(0, 16);
  }, [favorites, visibleItems]);

  const toggleScreenerCondition = (condition: ScreenerCondition) => {
    setScreenerConditions((prev) => {
      const exists = prev.includes(condition);
      if (exists) {
        const next = prev.filter((item) => item !== condition);
        return next.length ? next : prev;
      }
      return [...prev, condition];
    });
  };

  const applyPreset = (preset: ScreenerPreset) => {
    setScreenerMode(preset.mode);
    setScreenerSort(preset.sort);
    setScreenerConditions(preset.conditions);
  };

  const saveCurrentPreset = () => {
    const name = presetName.trim();
    if (!name || screenerConditions.length === 0) return;

    const nextPreset: ScreenerPreset = {
      id: `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      mode: screenerMode,
      sort: screenerSort,
      conditions: screenerConditions,
    };

    setScreenerPresets((prev) => {
      const deduped = [
        nextPreset,
        ...prev.filter((preset) => preset.name !== nextPreset.name),
      ].slice(0, 12);
      saveScreenerPresets(deduped);
      return deduped;
    });
    setPresetName("");
  };

  const removePreset = (presetId: string) => {
    setScreenerPresets((prev) => {
      const next = prev.filter((preset) => preset.id !== presetId);
      saveScreenerPresets(next);
      return next.length ? next : DEFAULT_SCREENER_PRESETS;
    });
  };

  const selectSymbolFromWatch = (item: PresetSymbol) => {
    setSymbol(item.symbol, item.market);
    onSelectSymbol?.();
  };

  const runScreener = async () => {
    if (screenerConditions.length === 0) {
      setScreenerHits([]);
      return;
    }

    if (screenerTargets.length === 0) {
      setScreenerHits([]);
      return;
    }

    setIsScanning(true);
    try {
      const settings = useSettingsStore.getState();
      const checks = await Promise.all(
        screenerTargets.map(async (target) => {
          try {
            const validIntervals = getIntervalsForMarket(target.market);
            const targetInterval = validIntervals.includes(interval) ? interval : "1d";
            const response = await fetchAnalysis({
              symbol: target.symbol,
              market: target.market,
              interval: targetInterval,
              bbPeriod: settings.indicators.bb.period,
              bbMultiplier: settings.indicators.bb.multiplier,
              rsiPeriod: settings.indicators.rsi.period,
              smaPeriods: [],
              emaPeriods: [],
              macd: null,
              stochastic: null,
              showVolume: false,
              showObv: false,
              signalFilter: settings.indicators.signalFilter,
            });
            return evaluateScreenerHit(
              screenerConditions,
              screenerMode,
              target.market,
              response,
            );
          } catch {
            return null;
          }
        }),
      );
      const hits = checks
        .filter((item): item is ScreenerHit => item !== null)
        .sort((a, b) => {
          if (screenerSort === "priceAsc") return a.close - b.close;
          if (screenerSort === "priceDesc") return b.close - a.close;
          if (screenerSort === "symbolAsc") return a.symbol.localeCompare(b.symbol);
          if (Math.abs(b.score - a.score) > 1e-9) return b.score - a.score;
          return a.symbol.localeCompare(b.symbol);
        });
      setScreenerHits(hits);
      setLastScannedAt(Date.now());
    } finally {
      setIsScanning(false);
    }
  };

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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[var(--text-secondary)]"
            onClick={() => toggleFavorite(symbol, market)}
            title={isCurrentFavorite ? "현재 종목 즐겨찾기 해제" : "현재 종목 즐겨찾기 추가"}
          >
            {isCurrentFavorite ? "★" : "☆"}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-[var(--text-secondary)]"
              title="관심종목 닫기"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      <div className="p-3">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="심볼 검색..."
          spellCheck={false}
          className="h-8 text-sm"
        />
        <div className="mt-2 flex gap-1">
          {(["all", "usStock", "krStock", "crypto", "forex"] as const).map((mf) => (
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
                : mf === "crypto"
                ? "코인"
                : "FX"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFavoriteOnly((prev) => !prev)}
            className="rounded px-2 py-1 text-[10px] font-medium"
            style={{
              background: favoriteOnly ? "var(--warning-color)" : "var(--bg-tertiary)",
              color: favoriteOnly ? "#111827" : "var(--text-secondary)",
              border: `1px solid ${favoriteOnly ? "var(--warning-color)" : "var(--border-color)"}`,
            }}
            title="즐겨찾기 종목만 보기"
          >
            ★ 즐겨찾기
          </button>
        </div>
        <div className="mt-1 text-[10px]" style={{ color: "var(--text-secondary)" }}>
          표시 {visibleItems.length}개 · 즐겨찾기 {favorites.length}개
        </div>

        {recentSymbols.length > 0 && (
          <div className="mt-2">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              최근 심볼
            </div>
            <div className="flex flex-wrap gap-1">
              {recentSymbols.slice(0, 6).map((item) => (
                <button
                  key={`recent-chip-${item.market}-${item.symbol}`}
                  type="button"
                  onClick={() => {
                    setSymbol(item.symbol, item.market);
                    onSelectSymbol?.();
                  }}
                  className="rounded px-1.5 py-0.5 text-[10px] font-mono"
                  style={{
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                  }}
                >
                  {item.symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          className="mt-2 rounded border p-2"
          style={{ borderColor: "var(--border-color)", background: "var(--surface-elevated)" }}
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              기술 스크리너
            </span>
            <button
              type="button"
              className="rounded px-2 py-1 text-[10px] font-semibold"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent-primary)",
                border: "1px solid var(--border-color)",
              }}
              onClick={runScreener}
              disabled={isScanning}
            >
              {isScanning ? "스캔 중..." : "스캔 실행"}
            </button>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-1">
            {SCREENER_CONDITION_ITEMS.map((rule) => {
              const active = screenerConditions.includes(rule.value);
              return (
                <button
                  key={rule.value}
                  type="button"
                  onClick={() => toggleScreenerCondition(rule.value)}
                  className="rounded px-2 py-1 text-[10px] font-medium"
                  style={{
                    background: active ? "var(--accent-primary)" : "var(--bg-tertiary)",
                    color: active ? "var(--accent-contrast)" : "var(--text-secondary)",
                    border: `1px solid ${active ? "var(--accent-primary)" : "var(--border-color)"}`,
                  }}
                >
                  {rule.label}
                </button>
              );
            })}
          </div>
          <div className="mb-1.5 grid grid-cols-2 gap-1">
            {([
              { value: "any" as const, label: "ANY(OR)" },
              { value: "all" as const, label: "ALL(AND)" },
            ] as const).map((modeOption) => (
              <button
                key={modeOption.value}
                type="button"
                onClick={() => setScreenerMode(modeOption.value)}
                className="rounded px-2 py-1 text-[10px] font-medium"
                style={{
                  background:
                    screenerMode === modeOption.value
                      ? "color-mix(in srgb, var(--warning-color) 22%, transparent)"
                      : "var(--bg-tertiary)",
                  color:
                    screenerMode === modeOption.value
                      ? "var(--warning-color)"
                      : "var(--text-secondary)",
                  border: `1px solid ${
                    screenerMode === modeOption.value
                      ? "var(--warning-color)"
                      : "var(--border-color)"
                  }`,
                }}
              >
                {modeOption.label}
              </button>
            ))}
          </div>
          <div className="mb-2 flex flex-wrap gap-1">
            {([
              { value: "scoreDesc" as const, label: "점수" },
              { value: "priceDesc" as const, label: "가격↓" },
              { value: "priceAsc" as const, label: "가격↑" },
              { value: "symbolAsc" as const, label: "심볼" },
            ] as const).map((sortOption) => (
              <button
                key={sortOption.value}
                type="button"
                onClick={() => setScreenerSort(sortOption.value)}
                className="rounded px-2 py-0.5 text-[10px]"
                style={{
                  background:
                    screenerSort === sortOption.value ? "var(--accent-soft)" : "var(--bg-tertiary)",
                  color:
                    screenerSort === sortOption.value ? "var(--accent-primary)" : "var(--text-secondary)",
                  border: `1px solid ${
                    screenerSort === sortOption.value ? "var(--accent-primary)" : "var(--border-color)"
                  }`,
                }}
              >
                {sortOption.label}
              </button>
            ))}
          </div>
          <div className="mb-1.5 flex gap-1">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="h-6 text-[10px]"
              placeholder="프리셋 이름"
            />
            <button
              type="button"
              className="rounded px-2 py-1 text-[10px] font-semibold"
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
              }}
              onClick={saveCurrentPreset}
              disabled={!presetName.trim() || screenerConditions.length === 0}
            >
              저장
            </button>
          </div>
          <ScrollArea className="mb-2 max-h-14" viewportClassName="space-y-1 pr-1">
            {screenerPresets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between gap-1 rounded border px-1.5 py-1"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-tertiary)",
                }}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left text-[10px]"
                  style={{ color: "var(--text-primary)" }}
                  onClick={() => applyPreset(preset)}
                  title={`${preset.name} 적용`}
                >
                  {preset.name} · {preset.mode.toUpperCase()} · {preset.conditions.length}조건
                </button>
                <button
                  type="button"
                  className="rounded px-1 text-[10px]"
                  style={{ color: "var(--text-secondary)" }}
                  onClick={() => removePreset(preset.id)}
                  title="프리셋 삭제"
                >
                  X
                </button>
              </div>
            ))}
          </ScrollArea>
          <ScrollArea className="max-h-24" viewportClassName="space-y-1 pr-1">
            {screenerHits.slice(0, 8).map((hit) => (
              <button
                key={`hit-${hit.market}-${hit.symbol}`}
                type="button"
                className="w-full rounded border px-2 py-1 text-left text-[10px]"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                }}
                onClick={() => {
                  setSymbol(hit.symbol, hit.market);
                  onSelectSymbol?.();
                }}
              >
                <div className="flex items-center justify-between gap-2 font-mono">
                  <span>{hit.symbol}</span>
                  <span>{formatPrice(hit.close, hit.market)}</span>
                </div>
                <div style={{ color: "var(--text-secondary)" }}>
                  {hit.reasons.join(" · ")}
                </div>
                <div className="font-mono text-[9px]" style={{ color: "var(--accent-primary)" }}>
                  score {hit.score.toFixed(1)}
                </div>
              </button>
            ))}
            {screenerHits.length === 0 && (
              <div className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                {lastScannedAt ? "조건 일치 종목이 없습니다." : "조건 선택 후 스캔 실행"}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1" viewportClassName="px-2 pb-3">
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const badge = marketBadge(item.market);
            const active = symbol === item.symbol && market === item.market;
            const itemKey = snapshotKey(item.symbol, item.market);
            const isFavorite = favoriteSet.has(itemKey);
            return (
              <div
                key={itemKey}
                role="button"
                tabIndex={0}
                onClick={() => selectSymbolFromWatch(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectSymbolFromWatch(item);
                  }
                }}
                className="w-full rounded-md border px-2.5 py-2 text-left transition-colors"
                style={{
                  background: active
                    ? "color-mix(in srgb, var(--accent-primary) 10%, var(--bg-tertiary))"
                    : "transparent",
                  borderColor: active ? "var(--accent-primary)" : "var(--border-color)",
                  cursor: "pointer",
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
                  <div className="shrink-0 flex items-start gap-1.5">
                    <div className="text-right">
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.symbol, item.market);
                      }}
                      className="rounded px-1 py-0.5 text-sm leading-none"
                      title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                      style={{
                        color: isFavorite ? "var(--warning-color)" : "var(--text-secondary)",
                      }}
                    >
                      {isFavorite ? "★" : "☆"}
                    </button>
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
              </div>
            );
          })}
          {visibleItems.length === 0 && (
            <div className="rounded border px-3 py-4 text-center text-xs" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
              {favoriteOnly ? "즐겨찾기 종목이 없습니다" : "심볼이 없습니다"}
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
