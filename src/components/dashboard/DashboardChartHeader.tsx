import { forwardRef, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ChartIndicatorPanel from "./ChartIndicatorPanel";
import { useDrawingStore, type DrawingTool } from "../../stores/useDrawingStore";
import { useChartStore } from "../../stores/useChartStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { getIntervalLabel, getIntervalsForMarket, getSymbolLabel, type Interval } from "../../utils/constants";
import { formatPrice } from "../../utils/formatters";
import {
  getInstrumentDisplay,
  getInstrumentLogoMeta,
  getMarketBadgeMeta,
  summarizeCandles,
} from "../../utils/marketView";
import {
  TIME_RANGE_STORAGE_KEY,
  buildTimeRangeDetail,
  readSavedTimeRangeId,
  type TimeRangeId,
} from "../../utils/timeRange";

const INTRADAY_DROPDOWN_INTERVALS: readonly Interval[] = ["1m", "5m", "10m", "30m", "1h", "2h", "4h"];
const CORE_INTERVAL_TABS: readonly Interval[] = ["1d", "1w", "1M", "1Y"];
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
  onOpenAlerts: () => void;
  onOpenDisplaySettings: () => void;
  compact?: boolean;
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

const HeaderTextAction = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
    ariaLabel: string;
  }
>(function HeaderTextAction(
  {
    active = false,
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
      className={`dashboard-chart-header__action${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
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

function BellGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.42V11a6 6 0 1 0-12 0v3.18a2 2 0 0 1-.6 1.41L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </svg>
  );
}

function HeartGlyph({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 20.7-1.15-1.04C5.8 15.1 2.5 12.1 2.5 8.43 2.5 5.45 4.84 3.1 7.82 3.1c1.68 0 3.29.78 4.18 2 0 0 .1.13.14.19.05-.06.14-.19.14-.19.9-1.22 2.5-2 4.18-2 2.98 0 5.32 2.35 5.32 5.33 0 3.66-3.3 6.67-8.35 11.22L12 20.7Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L7 21H3v-4z" />
    </svg>
  );
}

export default function DashboardChartHeader({
  onOpenIndicators: _onOpenIndicators,
  onOpenAlerts,
  onOpenDisplaySettings,
  compact = false,
}: DashboardChartHeaderProps) {
  const {
    symbol,
    market,
    interval,
    chartType,
    favorites,
    setInterval,
    setChartType,
    toggleFullscreen,
    toggleFavorite,
  } = useSettingsStore(
    useShallow((state) => ({
      symbol: state.symbol,
      market: state.market,
      interval: state.interval,
      chartType: state.chartType,
      favorites: state.favorites,
      setInterval: state.setInterval,
      setChartType: state.setChartType,
      toggleFullscreen: state.toggleFullscreen,
      toggleFavorite: state.toggleFavorite,
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
  const { data, fundamentals, fetchFundamentals } = useChartStore(
    useShallow((state) => ({
      data: state.data,
      fundamentals: state.fundamentals,
      fetchFundamentals: state.fetchFundamentals,
    })),
  );
  const [intradayMenuOpen, setIntradayMenuOpen] = useState(false);
  const [indicatorPanelOpen, setIndicatorPanelOpen] = useState(false);
  const [activeRangeId, setActiveRangeId] = useState<TimeRangeId>(() => readSavedTimeRangeId());
  const [preferredIntradayInterval, setPreferredIntradayInterval] = useState<Interval>(() =>
    INTRADAY_DROPDOWN_INTERVALS.includes(interval) ? interval : "1h",
  );
  const indicatorPanelAnchorRef = useRef<HTMLDivElement | null>(null);
  const indicatorPanelSurfaceRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (INTRADAY_DROPDOWN_INTERVALS.includes(interval)) {
      setPreferredIntradayInterval(interval);
    }
  }, [interval]);

  useEffect(() => {
    if (compact || market === "crypto") return;
    void fetchFundamentals({ symbol, market });
  }, [compact, fetchFundamentals, market, symbol]);

  useEffect(() => {
    if (!indicatorPanelOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (indicatorPanelAnchorRef.current?.contains(target)) return;
      if (indicatorPanelSurfaceRef.current?.contains(target)) return;
      setIndicatorPanelOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIndicatorPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [indicatorPanelOpen]);

  const symbolLabel = getSymbolLabel(symbol);
  const supportedIntervals = useMemo(() => getIntervalsForMarket(market), [market]);
  const intradayIntervals = useMemo(
    () => INTRADAY_DROPDOWN_INTERVALS.filter((item) => supportedIntervals.includes(item)),
    [supportedIntervals],
  );
  const resolvedPreferredIntradayInterval =
    intradayIntervals.includes(preferredIntradayInterval)
      ? preferredIntradayInterval
      : (intradayIntervals[0] ?? "1h");
  const intradayTriggerActive = intradayIntervals.includes(interval);
  const displayedIntradayInterval = intradayTriggerActive ? interval : resolvedPreferredIntradayInterval;
  const intradayTriggerLabel = getIntervalLabel(displayedIntradayInterval);
  const instrument = getInstrumentDisplay(symbol, symbolLabel, market);
  const logoMeta = useMemo(
    () => getInstrumentLogoMeta(symbol, symbolLabel, market),
    [market, symbol, symbolLabel],
  );
  const marketBadge = getMarketBadgeMeta(market);
  const candles = data?.candles ?? [];
  const { lastCandle, high, low, change, changePct } = useMemo(() => summarizeCandles(candles), [candles]);
  const changeColor = change >= 0 ? "var(--market-up)" : "var(--market-down)";
  const priceLabel = lastCandle ? formatPrice(lastCandle.close, market) : "-";
  const deltaAmountLabel = lastCandle ? `${change >= 0 ? "+" : ""}${formatPrice(Math.abs(change), market)}` : "-";
  const deltaPctLabel = lastCandle ? `${change >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : "-";
  const currentFundamentals =
    fundamentals && fundamentals.symbol === symbol && fundamentals.market === market
      ? fundamentals
      : null;
  const currentDayStats = useMemo(() => {
    if (!lastCandle) return { dayHigh: null as number | null, dayLow: null as number | null };
    const toSessionKey = (time: number) => {
      const timestamp = time > 1_000_000_000_000 ? time : time * 1000;
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    };
    const lastKey = toSessionKey(lastCandle.time);
    const dayCandles = candles.filter((candle) => toSessionKey(candle.time) === lastKey);
    if (dayCandles.length === 0) return { dayHigh: lastCandle.high, dayLow: lastCandle.low };
    return {
      dayHigh: Math.max(...dayCandles.map((candle) => candle.high)),
      dayLow: Math.min(...dayCandles.map((candle) => candle.low)),
    };
  }, [candles, lastCandle]);
  const summaryStats = useMemo(
    () => [
      {
        label: "1일 최고",
        value: currentDayStats.dayHigh !== null ? formatPrice(currentDayStats.dayHigh, market) : high !== null ? formatPrice(high, market) : "-",
      },
      {
        label: "1일 최저",
        value: currentDayStats.dayLow !== null ? formatPrice(currentDayStats.dayLow, market) : low !== null ? formatPrice(low, market) : "-",
      },
      {
        label: "52주 최고",
        value: currentFundamentals?.fiftyTwoWeekHigh !== null && currentFundamentals?.fiftyTwoWeekHigh !== undefined
          ? formatPrice(currentFundamentals.fiftyTwoWeekHigh, market)
          : "-",
      },
      {
        label: "52주 최저",
        value: currentFundamentals?.fiftyTwoWeekLow !== null && currentFundamentals?.fiftyTwoWeekLow !== undefined
          ? formatPrice(currentFundamentals.fiftyTwoWeekLow, market)
          : "-",
      },
    ],
    [currentDayStats.dayHigh, currentDayStats.dayLow, currentFundamentals?.fiftyTwoWeekHigh, currentFundamentals?.fiftyTwoWeekLow, high, low, market],
  );
  const contextBadgeLabel = useMemo(() => {
    if (market === "krStock") return "국장";
    if (market === "usStock") return "미장";
    if (market === "crypto") return "코인";
    if (market === "forex") return "FX";
    return marketBadge.label;
  }, [market, marketBadge.label]);
  const isFavorite = useMemo(
    () => favorites.some((item) => item.symbol === symbol && item.market === market),
    [favorites, market, symbol],
  );
  const comparisonNote = market === "krStock" ? "어제보다" : market === "usStock" ? "전일대비" : "직전대비";
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

  const applyInterval = (nextInterval: Interval) => {
    if (nextInterval === "1Y") {
      selectRange("all");
    }
    setInterval(nextInterval);
  };

  const activatePreferredIntradayInterval = () => {
    setIntradayMenuOpen(false);
    applyInterval(resolvedPreferredIntradayInterval);
  };

  return (
    <div className={`dashboard-chart-header${compact ? " is-compact" : ""}`}>
      {!compact ? (
        <div className="dashboard-chart-header__summary">
          <div className="dashboard-chart-header__identity">
            <div className="dashboard-chart-header__symbol-icon" aria-hidden="true">
              <span
                className={`dashboard-chart-header__symbol-logo${logoMeta.monogram.length >= 3 ? " is-wide" : ""}`}
                style={{
                  background: logoMeta.background,
                  color: logoMeta.foreground,
                }}
              >
                <span className="dashboard-chart-header__symbol-logo-text">{logoMeta.monogram}</span>
                <span className="dashboard-chart-header__symbol-logo-badge">{logoMeta.badge}</span>
              </span>
            </div>
            <div className="dashboard-chart-header__identity-copy">
              <div className="dashboard-chart-header__title-row">
                <h1 className="dashboard-chart-header__title">{instrument.primary}</h1>
                <span className="dashboard-chart-header__title-code">{instrument.secondary ?? symbol}</span>
                <span
                  className="dashboard-chart-header__context-badge"
                  style={{
                    background: `color-mix(in srgb, ${marketBadge.color} 18%, var(--panel-control-fill))`,
                    color: marketBadge.color,
                  }}
                >
                  {contextBadgeLabel}
                </span>
                <button
                  type="button"
                  className="dashboard-chart-header__summary-mini-button"
                  onClick={onOpenDisplaySettings}
                  title="표시 설정 열기"
                  aria-label="표시 설정 열기"
                >
                  <EditGlyph />
                </button>
              </div>
              <div className="dashboard-chart-header__price-line">
                <span className="dashboard-chart-header__price">{priceLabel}</span>
                <span className="dashboard-chart-header__price-note">{comparisonNote}</span>
                <span className="dashboard-chart-header__delta" style={{ color: changeColor }}>
                  {deltaAmountLabel} ({deltaPctLabel})
                </span>
              </div>
            </div>
          </div>

          <div className="dashboard-chart-header__summary-side">
            <div className="dashboard-chart-header__summary-stats">
              {summaryStats.map((item) => (
                <div key={`${item.label}-${item.value}`} className="dashboard-chart-header__stat">
                  <span className="dashboard-chart-header__stat-label">{item.label}</span>
                  <span className="dashboard-chart-header__stat-value">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="dashboard-chart-header__summary-actions">
              <button
                type="button"
                className="dashboard-chart-header__summary-icon-button"
                onClick={onOpenAlerts}
                title="가격 알림 열기"
                aria-label="가격 알림 열기"
              >
                <BellGlyph />
              </button>
              <button
                type="button"
                className={`dashboard-chart-header__summary-icon-button${isFavorite ? " is-favorite" : ""}`}
                onClick={() => toggleFavorite(symbol, market)}
                title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                aria-pressed={isFavorite}
              >
                <HeartGlyph filled={isFavorite} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="dashboard-chart-header__tabs">
        <div className="dashboard-chart-header__tab-group">
          {intradayTriggerActive ? (
            <DropdownMenu open={intradayMenuOpen} onOpenChange={setIntradayMenuOpen}>
              <div className="dashboard-chart-header__menu-anchor">
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
                          setPreferredIntradayInterval(tab);
                          applyInterval(tab);
                          setIntradayMenuOpen(false);
                        }}
                        className={`dashboard-chart-header__interval-menu-item ${active ? "is-active" : ""}`}
                      >
                        <span>{getIntervalLabel(tab)}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </div>
            </DropdownMenu>
          ) : (
            <button
              type="button"
              className="dashboard-chart-header__tab dashboard-chart-header__tab--trigger"
              aria-label={`${intradayTriggerLabel} 인터벌 적용`}
              title={`${intradayTriggerLabel} 인터벌 적용`}
              onClick={activatePreferredIntradayInterval}
            >
              <span>{intradayTriggerLabel}</span>
              <svg
                className="dashboard-chart-header__tab-chevron"
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
          )}

          {CORE_INTERVAL_TABS.map((tab) => (
            <HeaderTab
              key={tab}
              active={interval === tab}
              label={tab === "1d" ? "일" : tab === "1w" ? "주" : tab === "1M" ? "월" : "년"}
              onClick={() => applyInterval(tab)}
            />
          ))}
          <span className="dashboard-chart-header__toolbar-divider" aria-hidden="true" />
          <div className="dashboard-chart-header__inline-tools">
            <DropdownMenu>
              <div className="dashboard-chart-header__menu-anchor">
                <DropdownMenuTrigger asChild>
                  <HeaderToolButton
                    accent
                    title={`차트 타입: ${CHART_TYPE_LABELS[chartType]}`}
                    ariaLabel={`차트 타입 선택: ${CHART_TYPE_LABELS[chartType]}`}
                  >
                    <CandlestickGlyph />
                  </HeaderToolButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="dashboard-chart-header__tool-menu dashboard-chart-header__tool-menu--compact"
                  sideOffset={8}
                >
                  {(Object.entries(CHART_TYPE_LABELS) as Array<[keyof typeof CHART_TYPE_LABELS, string]>).map(([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      className={`dashboard-chart-header__tool-menu-item dashboard-chart-header__tool-menu-item--compact ${chartType === key ? "is-active" : ""}`}
                      data-dropdown-active={chartType === key ? "true" : undefined}
                      onSelect={() => setChartType(key)}
                    >
                      <span>{label}</span>
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
        </div>

        <div className="dashboard-chart-header__actions">
          <div className="dashboard-chart-header__indicator-panel-anchor" ref={indicatorPanelAnchorRef}>
            <HeaderTextAction
              active={indicatorPanelOpen}
              title="보조지표 패널 열기"
              ariaLabel="보조지표 패널 열기"
              onClick={() => setIndicatorPanelOpen((prev) => !prev)}
            >
              <PlusGlyph />
              <span>보조지표</span>
            </HeaderTextAction>
            {indicatorPanelOpen ? (
              <ChartIndicatorPanel
                anchorRef={indicatorPanelAnchorRef}
                panelRef={indicatorPanelSurfaceRef}
                onClose={() => setIndicatorPanelOpen(false)}
              />
            ) : null}
          </div>
          <DropdownMenu>
            <div className="dashboard-chart-header__menu-anchor">
              <DropdownMenuTrigger asChild>
                <HeaderTextAction
                  active={activeTool !== "none"}
                  title={`그리기 도구: ${currentDrawingLabel}`}
                  ariaLabel={`그리기 도구 선택: ${currentDrawingLabel}`}
                >
                  <DrawGlyph />
                  <span>그리기</span>
                </HeaderTextAction>
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
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </div>
          </DropdownMenu>
          <HeaderTextAction
            title="전체 화면"
            ariaLabel="전체 화면 전환"
            onClick={toggleFullscreen}
          >
            <FullscreenGlyph />
            <span>차트 크게보기</span>
          </HeaderTextAction>
        </div>
      </div>
    </div>
  );
}
