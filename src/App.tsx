import { useEffect, useLayoutEffect, useMemo, useState, type CSSProperties } from "react";
import MarketHeader from "./components/MarketHeader";
import ChartContainer from "./components/ChartContainer";
import StatusBar from "./components/StatusBar";
import SettingsPanel from "./components/SettingsPanel";
import WatchlistSidebar from "./components/WatchlistSidebar";
import CollapsibleSidebar from "./components/CollapsibleSidebar";
import ShortcutsModal from "./components/ShortcutsModal";
import SymbolSearch from "./components/SymbolSearch";
import { useChartStore } from "./stores/useChartStore";
import { useSettingsStore } from "./stores/useSettingsStore";
import { useReplayStore } from "./stores/useReplayStore";
import { buildAnalysisParams } from "./utils/analysisParams";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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

function App() {
  const [showWatchlist, setShowWatchlist] = useState(false);
  const fetchData = useChartStore((s) => s.fetchData);
  const data = useChartStore((s) => s.data);
  const updateRealtimeCandle = useChartStore((s) => s.updateRealtimeCandle);
  const replayEnabled = useReplayStore((s) => s.enabled);
  const replayPlaying = useReplayStore((s) => s.playing);
  const replaySpeed = useReplayStore((s) => s.speed);
  const symbol = useSettingsStore((s) => s.symbol);
  const interval = useSettingsStore((s) => s.interval);
  const market = useSettingsStore((s) => s.market);
  const indicators = useSettingsStore((s) => s.indicators);
  const priceAlerts = useSettingsStore((s) => s.priceAlerts);
  const markAlertTriggered = useSettingsStore((s) => s.markAlertTriggered);
  const showSettings = useSettingsStore((s) => s.showSettings);
  const setShowSettings = useSettingsStore((s) => s.setShowSettings);
  const theme = useSettingsStore((s) => s.theme);
  const isFullscreen = useSettingsStore((s) => s.isFullscreen);
  const toggleFullscreen = useSettingsStore((s) => s.toggleFullscreen);

  const shellStyle: CSSProperties = {
    background: "var(--background)",
    paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
    paddingRight: "calc(env(safe-area-inset-right, 0px) + 0.75rem)",
    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
    paddingLeft: "calc(env(safe-area-inset-left, 0px) + 0.75rem)",
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
      indicators.signalFilter,
    ],
  );

  // Data fetching — only triggers when actual backend params change
  useEffect(() => {
    fetchData(fetchParams);
  }, [fetchParams, fetchData]);

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
          updateRealtimeCandle(nextCandle);
        }
      } catch {}
    };

    return () => {
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
      } catch {}
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
      } catch {}
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
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
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
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isInDialog = !!target?.closest('[role="dialog"]');
      const isTyping =
        !!target &&
        (tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable);

      if (e.key === "Escape") {
        if (isInDialog) {
          // Dialog/Sheet에서의 Escape는 각 컴포넌트 핸들러에 위임
          return;
        }
        if (useSettingsStore.getState().isFullscreen) {
          // Fullscreen exit handled by browser API
          return;
        }
        setShowWatchlist(false);
        setShowSettings(false);
        window.dispatchEvent(new CustomEvent("quanting:close-sidebars"));
        return;
      }
      if (isTyping) return;

      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key;

      // Chart commands (no modifier needed)
      if (!isMod) {
        switch (key) {
          case "r":
          case "R": {
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
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("quanting:show-shortcuts"));
            return;
        }
      }

      const keyLower = key.toLowerCase();
      if (isMod && keyLower === "b") {
        e.preventDefault();
        if (window.matchMedia("(min-width: 1280px)").matches) return;
        setShowWatchlist((prev) => !prev);
        if (showSettings) setShowSettings(false);
      }
      if (isMod && keyLower === ",") {
        e.preventDefault();
        if (window.matchMedia("(min-width: 1280px)").matches) return;
        setShowSettings(!showSettings);
        setShowWatchlist(false);
      }
      if (isMod && keyLower === "k") {
        e.preventDefault();
        setShowSettings(false);
        setShowWatchlist(false);
        window.dispatchEvent(new CustomEvent("quanting:open-symbol-search"));
      }
      if (isMod && keyLower === "/") {
        e.preventDefault();
        setShowSettings(false);
        setShowWatchlist(false);
        window.dispatchEvent(new CustomEvent("quanting:open-symbol-search"));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setShowSettings, setShowWatchlist, showSettings, toggleFullscreen]);

  // Fullscreen mode: only render chart
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "var(--background)" }}
      >
        <div className="flex-1 min-h-0">
          <ChartContainer />
        </div>
        <ShortcutsModal />
        <SymbolSearch hideTrigger />
      </div>
    );
  }

  const handleToggleWatchlistPanel = () => {
    if (window.matchMedia("(min-width: 1280px)").matches) return;
    setShowSettings(false);
    setShowWatchlist((prev) => !prev);
  };

  const handleToggleSettingsPanel = () => {
    if (window.matchMedia("(min-width: 1280px)").matches) return;
    setShowWatchlist(false);
    setShowSettings(!showSettings);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col" style={shellStyle}>
      <div className="relative flex min-h-0 flex-1 w-full gap-2 xl:gap-3">
        <CollapsibleSidebar
          side="left"
          label="WATCH"
          storageKey="quanting-sidebar-left"
          expandedWidth={240}
          defaultOpen
        >
          <WatchlistSidebar embedded />
        </CollapsibleSidebar>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="surface-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl">
            <MarketHeader
              onToggleWatchlist={handleToggleWatchlistPanel}
              onToggleSettings={handleToggleSettingsPanel}
            />
            <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 pb-2 pt-1.5 sm:gap-2.5 sm:px-2.5 sm:pb-2.5">
              <div className="flex flex-1 min-h-0 overflow-hidden">
                <ChartContainer />
              </div>
              <div className="overflow-hidden rounded-md">
                <StatusBar />
              </div>
            </div>
          </div>
        </main>

        <CollapsibleSidebar
          side="right"
          label="SET"
          storageKey="quanting-sidebar-right"
          expandedWidth={300}
        >
          <SettingsPanel onClose={() => setShowSettings(false)} embedded />
        </CollapsibleSidebar>

        <Sheet
          open={showWatchlist}
          onOpenChange={(open) => setShowWatchlist(open)}
        >
          <SheetContent side="left" className="w-[min(22rem,calc(100vw-1rem))]">
            <WatchlistSidebar
              onClose={() => setShowWatchlist(false)}
              onSelectSymbol={() => setShowWatchlist(false)}
            />
          </SheetContent>
        </Sheet>

        <Sheet
          open={showSettings}
          onOpenChange={(open) => setShowSettings(open)}
        >
          <SheetContent side="right" className="w-[min(24rem,calc(100vw-1rem))]">
            <SettingsPanel onClose={() => setShowSettings(false)} />
          </SheetContent>
        </Sheet>

        <ShortcutsModal />
        <SymbolSearch hideTrigger />
      </div>
    </div>
  );
}

export default App;
