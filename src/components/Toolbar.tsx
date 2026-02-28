import SymbolSearch from "./SymbolSearch";
import IntervalSelector from "./IntervalSelector";
import { useSettingsStore } from "../stores/useSettingsStore";

interface ToolbarProps {
  onToggleSettings: () => void;
}

export default function Toolbar({ onToggleSettings }: ToolbarProps) {
  const { theme, toggleTheme } = useSettingsStore();

  return (
    <div
      className="flex items-center gap-3 border-b px-4 py-2"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <span className="text-sm font-bold tracking-wide" style={{ color: "#60A5FA" }}>
        BB-RSI
      </span>

      <div style={{ width: "1px", height: "20px", background: "var(--border-color)" }} />

      <SymbolSearch />
      <IntervalSelector />

      <div className="flex-1" />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="rounded p-1.5 text-sm transition-colors"
        style={{ color: "var(--text-secondary)" }}
        title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}
      >
        {theme === "dark" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* Settings */}
      <button
        onClick={onToggleSettings}
        className="rounded p-1.5 text-sm transition-colors"
        style={{ color: "var(--text-secondary)" }}
        title="Settings"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>
    </div>
  );
}
