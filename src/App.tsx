import { useEffect, useState, type CSSProperties } from "react";
import Toolbar from "./components/Toolbar";
import ChartContainer from "./components/ChartContainer";
import StatusBar from "./components/StatusBar";
import SettingsPanel from "./components/SettingsPanel";
import WatchlistSidebar from "./components/WatchlistSidebar";
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
  const shellStyle: CSSProperties = {
    background: "var(--bg-primary)",
    paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)",
    paddingRight: "calc(env(safe-area-inset-right, 0px) + 0.5rem)",
    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)",
    paddingLeft: "calc(env(safe-area-inset-left, 0px) + 0.5rem)",
  };

  // Apply theme CSS variables
  useEffect(() => {
    const colors = THEME_COLORS[theme] ?? THEME_COLORS.dark;
    const root = document.documentElement;
    root.style.setProperty("--bg-primary", colors.bgPrimary);
    root.style.setProperty("--bg-secondary", colors.bgSecondary);
    root.style.setProperty("--bg-tertiary", colors.bgTertiary);
    root.style.setProperty("--surface-elevated", colors.surfaceElevated);
    root.style.setProperty("--text-primary", colors.textPrimary);
    root.style.setProperty("--text-secondary", colors.textSecondary);
    root.style.setProperty("--border-color", colors.borderColor);
    root.style.setProperty("--accent-primary", colors.accentPrimary);
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
        setShowWatchlist(false);
        setShowSettings(false);
        return;
      }
      if (isTyping) return;

      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (isMod && key === "b") {
        e.preventDefault();
        setShowWatchlist((prev) => !prev);
        if (showSettings) setShowSettings(false);
      }
      if (isMod && key === ",") {
        e.preventDefault();
        setShowSettings(!showSettings);
        setShowWatchlist(false);
      }
      if (isMod && key === "k") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("quanting:open-symbol-search"));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setShowSettings, showSettings]);

  return (
    <div className="relative flex h-full min-h-0 w-full gap-2" style={shellStyle}>
      <div className="hidden shrink-0 xl:block">
        <WatchlistSidebar embedded />
      </div>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <div className="surface-card overflow-hidden rounded-lg">
          <Toolbar
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

      <div className="hidden shrink-0 2xl:block">
        <SettingsPanel onClose={() => setShowSettings(false)} embedded />
      </div>

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
        className="absolute z-30 xl:hidden"
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
    </div>
  );
}

export default App;
