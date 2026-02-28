import { useState, useRef, useEffect } from "react";
import { useSettingsStore, type ChartType } from "../stores/useSettingsStore";

const CHART_TYPE_OPTIONS: { value: ChartType; label: string; icon: string }[] = [
  { value: "candlestick", label: "캔들스틱", icon: "M" },
  { value: "heikinAshi", label: "하이킨 아시", icon: "H" },
  { value: "line", label: "라인", icon: "L" },
  { value: "area", label: "영역", icon: "A" },
  { value: "bar", label: "바", icon: "B" },
];

export default function ChartToolbar() {
  const { chartType, setChartType, toggleFullscreen } = useSettingsStore();
  const [showChartTypeMenu, setShowChartTypeMenu] = useState(false);
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);
  const chartTypeRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (chartTypeRef.current && !chartTypeRef.current.contains(e.target as Node)) {
        setShowChartTypeMenu(false);
      }
      if (indicatorRef.current && !indicatorRef.current.contains(e.target as Node)) {
        setShowIndicatorMenu(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const dispatch = (event: string) => {
    window.dispatchEvent(new CustomEvent(event));
  };

  const currentTypeLabel = CHART_TYPE_OPTIONS.find((o) => o.value === chartType)?.icon ?? "M";

  return (
    <div
      className="pointer-events-auto absolute right-3 top-2 z-10 flex items-center gap-0.5 rounded-lg px-1 py-0.5"
      style={{
        background: "color-mix(in srgb, var(--bg-primary) 85%, transparent)",
        backdropFilter: "blur(6px)",
        border: "1px solid var(--border-color)",
      }}
    >
      {/* Chart Type Dropdown */}
      <div ref={chartTypeRef} className="relative">
        <button
          type="button"
          onClick={() => { setShowChartTypeMenu(!showChartTypeMenu); setShowIndicatorMenu(false); }}
          className="chart-toolbar-btn"
          title="차트 타입"
        >
          <span className="font-bold text-[10px]">{currentTypeLabel}</span>
        </button>
        {showChartTypeMenu && (
          <div className="chart-toolbar-dropdown" style={{ right: 0, minWidth: 120 }}>
            {CHART_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="chart-toolbar-dropdown-item"
                style={{
                  background: chartType === opt.value ? "var(--accent-soft)" : undefined,
                  color: chartType === opt.value ? "var(--accent-primary)" : "var(--text-primary)",
                }}
                onClick={() => { setChartType(opt.value); setShowChartTypeMenu(false); }}
              >
                <span className="font-bold w-4 text-center">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Indicator Toggle */}
      <div ref={indicatorRef} className="relative">
        <button
          type="button"
          onClick={() => { setShowIndicatorMenu(!showIndicatorMenu); setShowChartTypeMenu(false); }}
          className="chart-toolbar-btn"
          title="지표"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
          </svg>
        </button>
        {showIndicatorMenu && <QuickIndicatorMenu onClose={() => setShowIndicatorMenu(false)} />}
      </div>

      <div className="mx-0.5 h-4 w-px" style={{ background: "var(--border-color)" }} />

      {/* Screenshot */}
      <button
        type="button"
        onClick={() => dispatch("quanting:chart-screenshot")}
        className="chart-toolbar-btn"
        title="스크린샷 저장"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </button>

      <div className="mx-0.5 h-4 w-px" style={{ background: "var(--border-color)" }} />

      {/* Zoom controls */}
      <button
        type="button"
        onClick={() => dispatch("quanting:chart-zoom-in")}
        className="chart-toolbar-btn"
        title="줌 인 (+)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => dispatch("quanting:chart-zoom-out")}
        className="chart-toolbar-btn"
        title="줌 아웃 (-)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => dispatch("quanting:chart-fit")}
        className="chart-toolbar-btn"
        title="차트 맞춤 (Home)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </button>

      <div className="mx-0.5 h-4 w-px" style={{ background: "var(--border-color)" }} />

      {/* Fullscreen */}
      <button
        type="button"
        onClick={toggleFullscreen}
        className="chart-toolbar-btn"
        title="전체화면 (F)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="8 3 3 3 3 8" />
          <polyline points="21 8 21 3 16 3" />
          <polyline points="3 16 3 21 8 21" />
          <polyline points="16 21 21 21 21 16" />
        </svg>
      </button>
    </div>
  );
}

// Quick Indicator Menu (inline sub-component)
function QuickIndicatorMenu({ onClose: _onClose }: { onClose: () => void }) {
  const { indicators, toggleIndicator } = useSettingsStore();

  const items: { key: Parameters<typeof toggleIndicator>[0]; label: string; enabled: boolean }[] = [
    { key: "bb", label: "볼린저 밴드", enabled: indicators.bb.enabled },
    { key: "sma", label: "SMA", enabled: indicators.sma.enabled },
    { key: "ema", label: "EMA", enabled: indicators.ema.enabled },
    { key: "rsi", label: "RSI", enabled: indicators.rsi.enabled },
    { key: "macd", label: "MACD", enabled: indicators.macd.enabled },
    { key: "stochastic", label: "스토캐스틱", enabled: indicators.stochastic.enabled },
    { key: "volume", label: "거래량", enabled: indicators.volume.enabled },
    { key: "obv", label: "OBV", enabled: indicators.obv.enabled },
  ];

  return (
    <div className="chart-toolbar-dropdown" style={{ right: 0, minWidth: 140 }}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className="chart-toolbar-dropdown-item justify-between"
          onClick={() => toggleIndicator(item.key)}
        >
          <span>{item.label}</span>
          <span
            className="h-3 w-3 rounded-sm border"
            style={{
              background: item.enabled ? "var(--accent-primary)" : "transparent",
              borderColor: item.enabled ? "var(--accent-primary)" : "var(--border-color)",
            }}
          />
        </button>
      ))}
    </div>
  );
}
