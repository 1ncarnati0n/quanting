import { memo, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { fetchAnalysis, fetchWatchlistSnapshots, searchSymbols } from "../services/tauriApi";
import { useSettingsStore, type WorkspaceView } from "../stores/useSettingsStore";
import type { SymbolSearchResult, WatchlistSnapshot } from "../types";
import {
  getIntervalLabel,
  getIntervalsForMarket,
  PRESET_CATEGORIES,
  getSymbolLabel,
  type Interval,
  type PresetSymbol,
} from "../utils/constants";
import type { MarketType } from "../types";
import { formatPrice } from "../utils/formatters";
import { formatInstrumentDisplayLine, getInstrumentDisplay } from "../utils/marketView";
import { trackUxAction } from "../utils/uxMetrics";
import PanelHeader from "./patterns/PanelHeader";
import SegmentButton from "./patterns/SegmentButton";
import SettingRow from "./patterns/SettingRow";
import StatePanel from "./patterns/StatePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import QuantingLogo from "./QuantingLogo";

interface WatchlistSidebarProps {
  onClose?: () => void;
  onSelectSymbol?: () => void;
  embedded?: boolean;
  showWorkspaceChrome?: boolean;
  workspaceView?: WorkspaceView;
  onSelectDashboard?: () => void;
  onOpenMarkets?: () => void;
  onSelectStrategy?: () => void;
  onOpenAlerts?: () => void;
  onOpenSettings?: () => void;
}

type MarketFilter = "all" | MarketType;
type ScreenerCondition =
  | "quantBuy"
  | "rsiOversold"
  | "macdHistBuy"
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
const WATCHLIST_INITIAL_RENDER_COUNT = 48;
const WATCHLIST_RENDER_STEP = 32;
const SCREENER_PRESET_STORAGE_KEY = "quanting-screener-presets";
type SnapshotLoadingStage = "idle" | "initial" | "refresh";

const SCREENER_CONDITION_ITEMS: { value: ScreenerCondition; label: string }[] = [
  { value: "quantBuy", label: "퀀트매수" },
  { value: "rsiOversold", label: "RSI<30" },
  { value: "macdHistBuy", label: "MACD Hist↑" },
  { value: "bbLowerTouch", label: "BB 하단" },
];

const DEFAULT_SCREENER_PRESETS: ScreenerPreset[] = [
  {
    id: "preset-momentum",
    name: "모멘텀",
    mode: "any",
    sort: "scoreDesc",
    conditions: ["quantBuy", "macdHistBuy"],
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
      condition === "quantBuy" ||
      condition === "rsiOversold" ||
      condition === "macdHistBuy" ||
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
  if (market === "crypto") return { text: "코인", color: "var(--warning)" };
  if (market === "krStock") return { text: "KR", color: "var(--brand-kr)" };
  if (market === "forex") return { text: "FX", color: "var(--brand-fx)" };
  return { text: "US", color: "var(--primary)" };
}

function evaluateScreenerCondition(
  condition: ScreenerCondition,
  response: Awaited<ReturnType<typeof fetchAnalysis>>,
): { matched: boolean; reason?: string; score: number } {
  const candles = response.candles;
  if (!candles.length) return { matched: false, score: 0 };
  const lastCandle = candles[candles.length - 1];
  if (!lastCandle) return { matched: false, score: 0 };

  if (condition === "quantBuy") {
    const quantBuyTypes = new Set([
      "supertrendBuy", "emaCrossoverBuy", "stochRsiBuy", "cmfObvBuy",
      "ttmSqueezeBuy", "vwapBreakoutBuy", "parabolicSarBuy",
      "macdHistReversalBuy", "ibsMeanRevBuy", "rsiDivergenceBuy",
    ]);
    const recent = response.signals.slice(-4).find((signal) => quantBuyTypes.has(signal.signalType));
    if (!recent) return { matched: false, score: 0 };
    return { matched: true, reason: "퀀트 매수 시그널", score: 4 };
  }

  if (condition === "macdHistBuy") {
    const recent = response.signals.slice(-4).find((signal) => signal.signalType === "macdHistReversalBuy");
    if (!recent) return { matched: false, score: 0 };
    return { matched: true, reason: "MACD Hist 반전↑", score: 3 };
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

const Sparkline = memo(function Sparkline({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  const width = 112;
  const height = 28;
  const points = useMemo(() => {
    if (!values || values.length < 2) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1e-9);
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * (width - 2) + 1;
        const y = height - 1 - ((v - min) / range) * (height - 2);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [values]);

  if (!points) {
    return <div className="h-8 w-full rounded border border-dashed border-[var(--border)] opacity-50" />;
  }

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
});

function WorkspaceNavButton({
  active = false,
  label,
  description,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  description: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`workspace-sidebar__nav-item ${active ? "is-active" : ""}`}
    >
      <span className="workspace-sidebar__nav-icon">{children}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="workspace-sidebar__nav-label">{label}</span>
        <span className="workspace-sidebar__nav-description">{description}</span>
      </span>
    </button>
  );
}

export default function WatchlistSidebar({
  onClose,
  onSelectSymbol,
  embedded = false,
  showWorkspaceChrome = false,
  workspaceView = "dashboard",
  onSelectDashboard,
  onOpenMarkets,
  onSelectStrategy,
  onOpenAlerts,
  onOpenSettings,
}: WatchlistSidebarProps) {
  const {
    symbol,
    market,
    interval,
    setSymbol,
    favorites,
    customSymbols,
    recentSymbols,
    toggleFavorite,
    addCustomSymbol,
    removeCustomSymbol,
  } = useSettingsStore();
  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [screenerConditions, setScreenerConditions] = useState<ScreenerCondition[]>([
    "quantBuy",
  ]);
  const [screenerMode, setScreenerMode] = useState<ScreenerMode>("any");
  const [screenerSort, setScreenerSort] = useState<ScreenerSort>("scoreDesc");
  const [presetName, setPresetName] = useState("");
  const [screenerPresets, setScreenerPresets] =
    useState<ScreenerPreset[]>(loadScreenerPresets);
  const [screenerHits, setScreenerHits] = useState<ScreenerHit[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedAt, setLastScannedAt] = useState<number | null>(null);
  const [snapshotLoadingStage, setSnapshotLoadingStage] =
    useState<SnapshotLoadingStage>("idle");
  const [lastSnapshotUpdatedAt, setLastSnapshotUpdatedAt] = useState<number | null>(null);
  const [renderLimit, setRenderLimit] = useState(WATCHLIST_INITIAL_RENDER_COUNT);
  const [snapshots, setSnapshots] = useState<Record<string, WatchlistSnapshot>>(
    {},
  );
  const [apiSearchResults, setApiSearchResults] = useState<SymbolSearchResult[]>([]);
  const [isApiSearching, setIsApiSearching] = useState(false);
  const listAreaRef = useRef<HTMLDivElement | null>(null);
  const listSentinelRef = useRef<HTMLDivElement | null>(null);
  const watchItemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const snapshotsRef = useRef<Record<string, WatchlistSnapshot>>({});
  const searchVersionRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const activeLabel = getSymbolLabel(symbol);
  const instrumentLine = formatInstrumentDisplayLine(symbol, activeLabel, market);
  const favoriteSet = useMemo(
    () => new Set(favorites.map((item) => snapshotKey(item.symbol, item.market))),
    [favorites],
  );
  const isCurrentFavorite = favoriteSet.has(snapshotKey(symbol, market));
  const customSymbolSet = useMemo(
    () => new Set(customSymbols.map((item) => snapshotKey(item.symbol, item.market))),
    [customSymbols],
  );

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

    for (const item of customSymbols) {
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
  }, [customSymbols, favoriteOnly, favoriteSet, marketFilter, query]);
  const deferredVisibleItems = useDeferredValue(visibleItems);

  useEffect(() => {
    snapshotsRef.current = snapshots;
  }, [snapshots]);

  useEffect(() => {
    setRenderLimit(WATCHLIST_INITIAL_RENDER_COUNT);
  }, [favoriteOnly, marketFilter, query]);

  useEffect(() => {
    setRenderLimit((prev) =>
      Math.min(
        Math.max(WATCHLIST_INITIAL_RENDER_COUNT, prev),
        Math.max(WATCHLIST_INITIAL_RENDER_COUNT, deferredVisibleItems.length),
      ),
    );
  }, [deferredVisibleItems.length]);

  const renderedItems = useMemo(
    () => deferredVisibleItems.slice(0, renderLimit),
    [deferredVisibleItems, renderLimit],
  );
  const hasMoreItems = renderLimit < deferredVisibleItems.length;

  useEffect(() => {
    watchItemRefs.current = watchItemRefs.current.slice(0, renderedItems.length);
  }, [renderedItems.length]);

  const snapshotTargets = useMemo(
    () =>
      deferredVisibleItems
        .slice(0, SNAPSHOT_REQUEST_SIZE)
        .map(({ symbol: targetSymbol, market }) => ({
          symbol: targetSymbol,
          market,
        })),
    [deferredVisibleItems],
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
    trackUxAction("watchlist", "select_symbol");
    setSymbol(item.symbol, item.market);
    onSelectSymbol?.();
  };

  const focusCurrentMarket = () => {
    trackUxAction("watchlist", "filter_current_market");
    setMarketFilter(market);
    if (favoriteOnly) {
      setFavoriteOnly(false);
    }
  };

  const resetWatchFilters = () => {
    trackUxAction("watchlist", "reset_filters");
    setQuery("");
    setMarketFilter("all");
    setFavoriteOnly(false);
  };

  const runScreener = async () => {
    trackUxAction("watchlist", "run_screener");
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
              showObv: false,
              signalStrategies: settings.indicators.signalStrategies,
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
    const q = query.trim();
    if (q.length < 2) {
      setApiSearchResults([]);
      setIsApiSearching(false);
      return;
    }

    setIsApiSearching(true);
    const version = ++searchVersionRef.current;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchSymbols({
          query: q,
          marketFilter: marketFilter === "all" ? null : marketFilter,
        });
        if (searchVersionRef.current !== version) return;

        const presetKeys = new Set<string>();
        for (const cat of PRESET_CATEGORIES) {
          for (const item of cat.items) {
            presetKeys.add(snapshotKey(item.symbol, item.market));
          }
        }
        const filtered = results.filter(
          (r) => !presetKeys.has(snapshotKey(r.symbol, r.market)) && !customSymbolSet.has(snapshotKey(r.symbol, r.market)),
        );
        setApiSearchResults(filtered.slice(0, 8));
      } catch {
        if (searchVersionRef.current === version) setApiSearchResults([]);
      } finally {
        if (searchVersionRef.current === version) setIsApiSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, marketFilter, customSymbolSet]);

  useEffect(() => {
    let cancelled = false;
    if (snapshotTargets.length === 0) return () => {};

    const timer = window.setTimeout(async () => {
      const hasCachedSnapshot = snapshotTargets.some((target) =>
        Boolean(snapshotsRef.current[snapshotKey(target.symbol, target.market)]),
      );
      setSnapshotLoadingStage(hasCachedSnapshot ? "refresh" : "initial");
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
      } catch (error) {
        if (!cancelled) {
          console.warn("watchlist snapshot fetch failed:", error);
        }
      } finally {
        if (!cancelled) {
          setSnapshotLoadingStage("idle");
        }
      }
    }, 160);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [interval, snapshotTargets]);

  useEffect(() => {
    if (!hasMoreItems) return;
    const root = listAreaRef.current?.firstElementChild as Element | null;
    const sentinel = listSentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setRenderLimit((prev) =>
          Math.min(deferredVisibleItems.length, prev + WATCHLIST_RENDER_STEP),
        );
      },
      {
        root,
        rootMargin: "220px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [deferredVisibleItems.length, hasMoreItems]);

  const snapshotSubtitle = useMemo(() => {
    if (snapshotLoadingStage === "initial") return "스냅샷 초기 로딩중";
    if (snapshotLoadingStage === "refresh") return "스냅샷 갱신중";
    const base = `${getIntervalLabel(interval as Interval)} 기준 스냅샷`;
    if (!lastSnapshotUpdatedAt) return base;
    return `${base} · ${new Date(lastSnapshotUpdatedAt).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })} 업데이트`;
  }, [interval, lastSnapshotUpdatedAt, snapshotLoadingStage]);

  return (
    <aside
      className={`panel-readable side-panel-shell workspace-sidebar flex h-full min-w-0 flex-col bg-[var(--card)] ${
        showWorkspaceChrome ? "workspace-sidebar--chrome" : ""
      } ${
        embedded
          ? "w-full"
          : "w-[min(22rem,calc(100vw-1rem))] border-l border-[var(--border)] shadow-[var(--shadow-elevated)]"
      }`}
      role="region"
      aria-label="관심종목 사이드바"
    >
      {showWorkspaceChrome ? (
        <div className="workspace-sidebar__chrome border-b border-[var(--border)]">
          <div className="workspace-sidebar__brand-panel">
            <div className="workspace-sidebar__brand-mark">
              <QuantingLogo size={18} color="currentColor" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="workspace-sidebar__brand-title">QuantAI</div>
              <div className="workspace-sidebar__brand-subtitle">Pro Analyst</div>
            </div>
          </div>

          <nav className="workspace-sidebar__nav" aria-label="워크스페이스 네비게이션">
            <WorkspaceNavButton
              active={workspaceView === "dashboard"}
              label="Dashboard"
              description="차트 워크스페이스"
              onClick={onSelectDashboard}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </WorkspaceNavButton>
            <WorkspaceNavButton
              label="Markets"
              description="심볼 검색 · 워치리스트"
              onClick={onOpenMarkets}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17l5-5 4 4 8-8" />
                <path d="M14 8h6v6" />
              </svg>
            </WorkspaceNavButton>
            <WorkspaceNavButton
              active={workspaceView === "strategy"}
              label="Strategy Lab"
              description="백테스트 · 전술 연구"
              onClick={onSelectStrategy}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19h16" />
                <path d="M6 16V9" />
                <path d="M12 16V5" />
                <path d="M18 16v-4" />
              </svg>
            </WorkspaceNavButton>
            <WorkspaceNavButton
              label="Alerts"
              description="가격 알림 · 이벤트"
              onClick={onOpenAlerts}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                <path d="M10 17a2 2 0 0 0 4 0" />
              </svg>
            </WorkspaceNavButton>
            <WorkspaceNavButton
              label="Settings"
              description="지표 · 화면 설정"
              onClick={onOpenSettings}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .92 1.7 1.7 0 0 1-3.2 0 1.7 1.7 0 0 0-1-.92 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.92-1 1.7 1.7 0 0 1 0-3.2 1.7 1.7 0 0 0 .92-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.92 1.7 1.7 0 0 1 3.2 0 1.7 1.7 0 0 0 1 .92 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.24.39.57.7.96.89a1.7 1.7 0 0 1 0 3.2c-.39.19-.72.5-.96.91Z" />
              </svg>
            </WorkspaceNavButton>
          </nav>
        </div>
      ) : (
        <PanelHeader
          title="관심종목"
          subtitle={`${instrumentLine} · ${snapshotSubtitle}`}
          className="px-4 py-3"
          density="compact"
          actionAlign="start"
          actions={(
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-[var(--muted-foreground)]"
                onClick={() => toggleFavorite(symbol, market)}
                title={isCurrentFavorite ? "현재 종목 즐겨찾기 해제" : "현재 종목 즐겨찾기 추가"}
                aria-pressed={isCurrentFavorite}
              >
                {isCurrentFavorite ? "★" : "☆"}
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-[var(--muted-foreground)]"
                  title="관심종목 닫기"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </>
          )}
        />
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {snapshotLoadingStage === "initial"
          ? "관심종목 스냅샷을 초기 로딩 중입니다."
          : snapshotLoadingStage === "refresh"
            ? "관심종목 스냅샷을 갱신 중입니다."
            : "관심종목 스냅샷이 갱신되었습니다."}
      </span>

      <div className={showWorkspaceChrome ? "workspace-sidebar__body side-panel-stack px-3 pb-3 pt-3" : "side-panel-stack px-3 pb-2.5 pt-3"}>
        {showWorkspaceChrome && (
          <div className="workspace-sidebar__section-head">
            <div className="min-w-0 flex-1">
              <div className="workspace-sidebar__section-label">Watchlist</div>
              <div className="workspace-sidebar__section-subtitle">{snapshotSubtitle}</div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-[var(--muted-foreground)]"
                onClick={() => toggleFavorite(symbol, market)}
                title={isCurrentFavorite ? "현재 종목 즐겨찾기 해제" : "현재 종목 즐겨찾기 추가"}
                aria-pressed={isCurrentFavorite}
              >
                {isCurrentFavorite ? "★" : "☆"}
              </Button>
            </div>
          </div>
        )}
        <section className="side-panel-section side-panel-stack-tight">
          <Input
            type="text"
            size="md"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="심볼 검색..."
            aria-label="관심종목 심볼 검색"
            spellCheck={false}
            className="ds-type-label"
          />
          <div className="grid grid-cols-5 gap-1">
            {(["all", "usStock", "krStock", "crypto", "forex"] as const).map((mf) => (
              <SegmentButton
                key={mf}
                type="button"
                size="sm"
                className="w-full"
                active={marketFilter === mf}
                onClick={() => {
                  setMarketFilter(mf);
                  trackUxAction("watchlist", `filter_market_${mf}`);
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
              </SegmentButton>
            ))}
          </div>
          <div className="ds-type-caption text-[var(--muted-foreground)]">
            표시 {visibleItems.length}개 · 렌더 {Math.min(renderedItems.length, visibleItems.length)}개 · 즐겨찾기 {favorites.length}개{customSymbols.length > 0 && ` · 사용자 ${customSymbols.length}개`}
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="ds-type-caption font-semibold"
              onClick={focusCurrentMarket}
              aria-pressed={marketFilter === market && !favoriteOnly}
            >
              현재 시장만
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="ds-type-caption font-semibold"
              onClick={() => {
                trackUxAction("watchlist", favoriteOnly ? "show_all" : "filter_favorite_only");
                setFavoriteOnly((prev) => !prev);
              }}
              aria-pressed={favoriteOnly}
            >
              {favoriteOnly ? "전체 보기" : "즐겨찾기만"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ds-type-caption text-[var(--muted-foreground)]"
              onClick={resetWatchFilters}
            >
              필터 초기화
            </Button>
          </div>

          {recentSymbols.length > 0 && (
            <div className="side-panel-stack-tight">
              <div className="ds-type-caption font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
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
                    className="ds-type-caption rounded border border-[var(--border)] bg-[var(--secondary)] px-1.5 py-0.5 font-mono text-[var(--foreground)]"
                  >
                    {item.symbol}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {(apiSearchResults.length > 0 || isApiSearching) && (
          <section className="side-panel-section side-panel-stack-tight">
            <div className="ds-type-caption font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              {isApiSearching ? "검색 중..." : `API 검색 결과 (${apiSearchResults.length})`}
            </div>
            <ScrollArea className="max-h-52" viewportClassName="space-y-1 pr-1">
              {apiSearchResults.map((result) => {
                const badge = marketBadge(result.market);
                return (
                  <div
                    key={`api-${result.market}-${result.symbol}`}
                    className="flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--secondary)] px-2 py-1.5"
                  >
                    <span
                      className="ds-type-caption shrink-0 rounded px-1.5 py-0.5 font-bold"
                      style={{
                        background: `color-mix(in srgb, ${badge.color} 18%, transparent)`,
                        color: badge.color,
                      }}
                    >
                      {badge.text}
                    </span>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        setSymbol(result.symbol, result.market);
                        onSelectSymbol?.();
                      }}
                    >
                      <span className="ds-type-label font-mono font-semibold text-[var(--foreground)]">
                        {result.symbol}
                      </span>
                      <span className="ds-type-caption ml-1.5 text-[var(--muted-foreground)]">
                        {result.label}
                      </span>
                      {result.exchange && (
                        <span className="ds-type-caption ml-1 text-[var(--muted-foreground)] opacity-60">
                          · {result.exchange}
                        </span>
                      )}
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-[var(--primary)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        addCustomSymbol(result.symbol, result.label, result.market);
                      }}
                      title={`${result.symbol} 워치리스트에 추가`}
                    >
                      +
                    </Button>
                  </div>
                );
              })}
            </ScrollArea>
          </section>
        )}

        <section className="side-panel-section side-panel-stack-tight">
          <div className="flex items-center justify-between">
            <span className="ds-type-caption font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              기술 스크리너
            </span>
            <button
              type="button"
              className="ds-type-caption rounded border border-[var(--border)] bg-[var(--accent)] px-2 py-1.5 font-semibold text-[var(--primary)]"
              onClick={runScreener}
              disabled={isScanning}
            >
              {isScanning ? "스캔 중..." : "스캔 실행"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {SCREENER_CONDITION_ITEMS.map((rule) => {
              const active = screenerConditions.includes(rule.value);
              return (
                <SegmentButton
                  key={rule.value}
                  type="button"
                  size="sm"
                  className="w-full"
                  active={active}
                  onClick={() => toggleScreenerCondition(rule.value)}
                >
                  {rule.label}
                </SegmentButton>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {([
              { value: "any" as const, label: "ANY(OR)" },
              { value: "all" as const, label: "ALL(AND)" },
            ] as const).map((modeOption) => (
              <SegmentButton
                key={modeOption.value}
                type="button"
                size="sm"
                className="w-full"
                active={screenerMode === modeOption.value}
                activeTone="warning"
                onClick={() => setScreenerMode(modeOption.value)}
              >
                {modeOption.label}
              </SegmentButton>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {([
              { value: "scoreDesc" as const, label: "점수" },
              { value: "priceDesc" as const, label: "가격↓" },
              { value: "priceAsc" as const, label: "가격↑" },
              { value: "symbolAsc" as const, label: "심볼" },
            ] as const).map((sortOption) => (
              <SegmentButton
                key={sortOption.value}
                type="button"
                active={screenerSort === sortOption.value}
                activeTone="accent"
                size="sm"
                onClick={() => setScreenerSort(sortOption.value)}
              >
                {sortOption.label}
              </SegmentButton>
            ))}
          </div>
          <SettingRow
            label="프리셋 저장"
            description="현재 조건 조합을 이름으로 저장"
            right={(
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="ds-type-caption font-semibold"
                onClick={saveCurrentPreset}
                disabled={!presetName.trim() || screenerConditions.length === 0}
              >
                저장
              </Button>
            )}
          >
            <Input
              size="sm"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="ds-type-label"
              placeholder="프리셋 이름"
            />
          </SettingRow>
          <ScrollArea className="max-h-14" viewportClassName="space-y-1 pr-1">
            {screenerPresets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between gap-1 rounded border border-[var(--border)] bg-[var(--secondary)] px-1.5 py-1"
              >
                <button
                  type="button"
                  className="ds-type-label min-w-0 flex-1 truncate text-left text-[var(--foreground)]"
                  onClick={() => applyPreset(preset)}
                  title={`${preset.name} 적용`}
                >
                  {preset.name} · {preset.mode.toUpperCase()} · {preset.conditions.length}조건
                </button>
                <button
                  type="button"
                  className="ds-type-caption rounded px-1 text-[var(--muted-foreground)]"
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
                className="ds-type-label w-full rounded border border-[var(--border)] bg-[var(--secondary)] px-2 py-1.5 text-left text-[var(--foreground)]"
                onClick={() => {
                  setSymbol(hit.symbol, hit.market);
                  onSelectSymbol?.();
                }}
              >
                <div className="flex items-center justify-between gap-2 font-mono">
                  <span>{hit.symbol}</span>
                  <span>{formatPrice(hit.close, hit.market)}</span>
                </div>
                <div className="text-[var(--muted-foreground)]">
                  {hit.reasons.join(" · ")}
                </div>
                <div className="ds-type-caption font-mono text-[var(--primary)]">
                  score {hit.score.toFixed(1)}
                </div>
              </button>
            ))}
            {screenerHits.length === 0 && (
              <StatePanel
                variant="empty"
                size="compact"
                title={lastScannedAt ? "조건 일치 종목이 없습니다." : "조건 선택 후 스캔 실행"}
                description="조건/정렬을 조정한 뒤 다시 스캔해 보세요."
                className="border-dashed bg-transparent"
              />
            )}
          </ScrollArea>
        </section>
      </div>

      <ScrollArea
        ref={listAreaRef}
        className="side-panel-scroll min-h-0 flex-1 border-t border-[var(--border)]"
        viewportClassName="px-3 pb-3 pt-3"
      >
        <div className="space-y-2.5">
          {renderedItems.map((item, itemIndex) => {
            const badge = marketBadge(item.market);
            const active = symbol === item.symbol && market === item.market;
            const itemKey = snapshotKey(item.symbol, item.market);
            const isFavorite = favoriteSet.has(itemKey);
            const instrument = getInstrumentDisplay(item.symbol, item.label, item.market);
            const snapshot = snapshots[itemKey];
            const trendColor = snapshot
              ? snapshot.change >= 0
                ? "var(--success)"
                : "var(--destructive)"
              : "var(--muted-foreground)";
            const isUp = snapshot ? snapshot.change >= 0 : null;
            const priceColor =
              isUp === null
                ? "var(--foreground)"
                : isUp
                  ? "var(--success)"
                  : "var(--destructive)";
            const changeLabel = snapshot
              ? `${snapshot.changePct >= 0 ? "+" : ""}${snapshot.changePct.toFixed(2)}%`
              : "로딩중";
            return (
              <div
                key={itemKey}
                role="button"
                tabIndex={0}
                ref={(node) => {
                  watchItemRefs.current[itemIndex] = node;
                }}
                onClick={() => selectSymbolFromWatch(item)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    watchItemRefs.current[Math.min(renderedItems.length - 1, itemIndex + 1)]?.focus();
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    watchItemRefs.current[Math.max(0, itemIndex - 1)]?.focus();
                    return;
                  }
                  if (e.key === "Home") {
                    e.preventDefault();
                    watchItemRefs.current[0]?.focus();
                    return;
                  }
                  if (e.key === "End") {
                    e.preventDefault();
                    watchItemRefs.current[renderedItems.length - 1]?.focus();
                    return;
                  }
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectSymbolFromWatch(item);
                  }
                }}
                className="w-full rounded-[var(--radius-sm)] border px-3 py-2.5 text-left transition-colors"
                style={{
                  background: active
                    ? "color-mix(in srgb, var(--primary) 10%, var(--secondary))"
                    : "color-mix(in srgb, var(--muted) 56%, var(--card))",
                  borderColor: active ? "var(--primary)" : "var(--border)",
                  cursor: "pointer",
                }}
                aria-label={`${item.symbol} ${item.market} 종목 선택`}
                aria-current={active ? "true" : undefined}
                aria-keyshortcuts="Enter Space ArrowUp ArrowDown Home End"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className={`ds-type-label truncate font-semibold text-[var(--foreground)] ${item.market === "krStock" ? "" : "font-mono"}`}>
                        {instrument.primary}
                      </p>
                      <span
                        className="ds-type-caption rounded px-1.5 py-0.5 font-bold"
                        style={{
                          background: `color-mix(in srgb, ${badge.color} 18%, transparent)`,
                          color: badge.color,
                        }}
                      >
                        {badge.text}
                      </span>
                    </div>
                    {instrument.secondary && (
                      <p className={`ds-type-caption truncate text-[var(--muted-foreground)] ${item.market === "krStock" ? "font-mono" : ""}`}>
                        {instrument.secondary}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-start gap-1.5">
                    <div className="w-[88px] text-right">
                      <div
                        className="h-5 font-mono text-sm font-semibold leading-5"
                        style={{ color: priceColor }}
                      >
                        {snapshot ? formatPrice(snapshot.lastPrice, item.market) : "----"}
                      </div>
                      <div className="ds-type-label h-4 leading-4" style={{ color: priceColor }}>
                        {changeLabel}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.symbol, item.market);
                      }}
                      className="rounded px-1.5 py-1 text-sm leading-none"
                      aria-label={isFavorite ? `${item.symbol} 즐겨찾기 해제` : `${item.symbol} 즐겨찾기 추가`}
                      aria-pressed={isFavorite}
                      title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                      style={{
                        color: isFavorite ? "var(--warning)" : "var(--muted-foreground)",
                      }}
                    >
                      {isFavorite ? "★" : "☆"}
                    </button>
                    {customSymbolSet.has(itemKey) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomSymbol(item.symbol, item.market);
                        }}
                        className="rounded px-1 py-1 text-xs leading-none text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                        aria-label={`${item.symbol} 워치리스트에서 제거`}
                        title="워치리스트에서 제거"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-1.5">
                  <Sparkline values={snapshot?.sparkline ?? []} color={trendColor} />
                  <p className="ds-type-caption mt-0.5 h-4 text-[var(--muted-foreground)]">
                    {snapshot
                      ? `H ${formatPrice(snapshot.high, item.market)} · L ${formatPrice(snapshot.low, item.market)}`
                      : "\u00a0"}
                  </p>
                </div>
              </div>
            );
          })}
          {hasMoreItems && (
            <div
              ref={listSentinelRef}
              className="ds-type-caption rounded border border-dashed border-[var(--border)] bg-[var(--muted)] px-2 py-1.5 text-center text-[var(--muted-foreground)]"
            >
              스크롤 시 목록을 추가 로드합니다...
            </div>
          )}
          {visibleItems.length === 0 && (
            <StatePanel
              variant="empty"
              size="compact"
              title={favoriteOnly ? "즐겨찾기 종목이 없습니다" : "심볼이 없습니다"}
              description="필터를 변경하거나 검색어를 지워서 다시 확인해 보세요."
              className="border-dashed bg-transparent"
            />
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
