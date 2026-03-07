import { useMemo, type CSSProperties } from "react";
import { useShallow } from "zustand/react/shallow";
import IntervalSelector from "./IntervalSelector";
import TimeRangeBar from "./TimeRangeBar";
import { useSettingsStore } from "../stores/useSettingsStore";
import { getIntervalLabel, getSymbolLabel, type Interval } from "../utils/constants";
import { useChartStore } from "../stores/useChartStore";
import { formatPrice } from "../utils/formatters";
import {
  formatCompactNumber,
  getMarketBadgeMeta,
  getInstrumentDisplay,
  summarizeCandles,
} from "../utils/marketView";
import { Button } from "@/components/ui/button";
import QuantingLogo from "./QuantingLogo";

interface MarketHeaderProps {
  onToggleWatchlist: () => void;
  onToggleSettings: () => void;
}

function HeaderMetric({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string;
  helper?: string;
  accent?: string;
}) {
  return (
    <div className="market-header__stat">
      <span className="market-header__stat-label">{label}</span>
      <strong className="market-header__stat-value" style={accent ? { color: accent } : undefined}>
        {value}
      </strong>
      {helper ? <span className="market-header__stat-helper">{helper}</span> : null}
    </div>
  );
}

export default function MarketHeader({
  onToggleWatchlist,
  onToggleSettings,
}: MarketHeaderProps) {
  const { theme, toggleTheme, symbol, market, interval } = useSettingsStore(
    useShallow((state) => ({
      theme: state.theme,
      toggleTheme: state.toggleTheme,
      symbol: state.symbol,
      market: state.market,
      interval: state.interval,
    })),
  );
  const { data, isLoading } = useChartStore(
    useShallow((state) => ({
      data: state.data,
      isLoading: state.isLoading,
    })),
  );
  const symbolLabel = getSymbolLabel(symbol);
  const candles = data?.candles ?? [];
  const { lastCandle, prevCandle, high, low, change, changePct } = useMemo(
    () => summarizeCandles(candles),
    [candles],
  );
  const changeColor = change >= 0 ? "var(--success)" : "var(--destructive)";
  const { label: marketBadge, color: marketColor } = getMarketBadgeMeta(market);
  const instrument = getInstrumentDisplay(symbol, symbolLabel, market);
  const headerStyle: CSSProperties = {
    "--market-badge-bg": marketColor,
    "--market-live-dot": isLoading ? "var(--warning)" : "var(--success)",
    "--market-trend-color": changeColor,
  } as CSSProperties;

  const rangePct = high !== null && low !== null && low > 0 ? ((high - low) / low) * 100 : null;
  const marketVenue =
    market === "crypto" ? "24H Global" : market === "forex" ? "FX Session" : market === "krStock" ? "KRX" : "US Equities";
  const priceDeltaLabel =
    lastCandle && prevCandle
      ? `${change >= 0 ? "+" : ""}${formatPrice(Math.abs(change), market)} (${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%)`
      : "변동 데이터 대기중";
  const headerSubtitle = instrument.secondary
    ? `${instrument.secondary} · ${getIntervalLabel(interval as Interval)}`
    : `${symbolLabel} · ${getIntervalLabel(interval as Interval)}`;

  return (
    <div className="market-header flex flex-col" style={headerStyle}>
      <div className="market-header__hero flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="market-header__eyebrow flex flex-wrap items-center gap-2">
              <span className="market-header__brand">
                <QuantingLogo size={17} color="var(--primary)" />
                <span className="ds-type-caption font-semibold tracking-[0.22em] text-token-primary uppercase">
                  QuantAI Terminal
                </span>
              </span>
              <span className="ds-market-badge ds-type-caption rounded-full px-2 py-1 font-bold leading-none">
                {marketBadge}
              </span>
              <span className="market-header__meta-pill ds-type-caption">
                {getIntervalLabel(interval as Interval)}
              </span>
              <span className="market-header__meta-pill ds-type-caption">
                {marketVenue}
              </span>
              <span className="ds-live-pill ds-type-caption inline-flex items-center gap-1 rounded-full px-2.5 py-1">
                <span className={`ds-live-dot h-1.5 w-1.5 rounded-full ${isLoading ? "" : "header-live-dot"}`} />
                {isLoading ? "갱신중" : "LIVE"}
              </span>
            </div>

            <div className="mt-3 min-w-0">
              <div className="flex min-w-0 flex-wrap items-end gap-x-3 gap-y-2">
                <h1 className="text-token-foreground truncate text-[1.4667rem] font-semibold leading-none tracking-[-0.035em] sm:text-[1.8667rem]">
                  {instrument.primary}
                </h1>
                {instrument.secondary && (
                  <span className="market-header__ticker-chip ds-type-label font-mono">
                    {instrument.secondary}
                  </span>
                )}
              </div>
              <p className="market-header__subtitle ds-type-label mt-2 truncate">
                {headerSubtitle}
              </p>
            </div>
          </div>

          <div className="market-header__price-panel w-full xl:max-w-[22rem]">
            <div className="market-header__price-eyebrow ds-type-caption">Last Price</div>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2">
              <span className="price-display text-token-foreground font-mono text-[1.8667rem] font-semibold tracking-[-0.035em] sm:text-[2.2667rem]">
                {lastCandle ? formatPrice(lastCandle.close, market) : "-"}
              </span>
              <span className="ds-market-delta ds-type-label font-mono font-semibold">
                {priceDeltaLabel}
              </span>
            </div>
            <div className="market-header__price-foot mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 ds-type-caption">
              <span>Open {lastCandle ? formatPrice(lastCandle.open, market) : "-"}</span>
              <span className="hidden h-3.5 w-px bg-[var(--border)] sm:block" />
              <span>Close {lastCandle ? formatPrice(lastCandle.close, market) : "-"}</span>
              <span className="hidden h-3.5 w-px bg-[var(--border)] sm:block" />
              <span>{isLoading ? "실시간 동기화 중" : "실시간 워치 활성"}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <HeaderMetric
            label="고가"
            value={high !== null ? formatPrice(high, market) : "-"}
            helper="세션 상단"
          />
          <HeaderMetric
            label="저가"
            value={low !== null ? formatPrice(low, market) : "-"}
            helper="세션 하단"
          />
          <HeaderMetric
            label="거래량"
            value={formatCompactNumber(lastCandle?.volume ?? null)}
            helper="최근 캔들 기준"
            accent="var(--success)"
          />
          <HeaderMetric
            label="레인지"
            value={rangePct !== null ? `${rangePct.toFixed(2)}%` : "-"}
            helper="고저 변동폭"
            accent="var(--primary)"
          />
        </div>
      </div>

      <div className="market-header__toolbar flex min-w-0 flex-wrap items-center gap-2.5 px-4 py-2.5 sm:px-5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleWatchlist}
          className="text-token-muted h-8 w-8 shrink-0 xl:hidden"
          title="관심종목 패널 열기/닫기 (Ctrl/Cmd+B)"
          aria-label="관심종목 패널 열기/닫기"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
          </svg>
        </Button>

        <div className="ui-control-cluster flex min-w-0 shrink-0">
          <span className="ds-type-caption text-token-muted hidden font-medium sm:inline">
            인터벌
          </span>
          <div className="min-w-0 overflow-visible">
            <IntervalSelector />
          </div>
        </div>

        <div className="ui-control-cluster hidden min-w-0 shrink-0 lg:flex">
          <span className="ds-type-caption text-token-muted font-medium">기간</span>
          <div className="min-w-0 overflow-visible">
            <TimeRangeBar />
          </div>
        </div>

        <div className="market-header__toolbar-note ds-type-caption hidden min-w-0 flex-1 items-center gap-2 text-token-muted lg:flex">
          <span className="market-header__toolbar-line" />
          전략/알림/리플레이는 현재 컨텍스트를 유지한 채 오른쪽 패널에서 조정됩니다.
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-token-muted h-8 w-8"
            title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
          >
            {theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSettings}
            className="text-token-muted h-8 w-8 xl:hidden"
            title="설정 패널 열기/닫기 (Ctrl/Cmd+,)"
            aria-label="설정 패널 열기/닫기"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M15 4v16" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
