import { useEffect, useState, type CSSProperties } from "react";
import MarketHeader from "./components/MarketHeader";
import ChartContainer from "./components/ChartContainer";
import StatusBar from "./components/StatusBar";
import SettingsPanel from "./components/SettingsPanel";
import WatchlistSidebar from "./components/WatchlistSidebar";
import CollapsibleSidebar from "./components/CollapsibleSidebar";
import ShortcutsModal from "./components/ShortcutsModal";
import { useChartStore } from "./stores/useChartStore";
import { useSettingsStore } from "./stores/useSettingsStore";
import { THEME_COLORS } from "./utils/constants";

function App() {
  const [showWatchlist, setShowWatchlist] = useState(false);
  const fetchData = useChartStore((s) => s.fetchData);
  const symbol = useSettingsStore((s) => s.symbol);
  const interval = useSettingsStore((s) => s.interval);
  const market = useSettingsStore((s) => s.market);
  const indicators = useSettingsStore((s) => s.indicators);
  const showSettings = useSettingsStore((s) => s.showSettings);
  const setShowSettings = useSettingsStore((s) => s.setShowSettings);
  const theme = useSettingsStore((s) => s.theme);
  const isFullscreen = useSettingsStore((s) => s.isFullscreen);
  const toggleFullscreen = useSettingsStore((s) => s.toggleFullscreen);

  const shellStyle: CSSProperties = {
    background: "var(--bg-primary)",
    paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)",
    paddingRight: "calc(env(safe-area-inset-right, 0px) + 0.5rem)",
    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)",
    paddingLeft: "calc(env(safe-area-inset-left, 0px) + 0.5rem)",
  };

  // Apply theme CSS variables
  useEffect(() => {
    const colors = theme === "light" ? THEME_COLORS.light : THEME_COLORS.dark;
    const root = document.documentElement;
    root.style.setProperty("--bg-app", colors.bgApp);
    root.style.setProperty("--bg-surface", colors.bgSurface);
    root.style.setProperty("--bg-card", colors.bgCard);
    root.style.setProperty("--bg-card-hover", colors.bgCardHover);
    root.style.setProperty("--bg-input", colors.bgInput);
    root.style.setProperty("--bg-elevated", colors.bgElevated);
    root.style.setProperty("--bg-primary", colors.bgPrimary);
    root.style.setProperty("--bg-secondary", colors.bgSecondary);
    root.style.setProperty("--bg-tertiary", colors.bgTertiary);
    root.style.setProperty("--surface-elevated", colors.surfaceElevated);
    root.style.setProperty("--text-primary", colors.textPrimary);
    root.style.setProperty("--text-secondary", colors.textSecondary);
    root.style.setProperty("--border-color", colors.borderColor);
    root.style.setProperty("--accent-primary", colors.accentPrimary);
    root.style.setProperty("--accent-hover", colors.accentHover);
    root.style.setProperty("--accent-active", colors.accentActive);
    root.style.setProperty("--accent-glow", colors.accentGlow);
    root.style.setProperty("--accent-border", colors.accentBorder);
    root.style.setProperty("--accent-contrast", colors.accentContrast);
    root.style.setProperty("--accent-soft", colors.accentSoft);
    root.style.setProperty("--success-color", colors.successColor);
    root.style.setProperty("--danger-color", colors.dangerColor);
    root.style.setProperty("--warning-color", colors.warningColor);
    root.style.setProperty("--panel-shadow", colors.panelShadow);
    root.style.setProperty("color-scheme", theme);

    document.body.style.backgroundColor = colors.bgPrimary;
    document.body.style.color = colors.textPrimary;
  }, [theme]);

  // Data fetching
  useEffect(() => {
    fetchData({
      symbol,
      interval,
      bbPeriod: indicators.bb.period,
      bbMultiplier: indicators.bb.multiplier,
      rsiPeriod: indicators.rsi.period,
      market,
      smaPeriods: indicators.sma.enabled ? indicators.sma.periods : [],
      emaPeriods: indicators.ema.enabled ? indicators.ema.periods : [],
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
      signalFilter: indicators.signalFilter,
    });
  }, [symbol, interval, market, indicators, fetchData]);

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
        signalFilter: state.indicators.signalFilter,
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [market]);

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
        if (window.matchMedia("(min-width: 1536px)").matches) {
          window.dispatchEvent(new CustomEvent("quanting:toggle-left-sidebar"));
        } else {
          setShowWatchlist((prev) => !prev);
          if (showSettings) setShowSettings(false);
        }
      }
      if (isMod && keyLower === ",") {
        e.preventDefault();
        if (window.matchMedia("(min-width: 1536px)").matches) {
          window.dispatchEvent(new CustomEvent("quanting:toggle-right-sidebar"));
        } else {
          setShowSettings(!showSettings);
          setShowWatchlist(false);
        }
      }
      if (isMod && keyLower === "k") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("quanting:open-symbol-search"));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setShowSettings, showSettings, toggleFullscreen]);

  // Fullscreen mode: only render chart
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="flex-1 min-h-0">
          <ChartContainer />
        </div>
        <ShortcutsModal />
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 w-full gap-1.5 xl:gap-2" style={shellStyle}>
      <CollapsibleSidebar
        side="left"
        label="WATCH"
        storageKey="quanting-sidebar-left"
        expandedWidth={240}
        defaultOpen
      >
        <WatchlistSidebar embedded />
      </CollapsibleSidebar>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <div className="surface-card overflow-hidden rounded-lg">
          <MarketHeader
            onToggleWatchlist={() => {
              setShowSettings(false);
              setShowWatchlist(true);
            }}
            onToggleSettings={() => {
              setShowWatchlist(false);
              setShowSettings(true);
            }}
          />
        </div>
        <div className="surface-card flex flex-1 min-h-0 overflow-hidden rounded-lg">
          <ChartContainer />
        </div>
        <div className="surface-card overflow-hidden rounded-lg">
          <StatusBar />
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

      {/* Mobile Backdrop */}
      <div
        className="absolute z-20 2xl:hidden"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 0.5rem)",
          right: "calc(env(safe-area-inset-right, 0px) + 0.5rem)",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)",
          left: "calc(env(safe-area-inset-left, 0px) + 0.5rem)",
          background: "rgba(0,0,0,0.35)",
          opacity: showWatchlist || showSettings ? 1 : 0,
          pointerEvents: showWatchlist || showSettings ? "auto" : "none",
          transition: "opacity 200ms",
        }}
        onClick={() => {
          setShowWatchlist(false);
          setShowSettings(false);
        }}
      />

      {/* Mobile Watchlist Drawer */}
      <div
        className="absolute z-30 2xl:hidden"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 0.5rem)",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)",
          left: "calc(env(safe-area-inset-left, 0px) + 0.5rem)",
          transform: showWatchlist ? "translateX(0)" : "translateX(-110%)",
          transition: "transform 200ms",
        }}
      >
        <WatchlistSidebar
          onClose={() => setShowWatchlist(false)}
          onSelectSymbol={() => setShowWatchlist(false)}
        />
      </div>

      {/* Mobile Settings Drawer */}
      <div
        className="absolute z-30 2xl:hidden"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 0.5rem)",
          right: "calc(env(safe-area-inset-right, 0px) + 0.5rem)",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)",
          transform: showSettings ? "translateX(0)" : "translateX(110%)",
          transition: "transform 200ms",
        }}
      >
        <SettingsPanel onClose={() => setShowSettings(false)} />
      </div>

      <ShortcutsModal />
    </div>
  );
}

export default App;
