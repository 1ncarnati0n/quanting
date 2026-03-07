import { forwardRef, useEffect, useMemo, useState, type ButtonHTMLAttributes } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDrawingStore, type DrawingTool } from "../../stores/useDrawingStore";
import { useChartStore } from "../../stores/useChartStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { getIntervalLabel, getIntervalsForMarket, getSymbolLabel, type Interval } from "../../utils/constants";
import { formatPrice } from "../../utils/formatters";
import { getInstrumentDisplay, getMarketBadgeMeta, summarizeCandles } from "../../utils/marketView";
import {
  TIME_RANGE_STORAGE_KEY,
  buildTimeRangeDetail,
  readSavedTimeRangeId,
  type TimeRangeId,
} from "../../utils/timeRange";

const INTRADAY_DROPDOWN_INTERVALS: readonly Interval[] = ["1m", "5m", "10m", "30m", "2h", "4h"];
const CORE_INTERVAL_TABS: readonly Interval[] = ["1d", "1w", "1M"];
const DRAWING_TOOL_OPTIONS: ReadonlyArray<{ key: DrawingTool; label: string }> = [
  { key: "none", label: "선택" },
  { key: "horizontal", label: "수평선" },
  { key: "trend", label: "추세선" },
  { key: "fib", label: "피보나치" },
  { key: "measure", label: "측정" },
  { key: "rectangle", label: "직사각형" },
  { key: "text", label: "텍스트" },
  { key: "channel", label: "채널" },
];

const CHART_TYPE_LABELS = {
  candlestick: "캔들",
  heikinAshi: "하이킨아시",
  line: "라인",
  area: "영역",
  bar: "바",
} as const;

interface DashboardChartHeaderProps {
  onOpenIndicators: () => void;
  onOpenCompare: () => void;
  onOpenDisplaySettings: () => void;
}

function HeaderTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`dashboard-chart-header__tab ${active ? "is-active" : ""}`}
    >
      {label}
    </button>
  );
}

const HeaderToolButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
    accent?: boolean;
    ariaLabel: string;
  }
