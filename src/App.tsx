import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useShallow } from "zustand/react/shallow";
import ChartContainer from "./components/ChartContainer";
import ShortcutsModal from "./components/ShortcutsModal";
import SymbolSearch from "./components/SymbolSearch";
import { useChartStore } from "./stores/useChartStore";
import { useSettingsStore } from "./stores/useSettingsStore";
import { useReplayStore } from "./stores/useReplayStore";
import type { Candle } from "./types";
import { buildAnalysisParams } from "./utils/analysisParams";
import { isActiveDialogLayer, isEditableKeyboardTarget } from "./utils/shortcuts";
import DashboardTopBar from "./components/dashboard/DashboardTopBar";
import DashboardRightDock from "./components/dashboard/DashboardRightDock";
import DashboardChartHeader from "./components/dashboard/DashboardChartHeader";
import type {
  DashboardDockFocusRequest,
  DashboardDockFocusSection,
  DashboardDockTab,
} from "./components/dashboard/types";

const BINANCE_STREAM_INTERVALS = new Set([
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
]);

const DASHBOARD_DOCK_WIDTH_STORAGE_KEY = "quanting-dashboard-dock-width";
const DEFAULT_DOCK_WIDTH = 360;
const MIN_DOCK_WIDTH = 304;
const MAX_DOCK_WIDTH = 560;
const DASHBOARD_RESIZER_WIDTH = 14;
const MIN_CHART_PANEL_WIDTH = 720;

function clampDockWidth(value: number, shellWidth?: number) {
  const shellLimitedMax = shellWidth
    ? Math.max(MIN_DOCK_WIDTH, shellWidth - MIN_CHART_PANEL_WIDTH - DASHBOARD_RESIZER_WIDTH)
    : MAX_DOCK_WIDTH;
  const boundedMax = Math.min(MAX_DOCK_WIDTH, shellLimitedMax);
  return Math.min(boundedMax, Math.max(MIN_DOCK_WIDTH, value));
}

function readInitialDockWidth() {
  try {
    const raw = localStorage.getItem(DASHBOARD_DOCK_WIDTH_STORAGE_KEY);
    const parsed = raw ? Number(raw) : DEFAULT_DOCK_WIDTH;
    if (!Number.isFinite(parsed)) return DEFAULT_DOCK_WIDTH;
    return clampDockWidth(parsed);
  } catch {
    return DEFAULT_DOCK_WIDTH;
  }
}

