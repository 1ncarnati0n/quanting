import { useState } from "react";
import { useSettingsStore, type ChartType } from "../stores/useSettingsStore";
import { useChartStore } from "../stores/useChartStore";
import { useReplayStore } from "../stores/useReplayStore";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CHART_TYPE_OPTIONS: { value: ChartType; label: string; icon: string }[] = [
  { value: "candlestick", label: "캔들스틱", icon: "M" },
  { value: "heikinAshi", label: "하이킨 아시", icon: "H" },
  { value: "line", label: "라인", icon: "L" },
  { value: "area", label: "영역", icon: "A" },
  { value: "bar", label: "바", icon: "B" },
];

export default function ChartToolbar() {
  const { chartType, setChartType, toggleFullscreen } = useSettingsStore();
  const candleCount = useChartStore((s) => s.data?.candles.length ?? 0);
  const replayEnabled = useReplayStore((s) => s.enabled);
  const replayPlaying = useReplayStore((s) => s.playing);
  const [openMenu, setOpenMenu] = useState<"type" | "indicator" | null>(null);

  const dispatch = (event: string) => {
    window.dispatchEvent(new CustomEvent(event));
  };

  const toggleReplay = () => {
    const replay = useReplayStore.getState();
    if (replay.enabled) {
      replay.exitReplay();
      return;
    }
    replay.enterReplay(candleCount);
  };

  const currentTypeLabel = CHART_TYPE_OPTIONS.find((o) => o.value === chartType)?.icon ?? "M";

  return (
    <div
      className="pointer-events-auto absolute right-20 top-2.5 z-10 flex items-center gap-0.5 rounded-md px-1 py-1"
      style={{
        background: "color-mix(in srgb, var(--background) 85%, transparent)",
        backdropFilter: "blur(6px)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Chart Type Dropdown */}
      <DropdownMenu
        open={openMenu === "type"}
        onOpenChange={(open) => setOpenMenu(open ? "type" : null)}
      >
        <div className="relative">
          <DropdownMenuTrigger asChild>
            <button type="button" className="chart-toolbar-btn" title="차트 타입">
              <span className="ds-type-caption font-bold leading-none">{currentTypeLabel}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            {CHART_TYPE_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                className="gap-2.5"
                style={{
                  background: chartType === opt.value ? "var(--accent)" : undefined,
                  color: chartType === opt.value ? "var(--primary)" : "var(--foreground)",
                }}
                onSelect={() => setChartType(opt.value)}
              >
                <span className="w-4 text-center font-bold">{opt.icon}</span>
                <span>{opt.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </div>
      </DropdownMenu>

      {/* Quick Indicator Toggle */}
      <DropdownMenu
        open={openMenu === "indicator"}
        onOpenChange={(open) => setOpenMenu(open ? "indicator" : null)}
      >
        <div className="relative">
          <DropdownMenuTrigger asChild>
            <button type="button" className="chart-toolbar-btn" title="지표">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[170px]">
            <QuickIndicatorMenu />
          </DropdownMenuContent>
        </div>
      </DropdownMenu>

      <div className="mx-0.5 h-5 w-px" style={{ background: "var(--border)" }} />

      {/* Bar Replay */}
      <button
        type="button"
        onClick={toggleReplay}
        className="chart-toolbar-btn"
        title="바 리플레이 (R)"
        style={{
          color: replayEnabled ? "var(--warning)" : undefined,
          background: replayEnabled ? "color-mix(in srgb, var(--warning) 16%, transparent)" : undefined,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 3 19 12 5 21 5 3" />
          {replayPlaying && <line x1="20" y1="4" x2="20" y2="20" />}
        </svg>
      </button>

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

      <DropdownMenuSeparator className="mx-0.5 h-5 w-px self-stretch bg-[var(--border)]" />

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

      <DropdownMenuSeparator className="mx-0.5 h-5 w-px self-stretch bg-[var(--border)]" />

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
function QuickIndicatorMenu() {
  const { indicators, toggleIndicator } = useSettingsStore();

  const items: { key: Parameters<typeof toggleIndicator>[0]; label: string; enabled: boolean }[] = [
    { key: "bb", label: "볼린저 밴드", enabled: indicators.bb.enabled },
    { key: "sma", label: "SMA", enabled: indicators.sma.enabled },
    { key: "ema", label: "EMA", enabled: indicators.ema.enabled },
    { key: "signalZones", label: "매수/매도 구간", enabled: indicators.signalZones.enabled },
    { key: "volumeProfile", label: "볼륨 프로파일", enabled: indicators.volumeProfile.enabled },
    { key: "fundamentals", label: "재무 오버레이", enabled: indicators.fundamentals.enabled },
    { key: "vwap", label: "VWAP", enabled: indicators.vwap.enabled },
    { key: "ichimoku", label: "Ichimoku", enabled: indicators.ichimoku.enabled },
    { key: "supertrend", label: "Supertrend", enabled: indicators.supertrend.enabled },
    { key: "psar", label: "Parabolic SAR", enabled: indicators.psar.enabled },
    { key: "rsi", label: "RSI", enabled: indicators.rsi.enabled },
    { key: "atr", label: "ATR", enabled: indicators.atr.enabled },
    { key: "macd", label: "MACD", enabled: indicators.macd.enabled },
    { key: "stochastic", label: "스토캐스틱", enabled: indicators.stochastic.enabled },
    { key: "volume", label: "거래량", enabled: indicators.volume.enabled },
    { key: "obv", label: "OBV", enabled: indicators.obv.enabled },
  ];

  return (
    <>
      {items.map((item) => (
        <DropdownMenuCheckboxItem
          key={item.key}
          checked={item.enabled}
          onCheckedChange={() => toggleIndicator(item.key)}
        >
          {item.label}
        </DropdownMenuCheckboxItem>
      ))}
    </>
  );
}
