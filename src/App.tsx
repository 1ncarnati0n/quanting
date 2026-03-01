import { useEffect, useLayoutEffect, useMemo, useState, type CSSProperties } from "react";
import MarketHeader from "./components/MarketHeader";
import ChartContainer from "./components/ChartContainer";
import StatusBar from "./components/StatusBar";
import SettingsPanel from "./components/SettingsPanel";
import WatchlistSidebar from "./components/WatchlistSidebar";
import CollapsibleSidebar from "./components/CollapsibleSidebar";
import ShortcutsModal from "./components/ShortcutsModal";
import { useChartStore } from "./stores/useChartStore";
import { useSettingsStore } from "./stores/useSettingsStore";
import { useReplayStore } from "./stores/useReplayStore";
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
  const fetchParams = useMemo(() => ({
    symbol,
    interval,
    market,
    bbPeriod: indicators.bb.period,
    bbMultiplier: indicators.bb.multiplier,
    rsiPeriod: indicators.rsi.period,
    smaPeriods: indicators.sma.enabled ? indicators.sma.periods : [],
    emaPeriods: indicators.ema.enabled ? indicators.ema.periods : [],
    hmaPeriods: indicators.hma.enabled ? indicators.hma.periods : [],
    macd: indicators.macd.enabled
      ? {
          fastPeriod: indicators.macd.fastPeriod,
          slowPeriod: indicators.macd.slowPeriod,
          signalPeriod: indicators.macd.signalPeriod,
        }
      : null,
    stochastic: indicators.stochastic.enabled
      ? {
          kPeriod: indicators.stochastic.kPeriod,
          dPeriod: indicators.stochastic.dPeriod,
          smooth: indicators.stochastic.smooth,
        }
      : null,
    showVolume: indicators.volume.enabled,
    showObv: indicators.obv.enabled,
    showCvd: indicators.cvd.enabled,
    donchian: indicators.donchian.enabled
      ? { period: indicators.donchian.period }
      : null,
    keltner: indicators.keltner.enabled
      ? {
          emaPeriod: indicators.keltner.emaPeriod,
          atrPeriod: indicators.keltner.atrPeriod,
          atrMultiplier: indicators.keltner.atrMultiplier,
        }
      : null,
    mfi: indicators.mfi.enabled ? { period: indicators.mfi.period } : null,
    cmf: indicators.cmf.enabled ? { period: indicators.cmf.period } : null,
    choppiness: indicators.choppiness.enabled
      ? { period: indicators.choppiness.period }
      : null,
    williamsR: indicators.williamsR.enabled
      ? { period: indicators.williamsR.period }
      : null,
    adx: indicators.adx.enabled ? { period: indicators.adx.period } : null,
    stc: indicators.stc.enabled
      ? {
          tcLen: indicators.stc.tcLen,
          fastMa: indicators.stc.fastMa,
          slowMa: indicators.stc.slowMa,
        }
      : null,
    smc: indicators.smc.enabled
      ? { swingLength: indicators.smc.swingLength }
      : null,
    anchoredVwap: indicators.anchoredVwap.enabled && indicators.anchoredVwap.anchorTime
      ? { anchorTime: indicators.anchoredVwap.anchorTime }
      : null,
    autoFib: indicators.autoFib.enabled
      ? { lookback: indicators.autoFib.lookback, swingLength: indicators.autoFib.swingLength }
      : null,
    signalFilter: indicators.signalFilter,
  }), [
    symbol, interval, market,
    indicators.bb.period, indicators.bb.multiplier,
    indicators.rsi.period,
    indicators.sma.enabled, indicators.sma.periods,
    indicators.ema.enabled, indicators.ema.periods,
    indicators.hma.enabled, indicators.hma.periods,
    indicators.macd.enabled, indicators.macd.fastPeriod, indicators.macd.slowPeriod, indicators.macd.signalPeriod,
    indicators.stochastic.enabled, indicators.stochastic.kPeriod, indicators.stochastic.dPeriod, indicators.stochastic.smooth,
    indicators.volume.enabled, indicators.obv.enabled, indicators.cvd.enabled,
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
  ]);

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
      chartState.fetchData({
        symbol: state.symbol,
        interval: state.interval,
        bbPeriod: state.indicators.bb.period,
        bbMultiplier: state.indicators.bb.multiplier,
        rsiPeriod: state.indicators.rsi.period,
        market: state.market,
        smaPeriods: state.indicators.sma.enabled ? state.indicators.sma.periods : [],
        emaPeriods: state.indicators.ema.enabled ? state.indicators.ema.periods : [],
        hmaPeriods: state.indicators.hma.enabled ? state.indicators.hma.periods : [],
        macd: state.indicators.macd.enabled
          ? {
              fastPeriod: state.indicators.macd.fastPeriod,
              slowPeriod: state.indicators.macd.slowPeriod,
              signalPeriod: state.indicators.macd.signalPeriod,
            }
          : null,
        stochastic: state.indicators.stochastic.enabled
          ? {
              kPeriod: state.indicators.stochastic.kPeriod,
              dPeriod: state.indicators.stochastic.dPeriod,
              smooth: state.indicators.stochastic.smooth,
            }
          : null,
        showVolume: state.indicators.volume.enabled,
        showObv: state.indicators.obv.enabled,
        showCvd: state.indicators.cvd.enabled,
        donchian: state.indicators.donchian.enabled
          ? { period: state.indicators.donchian.period }
          : null,
        keltner: state.indicators.keltner.enabled
          ? {
              emaPeriod: state.indicators.keltner.emaPeriod,
              atrPeriod: state.indicators.keltner.atrPeriod,
              atrMultiplier: state.indicators.keltner.atrMultiplier,
            }
          : null,
        mfi: state.indicators.mfi.enabled ? { period: state.indicators.mfi.period } : null,
        cmf: state.indicators.cmf.enabled ? { period: state.indicators.cmf.period } : null,
        choppiness: state.indicators.choppiness.enabled
          ? { period: state.indicators.choppiness.period }
          : null,
        williamsR: state.indicators.williamsR.enabled
          ? { period: state.indicators.williamsR.period }
          : null,
        adx: state.indicators.adx.enabled ? { period: state.indicators.adx.period } : null,
        stc: state.indicators.stc.enabled
          ? {
              tcLen: state.indicators.stc.tcLen,
              fastMa: state.indicators.stc.fastMa,
              slowMa: state.indicators.stc.slowMa,
            }
          : null,
        smc: state.indicators.smc.enabled
          ? { swingLength: state.indicators.smc.swingLength }
          : null,
        anchoredVwap: state.indicators.anchoredVwap.enabled && state.indicators.anchoredVwap.anchorTime
          ? { anchorTime: state.indicators.anchoredVwap.anchorTime }
          : null,
        autoFib: state.indicators.autoFib.enabled
          ? { lookback: state.indicators.autoFib.lookback, swingLength: state.indicators.autoFib.swingLength }
          : null,
        signalFilter: state.indicators.signalFilter,
      });
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
      const isTyping =
        !!target &&
        (tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable);

      if (e.key === "Escape") {
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
        if (window.matchMedia("(min-width: 1280px)").matches) return;
        setShowSettings(false);
        setShowWatchlist(true);
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
    <div className="relative flex h-full min-h-0 w-full gap-2 xl:gap-3" style={shellStyle}>
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
    </div>
  );
}

export default App;