>(function HeaderToolButton(
  {
    active = false,
    accent = false,
    className,
    title,
    ariaLabel,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      title={title}
      aria-label={ariaLabel}
      className={`dashboard-chart-header__tool-button${active ? " is-active" : ""}${accent ? " is-accent" : ""}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </button>
  );
});

function CandlestickGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <line x1="8" y1="4" x2="8" y2="20" stroke="#FF5B6E" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="5.5" y="8" width="5" height="7" rx="1.4" fill="#FF5B6E" />
      <line x1="16" y1="4" x2="16" y2="20" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="13.5" y="6" width="5" height="8" rx="1.4" fill="#3B82F6" />
    </svg>
  );
}

function TrashGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function GearGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .92 1.7 1.7 0 0 1-3.2 0 1.7 1.7 0 0 0-1-.92 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.92-1 1.7 1.7 0 0 1 0-3.2 1.7 1.7 0 0 0 .92-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.92 1.7 1.7 0 0 1 3.2 0 1.7 1.7 0 0 0 1 .92 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.24.39.57.7.96.89a1.7 1.7 0 0 1 0 3.2c-.39.19-.72.5-.96.91Z" />
    </svg>
  );
}

function PlusGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function DrawGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="5" cy="18" r="1.8" />
      <circle cx="19" cy="6" r="1.8" />
      <path d="M6.5 16.5 17.5 7.5" />
    </svg>
  );
}

function CompareGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M16 3h5v5" />
      <path d="m21 3-7 7" />
      <path d="M8 21H3v-5" />
      <path d="m3 21 7-7" />
    </svg>
  );
}

function FullscreenGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="8 3 3 3 3 8" />
      <polyline points="21 8 21 3 16 3" />
      <polyline points="3 16 3 21 8 21" />
      <polyline points="16 21 21 21 21 16" />
    </svg>
  );
}

export default function DashboardChartHeader({
  onOpenIndicators,
  onOpenCompare,
  onOpenDisplaySettings,
}: DashboardChartHeaderProps) {
  const {
    symbol,
    market,
    interval,
    chartType,
    compare,
    setInterval,
    setChartType,
    toggleFullscreen,
  } = useSettingsStore(
    useShallow((state) => ({
      symbol: state.symbol,
      market: state.market,
      interval: state.interval,
      chartType: state.chartType,
      compare: state.compare,
      setInterval: state.setInterval,
      setChartType: state.setChartType,
      toggleFullscreen: state.toggleFullscreen,
    })),
  );
  const {
    activeTool,
    drawings,
    selectedDrawingId,
    setActiveTool,
    removeDrawing,
    undoLastDrawing,
  } = useDrawingStore(
    useShallow((state) => ({
      activeTool: state.activeTool,
      drawings: state.drawings,
      selectedDrawingId: state.selectedDrawingId,
      setActiveTool: state.setActiveTool,
      removeDrawing: state.removeDrawing,
      undoLastDrawing: state.undoLastDrawing,
    })),
  );
  const { data, isLoading } = useChartStore(
    useShallow((state) => ({
      data: state.data,
      isLoading: state.isLoading,
    })),
  );
  const [intradayMenuOpen, setIntradayMenuOpen] = useState(false);
  const [activeRangeId, setActiveRangeId] = useState<TimeRangeId>(() => readSavedTimeRangeId());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const range = buildTimeRangeDetail(activeRangeId);
      window.dispatchEvent(
        new CustomEvent("quanting:chart-set-time-range", {
          detail: { id: activeRangeId, range },
        }),
      );
    }, 80);
    return () => window.clearTimeout(timer);
  }, [activeRangeId]);

  const symbolLabel = getSymbolLabel(symbol);
  const supportedIntervals = useMemo(() => getIntervalsForMarket(market), [market]);
  const intradayIntervals = useMemo(
    () => INTRADAY_DROPDOWN_INTERVALS.filter((item) => supportedIntervals.includes(item)),
    [supportedIntervals],
  );
  const intradayTriggerActive =
    interval === "1h" || intradayIntervals.includes(interval);
  const intradayTriggerLabel = interval === "1h"
    ? "60분"
    : intradayIntervals.includes(interval)
      ? getIntervalLabel(interval)
      : "60분";
  const instrument = getInstrumentDisplay(symbol, symbolLabel, market);
  const marketBadge = getMarketBadgeMeta(market);
  const candles = data?.candles ?? [];
  const { lastCandle, change, changePct } = useMemo(() => summarizeCandles(candles), [candles]);
  const changeColor = change >= 0 ? "var(--market-up)" : "var(--market-down)";
  const priceLabel = lastCandle ? formatPrice(lastCandle.close, market) : "-";
  const deltaLabel = lastCandle
    ? `${change >= 0 ? "+" : ""}${formatPrice(Math.abs(change), market)} (${change >= 0 ? "+" : ""}${changePct.toFixed(2)}%)`
    : "데이터 연결 중";
  const currentDrawingLabel = useMemo(
    () => DRAWING_TOOL_OPTIONS.find((item) => item.key === activeTool)?.label ?? "선택",
    [activeTool],
  );
  const deleteDrawing = () => {
    if (selectedDrawingId) {
      removeDrawing(selectedDrawingId);
      return;
    }
    if (drawings.length > 0) {
      undoLastDrawing();
    }
  };

  const selectRange = (nextRangeId: TimeRangeId) => {
    setActiveRangeId(nextRangeId);
    try {
      localStorage.setItem(TIME_RANGE_STORAGE_KEY, nextRangeId);
    } catch {}
  };

  return (
    <div className="dashboard-chart-header">
      <div className="dashboard-chart-header__summary">
        <div className="min-w-0">
          <div className="dashboard-chart-header__eyebrow">
            <span
              className="dashboard-chart-header__market-badge"
              style={{
                background: `color-mix(in srgb, ${marketBadge.color} 14%, transparent)`,
                color: marketBadge.color,
              }}
            >
              {marketBadge.label}
            </span>
            <span className="dashboard-chart-header__secondary">
              {instrument.secondary ?? symbol}
            </span>
            <span className="dashboard-chart-header__live">
              <span
                className="dashboard-chart-header__live-dot"
                style={{ background: isLoading ? "var(--warning)" : "var(--market-up)" }}
              />
              {isLoading ? "Sync" : "Live"}
            </span>
          </div>

          <div className="dashboard-chart-header__title-row">
            <h1 className="dashboard-chart-header__title">{instrument.primary}</h1>
            <span className="dashboard-chart-header__type-pill">
              {CHART_TYPE_LABELS[chartType]}
            </span>
          </div>
        </div>

        <div className="dashboard-chart-header__price-block">
          <div className="dashboard-chart-header__price">{priceLabel}</div>
          <div className="dashboard-chart-header__delta" style={{ color: changeColor }}>
            {deltaLabel}
          </div>
        </div>
      </div>

      <div className="dashboard-chart-header__tabs">
        <div className="dashboard-chart-header__tab-group">
          <DropdownMenu open={intradayMenuOpen} onOpenChange={setIntradayMenuOpen}>
            <div className="relative">
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`dashboard-chart-header__tab dashboard-chart-header__tab--trigger ${intradayTriggerActive || intradayMenuOpen ? "is-active" : ""}`}
                  aria-label="분 인터벌 선택"
                  title="분 인터벌 선택"
                >
                  <span>{intradayTriggerLabel}</span>
                  <svg
                    className={`dashboard-chart-header__tab-chevron ${intradayMenuOpen ? "is-open" : ""}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="dashboard-chart-header__interval-menu" sideOffset={8}>
                {intradayIntervals.map((tab) => {
                  const active = interval === tab;
                  return (
                    <DropdownMenuItem
                      key={tab}
                      role="menuitemradio"
                      aria-checked={active}
                      data-dropdown-active={active ? "true" : undefined}
                      onSelect={() => {
                        setInterval(tab);
                        setIntradayMenuOpen(false);
                      }}
                      className={`dashboard-chart-header__interval-menu-item ${active ? "is-active" : ""}`}
                    >
                      <span>{getIntervalLabel(tab)}</span>
                      {active ? <span>✓</span> : null}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </div>
          </DropdownMenu>

          {CORE_INTERVAL_TABS.map((tab) => (
            <HeaderTab
              key={tab}
              active={interval === tab}
              label={tab === "1d" ? "일" : tab === "1w" ? "주" : "월"}
              onClick={() => setInterval(tab)}
            />
          ))}
          <HeaderTab
            active={activeRangeId === "1y"}
            label="년"
            onClick={() => selectRange("1y")}
          />
        </div>

        <div className="dashboard-chart-header__toolbar-row">
          <div className="dashboard-chart-header__toolbar-shell">
            <span className="dashboard-chart-header__toolbar-divider" aria-hidden="true" />
            <DropdownMenu>
              <div className="relative">
                <DropdownMenuTrigger asChild>
                  <HeaderToolButton
                    accent
                    title={`차트 타입: ${CHART_TYPE_LABELS[chartType]}`}
                    ariaLabel={`차트 타입 선택: ${CHART_TYPE_LABELS[chartType]}`}
                  >
                    <CandlestickGlyph />
                  </HeaderToolButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="dashboard-chart-header__tool-menu" sideOffset={8}>
                  {(Object.entries(CHART_TYPE_LABELS) as Array<[keyof typeof CHART_TYPE_LABELS, string]>).map(([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      className={`dashboard-chart-header__tool-menu-item ${chartType === key ? "is-active" : ""}`}
                      data-dropdown-active={chartType === key ? "true" : undefined}
                      onSelect={() => setChartType(key)}
                    >
                      <span>{label}</span>
                      {chartType === key ? <span>✓</span> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </div>
            </DropdownMenu>
            <HeaderToolButton
              disabled={drawings.length === 0}
              title={selectedDrawingId ? "선택 드로잉 삭제" : "최근 드로잉 실행 취소"}
              ariaLabel={selectedDrawingId ? "선택 드로잉 삭제" : "최근 드로잉 실행 취소"}
              onClick={deleteDrawing}
            >
              <TrashGlyph />
            </HeaderToolButton>
            <HeaderToolButton
              title="표시 설정 열기"
              ariaLabel="표시 설정 열기"
              onClick={onOpenDisplaySettings}
            >
              <GearGlyph />
            </HeaderToolButton>
          </div>

          <div className="dashboard-chart-header__toolbar-shell">
            <HeaderToolButton
              title="지표 패널 열기"
              ariaLabel="지표 패널 열기"
              onClick={onOpenIndicators}
            >
              <PlusGlyph />
            </HeaderToolButton>
            <DropdownMenu>
              <div className="relative">
                <DropdownMenuTrigger asChild>
                  <HeaderToolButton
                    active={activeTool !== "none"}
                    title={`그리기 도구: ${currentDrawingLabel}`}
                    ariaLabel={`그리기 도구 선택: ${currentDrawingLabel}`}
                  >
                    <DrawGlyph />
                  </HeaderToolButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="dashboard-chart-header__tool-menu" sideOffset={8}>
                  {DRAWING_TOOL_OPTIONS.map((tool) => (
                    <DropdownMenuItem
                      key={tool.key}
                      className={`dashboard-chart-header__tool-menu-item ${activeTool === tool.key ? "is-active" : ""}`}
                      data-dropdown-active={activeTool === tool.key ? "true" : undefined}
                      onSelect={() => setActiveTool(tool.key)}
                    >
                      <span>{tool.label}</span>
                      {activeTool === tool.key ? <span>✓</span> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </div>
            </DropdownMenu>
            <HeaderToolButton
              active={compare.enabled}
              title="비교 심볼"
              ariaLabel="비교 심볼 열기"
              onClick={onOpenCompare}
            >
              <CompareGlyph />
            </HeaderToolButton>
            <HeaderToolButton
              title="전체 화면"
              ariaLabel="전체 화면 전환"
              onClick={toggleFullscreen}
            >
              <FullscreenGlyph />
            </HeaderToolButton>
          </div>
        </div>
      </div>
    </div>
  );
}
