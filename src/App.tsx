import { useEffect } from "react";
import Toolbar from "./components/Toolbar";
import ChartContainer from "./components/ChartContainer";
import StatusBar from "./components/StatusBar";
import SettingsPanel from "./components/SettingsPanel";
import { useChartStore } from "./stores/useChartStore";
import { useSettingsStore } from "./stores/useSettingsStore";
import { THEME_COLORS } from "./utils/constants";

function App() {
  const fetchData = useChartStore((s) => s.fetchData);
  const symbol = useSettingsStore((s) => s.symbol);
  const interval = useSettingsStore((s) => s.interval);
  const market = useSettingsStore((s) => s.market);
  const bbPeriod = useSettingsStore((s) => s.bbPeriod);
  const bbMultiplier = useSettingsStore((s) => s.bbMultiplier);
  const rsiPeriod = useSettingsStore((s) => s.rsiPeriod);
  const showSettings = useSettingsStore((s) => s.showSettings);
  const setShowSettings = useSettingsStore((s) => s.setShowSettings);
  const theme = useSettingsStore((s) => s.theme);

  // Apply theme CSS variables
  useEffect(() => {
    const colors = THEME_COLORS[theme];
    const root = document.documentElement;
    root.style.setProperty("--bg-primary", colors.bgPrimary);
    root.style.setProperty("--bg-secondary", colors.bgSecondary);
    root.style.setProperty("--bg-tertiary", colors.bgTertiary);
    root.style.setProperty("--text-primary", colors.textPrimary);
    root.style.setProperty("--text-secondary", colors.textSecondary);
    root.style.setProperty("--border-color", colors.borderColor);
  }, [theme]);

  useEffect(() => {
    fetchData({ symbol, interval, bbPeriod, bbMultiplier, rsiPeriod, market });
  }, [symbol, interval, bbPeriod, bbMultiplier, rsiPeriod, market, fetchData]);

  return (
    <div className="flex h-full w-full flex-col" style={{ background: "var(--bg-primary)" }}>
      <Toolbar onToggleSettings={() => setShowSettings(!showSettings)} />
      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <ChartContainer />
        </div>
        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}
      </div>
      <StatusBar />
    </div>
  );
}

export default App;