function App() {
  const [activeDockTab, setActiveDockTab] = useState<DashboardDockTab>("indicators");
  const [dockFocusRequest, setDockFocusRequest] = useState<DashboardDockFocusRequest | null>(null);
  const [dockWidth, setDockWidth] = useState<number>(readInitialDockWidth);
  const [isDockResizing, setIsDockResizing] = useState(false);
  const pendingRealtimeCandleRef = useRef<Candle | null>(null);
  const realtimeFlushRafRef = useRef<number | null>(null);
  const dashboardShellRef = useRef<HTMLDivElement | null>(null);
  const dockResizeCleanupRef = useRef<(() => void) | null>(null);
  const { fetchData, data, updateRealtimeCandle } = useChartStore(
    useShallow((state) => ({
      fetchData: state.fetchData,
      data: state.data,
      updateRealtimeCandle: state.updateRealtimeCandle,
    })),
  );
  const { replayEnabled, replayPlaying, replaySpeed } = useReplayStore(
    useShallow((state) => ({
      replayEnabled: state.enabled,
      replayPlaying: state.playing,
      replaySpeed: state.speed,
    })),
  );
  const {
    symbol,
    interval,
    market,
    indicators,
    priceAlerts,
    markAlertTriggered,
    theme,
    isFullscreen,
    toggleFullscreen,
  } = useSettingsStore(
    useShallow((state) => ({
      symbol: state.symbol,
      interval: state.interval,
      market: state.market,
      indicators: state.indicators,
      priceAlerts: state.priceAlerts,
      markAlertTriggered: state.markAlertTriggered,
      theme: state.theme,
      isFullscreen: state.isFullscreen,
      toggleFullscreen: state.toggleFullscreen,
    })),
  );

  const shellStyle: CSSProperties = {
    background: "var(--dashboard-chrome-bg)",
  };

  // Apply theme class (.dark) using shadcn token pattern
  // useLayoutEffect ensures .dark is set synchronously before any child useEffect
  // reads CSS variables (e.g. MainChart's readChartPalette via getComputedStyle)
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  // Build fetch params — only values that the backend actually uses.
  // Indicator enabled states that don't affect backend params (e.g. RSI toggle,
  // BB toggle) are excluded so toggling display-only indicators won't trigger
  // an unnecessary refetch that replaces WebSocket-updated candle data.
  const fetchParams = useMemo(
    () =>
      buildAnalysisParams({
        symbol,
        interval,
        market,
        indicators,
      }),
    [
      symbol, interval, market,
      indicators.bb.period, indicators.bb.multiplier,
      indicators.rsi.period,
      indicators.sma.enabled, indicators.sma.periods,
      indicators.ema.enabled, indicators.ema.periods,
      indicators.hma.enabled, indicators.hma.periods,
      indicators.macd.enabled, indicators.macd.fastPeriod, indicators.macd.slowPeriod, indicators.macd.signalPeriod,
      indicators.stochastic.enabled, indicators.stochastic.kPeriod, indicators.stochastic.dPeriod, indicators.stochastic.smooth,
      indicators.obv.enabled, indicators.cvd.enabled,
      indicators.donchian.enabled, indicators.donchian.period,
      indicators.keltner.enabled, indicators.keltner.emaPeriod, indicators.keltner.atrPeriod, indicators.keltner.atrMultiplier,
      indicators.mfi.enabled, indicators.mfi.period,
      indicators.cmf.enabled, indicators.cmf.period,
      indicators.choppiness.enabled, indicators.choppiness.period,
      indicators.williamsR.enabled, indicators.williamsR.period,
      indicators.adx.enabled, indicators.adx.period,
      indicators.stc.enabled, indicators.stc.tcLen, indicators.stc.fastMa, indicators.stc.slowMa,
      indicators.smc.enabled, indicators.smc.swingLength,
      indicators.anchoredVwap.enabled, indicators.anchoredVwap.anchorTime,
      indicators.autoFib.enabled, indicators.autoFib.lookback, indicators.autoFib.swingLength,
      indicators.signalStrategies,
    ],
  );

  // Data fetching — only triggers when actual backend params change
  useEffect(() => {
    fetchData(fetchParams);
  }, [fetchParams, fetchData]);

  useEffect(() => {
    try {
      localStorage.setItem(DASHBOARD_DOCK_WIDTH_STORAGE_KEY, String(dockWidth));
    } catch { }
  }, [dockWidth]);

  useEffect(() => {
    const syncDockWidth = () => {
      setDockWidth((prev) => clampDockWidth(prev, dashboardShellRef.current?.clientWidth));
    };

    syncDockWidth();
    window.addEventListener("resize", syncDockWidth);

    return () => {
      window.removeEventListener("resize", syncDockWidth);
      dockResizeCleanupRef.current?.();
      dockResizeCleanupRef.current = null;
    };
  }, []);

  // Bar replay tick
  useEffect(() => {
    if (!replayEnabled || !replayPlaying) return;
    const totalBars = data?.candles.length ?? 0;
    if (totalBars <= 1) return;

    const frameMs = Math.max(60, Math.round(720 / Math.max(0.25, replaySpeed)));
    const timer = setInterval(() => {
      const liveBars = useChartStore.getState().data?.candles.length ?? 0;
      useReplayStore.getState().tick(liveBars);
    }, frameMs);
    return () => clearInterval(timer);
  }, [data?.candles.length, replayEnabled, replayPlaying, replaySpeed]);

  // Auto-refresh timer
  useEffect(() => {
    const intervalMs = market === "crypto" ? 30000 : 60000;
    const timer = setInterval(() => {
      const state = useSettingsStore.getState();
      const chartState = useChartStore.getState();
      chartState.fetchData(
        buildAnalysisParams({
          symbol: state.symbol,
          interval: state.interval,
          market: state.market,
          indicators: state.indicators,
        }),
      );
    }, intervalMs);
    return () => clearInterval(timer);
  }, [market]);

  // Crypto real-time feed (Binance kline stream) with polling fallback
  useEffect(() => {
    if (market !== "crypto") return;
    if (!symbol || !interval) return;
    if (!BINANCE_STREAM_INTERVALS.has(interval)) return;

    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const kline = payload?.k;
        if (!kline) return;
        const nextCandle = {
          time: Math.floor(Number(kline.t) / 1000),
          open: Number(kline.o),
          high: Number(kline.h),
          low: Number(kline.l),
          close: Number(kline.c),
          volume: Number(kline.v),
        };
        if (
          Number.isFinite(nextCandle.time) &&
          Number.isFinite(nextCandle.open) &&
          Number.isFinite(nextCandle.high) &&
          Number.isFinite(nextCandle.low) &&
          Number.isFinite(nextCandle.close) &&
          Number.isFinite(nextCandle.volume)
        ) {
          pendingRealtimeCandleRef.current = nextCandle;
          if (realtimeFlushRafRef.current === null) {
            realtimeFlushRafRef.current = window.requestAnimationFrame(() => {
              realtimeFlushRafRef.current = null;
              const pending = pendingRealtimeCandleRef.current;
              pendingRealtimeCandleRef.current = null;
              if (pending) {
                updateRealtimeCandle(pending);
              }
            });
          }
        }
      } catch { }
    };

    return () => {
      if (realtimeFlushRafRef.current !== null) {
        window.cancelAnimationFrame(realtimeFlushRafRef.current);
        realtimeFlushRafRef.current = null;
      }
      pendingRealtimeCandleRef.current = null;
      ws.close();
    };
  }, [interval, market, symbol, updateRealtimeCandle]);

  // Price alert trigger
  useEffect(() => {
    if (!data || data.candles.length === 0) return;
    if (priceAlerts.length === 0) return;

    const last = data.candles[data.candles.length - 1];
    const prev = data.candles.length > 1 ? data.candles[data.candles.length - 2] : null;
    const currentState = useSettingsStore.getState();
    const scopedAlerts = currentState.priceAlerts.filter(
      (alert) => alert.active && alert.symbol === symbol && alert.market === market,
    );
    if (scopedAlerts.length === 0) return;

    const notify = async (title: string, body: string) => {
      try {
        if (typeof Notification !== "undefined") {
          if (Notification.permission === "granted") {
            new Notification(title, { body });
            return;
          }
          if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              new Notification(title, { body });
              return;
            }
          }
        }
      } catch { }
      console.info(`${title}: ${body}`);
    };

    const beep = () => {
      try {
        const audioCtx = new AudioContext();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "triangle";
        osc.frequency.value = 880;
        gain.gain.value = 0.04;
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch { }
    };

    for (const alert of scopedAlerts) {
      const crossedUp =
        alert.condition === "above" &&
        ((prev ? prev.close : last.close) < alert.price) &&
        last.close >= alert.price;
      const crossedDown =
        alert.condition === "below" &&
        ((prev ? prev.close : last.close) > alert.price) &&
        last.close <= alert.price;

      if (!crossedUp && !crossedDown) continue;
      markAlertTriggered(alert.id, last.close);
      beep();
      notify(
        `${alert.symbol} 가격 알림`,
        `${alert.condition === "above" ? "상향" : "하향"} 도달: ${alert.price.toFixed(4)} (현재 ${last.close.toFixed(4)})`,
      );
    }
  }, [data, market, markAlertTriggered, priceAlerts, symbol]);

  // Fullscreen sync with browser Fullscreen API
  useEffect(() => {
    if (isFullscreen) {
      document.documentElement.requestFullscreen?.().catch(() => { });
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => { });
    }
  }, [isFullscreen]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const isBrowserFullscreen = !!document.fullscreenElement;
      const storeFullscreen = useSettingsStore.getState().isFullscreen;
      if (isBrowserFullscreen !== storeFullscreen) {
        toggleFullscreen();
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [toggleFullscreen]);

  // Extended keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      const isInDialog = isActiveDialogLayer(target);
      const isTyping = isEditableKeyboardTarget(target);

      if (e.key === "Escape") {
        if (isInDialog) {
          // Dialog/Sheet에서의 Escape는 각 컴포넌트 핸들러에 위임
          return;
        }
        if (useSettingsStore.getState().isFullscreen) {
          // Fullscreen exit handled by browser API
          return;
        }
        window.dispatchEvent(new CustomEvent("quanting:close-sidebars"));
        return;
      }
      if (isInDialog) return;
      if (isTyping) return;

      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key;

      // Chart commands (no modifier needed)
      if (!isMod) {
        switch (key) {
          case "r":
          case "R": {
            if (e.repeat) return;
            e.preventDefault();
            const replay = useReplayStore.getState();
            const bars = useChartStore.getState().data?.candles.length ?? 0;
            if (replay.enabled) replay.exitReplay();
            else replay.enterReplay(bars);
            return;
          }
          case " ":
            if (useReplayStore.getState().enabled) {
              e.preventDefault();
              useReplayStore.getState().togglePlaying();
            }
            return;
          case "f":
          case "F":
            if (e.repeat) return;
            e.preventDefault();
            toggleFullscreen();
            return;
          case "+":
          case "=":
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("quanting:chart-zoom-in"));
            return;
          case "-":
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("quanting:chart-zoom-out"));
            return;
          case "Home":
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("quanting:chart-fit"));
            return;
          case "ArrowLeft":
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("quanting:chart-scroll-left"));
            return;
          case "ArrowRight":
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("quanting:chart-scroll-right"));
            return;
          case "?":
            if (e.repeat) return;
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("quanting:show-shortcuts"));
            return;
        }
      }

      const keyLower = key.toLowerCase();
      if (isMod && keyLower === "b") {
        if (e.repeat) return;
        e.preventDefault();
        setActiveDockTab("watchlist");
      }
      if (isMod && keyLower === ",") {
        if (e.repeat) return;
        e.preventDefault();
        setActiveDockTab("layout");
      }
      if (isMod && keyLower === "k") {
        if (e.repeat) return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("quanting:open-symbol-search"));
      }
      if (isMod && keyLower === "/") {
        if (e.repeat) return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("quanting:open-symbol-search"));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFullscreen]);

  const handleSelectDockTab = (tab: DashboardDockTab) => {
    setActiveDockTab(tab);
  };

  const handleToggleWatchlistPanel = () => {
    setActiveDockTab("watchlist");
  };

  const openDockSection = (section: DashboardDockFocusSection, tab: DashboardDockTab) => {
    setActiveDockTab(tab);
    setDockFocusRequest({ section, nonce: Date.now() });
  };

  const resetDockWidth = () => {
    setDockWidth(clampDockWidth(DEFAULT_DOCK_WIDTH, dashboardShellRef.current?.clientWidth));
  };

  const handleDockResizeStart = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dockResizeCleanupRef.current?.();

    const startX = event.clientX;
    const startWidth = dockWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = startWidth - delta;
      setDockWidth(clampDockWidth(nextWidth, dashboardShellRef.current?.clientWidth));
    };

    const cleanup = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", cleanup);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      dockResizeCleanupRef.current = null;
      setIsDockResizing(false);
    };

    dockResizeCleanupRef.current = cleanup;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    setIsDockResizing(true);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", cleanup);
  };

  // Fullscreen mode: only render chart
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "var(--background)" }}
      >
        <DashboardChartHeader
          compact
          onOpenIndicators={() => openDockSection("presets", "indicators")}
          onOpenAlerts={() => openDockSection("alerts", "indicators")}
          onOpenDisplaySettings={() => handleSelectDockTab("layout")}
        />
        <div className="flex-1 min-h-0">
          <ChartContainer />
        </div>
        <ShortcutsModal />
        <SymbolSearch hideTrigger />
      </div>
    );
  }

  return (
    <div className="app-shell flex h-full min-h-0 w-full flex-col" style={shellStyle}>
      <div className="workspace-frame relative flex min-h-0 flex-1 w-full gap-[var(--layout-column-gap)]">
        <div className="dashboard-workspace flex min-h-0 flex-1 flex-col">
          <DashboardTopBar
            activeDockTab={activeDockTab}
            onSelectDockTab={handleSelectDockTab}
            onToggleWatchlist={handleToggleWatchlistPanel}
            onOpenDisplaySettings={() => handleSelectDockTab("layout")}
          />

          <div ref={dashboardShellRef} className="dashboard-shell flex min-h-0 flex-1">
            <main className="dashboard-shell__main workspace-main flex min-h-0 min-w-0 flex-1 flex-col">
              <DashboardChartHeader
                onOpenIndicators={() => openDockSection("presets", "indicators")}
                onOpenAlerts={() => openDockSection("alerts", "indicators")}
                onOpenDisplaySettings={() => handleSelectDockTab("layout")}
              />
              <div className="workspace-chart dashboard-shell__chart flex flex-1 min-h-0 overflow-hidden bg-[var(--card)]">
                <ChartContainer />
              </div>
            </main>

            <button
              type="button"
              className={`dashboard-shell__resizer ${isDockResizing ? "is-active" : ""}`}
              onMouseDown={handleDockResizeStart}
              onDoubleClick={resetDockWidth}
              aria-label="우측 사이드바 너비 조절"
              title="우측 사이드바 너비 조절 (더블클릭: 기본 너비)"
            />

            <aside
              className="dashboard-shell__dock flex min-h-0 shrink-0"
              style={{ width: dockWidth, flexBasis: dockWidth }}
            >
              <DashboardRightDock
                embedded
                activeTab={activeDockTab}
                focusRequest={dockFocusRequest}
                onTabChange={handleSelectDockTab}
              />
            </aside>
          </div>
        </div>

        <ShortcutsModal />
        <SymbolSearch hideTrigger />
      </div>
    </div>
  );
}

export default App;
