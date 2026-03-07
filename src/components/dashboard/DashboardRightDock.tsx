import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import SegmentButton from "../patterns/SegmentButton";
import WatchlistSidebar from "../WatchlistSidebar";
import { useChartStore } from "../../stores/useChartStore";
import { useSettingsStore, type ChartType, type PriceScaleSettings } from "../../stores/useSettingsStore";
import { getIntervalLabel, getSymbolLabel, type Interval } from "../../utils/constants";
import { formatPrice } from "../../utils/formatters";
import {
  formatCompactNumber,
  getInstrumentDisplay,
  getMarketBadgeMeta,
  summarizeCandles,
} from "../../utils/marketView";
import type {
  DashboardDockFocusRequest,
  DashboardDockFocusSection,
  DashboardDockTab,
} from "./types";
import type { MarketType } from "../../types";

interface DashboardRightDockProps {
  activeTab: DashboardDockTab;
  embedded?: boolean;
  focusRequest?: DashboardDockFocusRequest | null;
  onClose?: () => void;
  onTabChange: (tab: DashboardDockTab) => void;
}

type CoreIndicatorKey =
  | "bb"
  | "rsi"
  | "macd"
  | "volume"
  | "vwap"
  | "signalZones"
  | "volumeProfile"
  | "fundamentals";

type IndicatorPresetId = "trend" | "momentum" | "overlay";

type SavedDashboardLayout = {
  savedAt: number;
  theme: "light" | "dark";
  chartType: ChartType;
  multiChartLayout: 1 | 2 | 4;
  priceScale: PriceScaleSettings;
  compare: {
    enabled: boolean;
    symbol: string;
    market: MarketType;
    normalize: boolean;
  };
  layout: {
    priceAreaRatio: number;
  };
  indicators: Record<CoreIndicatorKey, boolean>;
  signalStrategies: {
    emaCrossover: boolean;
    macdHistReversal: boolean;
    vwapBreakout: boolean;
    rsiDivergence: boolean;
  };
};

const DASHBOARD_LAYOUT_STORAGE_KEY = "quanting-dashboard-layout-preset";

const CORE_INDICATORS: Array<{
  key: CoreIndicatorKey;
  label: string;
  description: string;
}> = [
  { key: "bb", label: "볼린저", description: "채널 폭과 밴드" },
  { key: "rsi", label: "RSI", description: "과열/과매도 강도" },
  { key: "macd", label: "MACD", description: "추세 전환 신호" },
  { key: "volume", label: "거래량", description: "캔들 볼륨" },
  { key: "vwap", label: "VWAP", description: "평균 체결가 기준" },
  { key: "signalZones", label: "신호 구간", description: "전략 존 오버레이" },
  { key: "volumeProfile", label: "볼륨 프로파일", description: "가격대 체결량" },
  { key: "fundamentals", label: "재무 오버레이", description: "기초 지표 라벨" },
];

const PRESET_LABELS: Record<IndicatorPresetId, { title: string; description: string }> = {
  trend: {
    title: "추세 집중",
    description: "볼린저, MACD, VWAP, 신호 구간을 함께 켭니다.",
  },
  momentum: {
    title: "모멘텀 집중",
    description: "RSI, MACD, 거래량, 스토캐스틱 흐름을 봅니다.",
  },
  overlay: {
    title: "오버레이 최소",
    description: "차트 위 겹침을 줄이고 가격 시야를 넓힙니다.",
  },
};

function SnapshotRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="dashboard-dock__snapshot-row">
      <span className="dashboard-dock__snapshot-label">{label}</span>
      <strong className="dashboard-dock__snapshot-value" style={accent ? { color: accent } : undefined}>
        {value}
      </strong>
    </div>
  );
}

function PresetCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="dashboard-dock__preset-card" onClick={onClick}>
      <div className="dashboard-dock__preset-title">{title}</div>
      <div className="dashboard-dock__preset-description">{description}</div>
      <div className="dashboard-dock__preset-action">적용</div>
    </button>
  );
}

function DockSection({
  title,
  children,
  sectionRef,
  highlighted = false,
}: {
  title: string;
  children: React.ReactNode;
  sectionRef?: RefObject<HTMLElement | null>;
  highlighted?: boolean;
}) {
  return (
    <section
      ref={sectionRef}
      className={`dashboard-dock__section border-t px-5 py-4 ${highlighted ? "is-highlighted" : ""}`}
      style={{ borderColor: "var(--border)" }}
    >
      <div className="mb-3 text-[12px] font-semibold text-[var(--foreground)]">{title}</div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function readSavedDashboardLayoutTime(): number | null {
  try {
    const raw = localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDashboardLayout;
    return typeof parsed.savedAt === "number" ? parsed.savedAt : null;
  } catch {
    return null;
  }
}

function formatSavedTime(savedAt: number | null): string {
  if (!savedAt) return "저장된 구성 없음";
  try {
    return new Date(savedAt).toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "저장 시간 확인 불가";
  }
}

function getCompareSuggestions(market: MarketType): string[] {
  if (market === "crypto") return ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
  if (market === "krStock") return ["A005930", "A000660", "A035420"];
  if (market === "forex") return ["USDKRW=X", "EURKRW=X", "JPYKRW=X"];
  return ["SPY", "QQQ", "NVDA"];
}

export default function DashboardRightDock({
  activeTab,
  focusRequest,
  onClose,
  onTabChange,
}: DashboardRightDockProps) {
  const {
    symbol,
    market,
    interval,
    theme,
    chartType,
    priceScale,
    compare,
    multiChartLayout,
    indicators,
    priceAlerts,
    toggleTheme,
    toggleIndicator,
    setIndicator,
    setChartType,
    setPriceScale,
    setCompare,
    setMultiChartLayout,
    addPriceAlert,
    removePriceAlert,
    togglePriceAlert,
  } = useSettingsStore(
    useShallow((state) => ({
      symbol: state.symbol,
      market: state.market,
      interval: state.interval,
      theme: state.theme,
      chartType: state.chartType,
      priceScale: state.priceScale,
      compare: state.compare,
      multiChartLayout: state.multiChartLayout,
      indicators: state.indicators,
      priceAlerts: state.priceAlerts,
      toggleTheme: state.toggleTheme,
      toggleIndicator: state.toggleIndicator,
      setIndicator: state.setIndicator,
      setChartType: state.setChartType,
      setPriceScale: state.setPriceScale,
      setCompare: state.setCompare,
      setMultiChartLayout: state.setMultiChartLayout,
      addPriceAlert: state.addPriceAlert,
      removePriceAlert: state.removePriceAlert,
      togglePriceAlert: state.togglePriceAlert,
    })),
  );
  const { data, isLoading } = useChartStore(
    useShallow((state) => ({
      data: state.data,
      isLoading: state.isLoading,
    })),
  );

  const [notice, setNotice] = useState<string | null>(null);
  const [savedLayoutAt, setSavedLayoutAt] = useState<number | null>(() => readSavedDashboardLayoutTime());
  const [highlightedSection, setHighlightedSection] = useState<DashboardDockFocusSection | null>(null);
  const presetSectionRef = useRef<HTMLElement | null>(null);
  const alertSectionRef = useRef<HTMLElement | null>(null);
  const compareSectionRef = useRef<HTMLElement | null>(null);

  const symbolLabel = getSymbolLabel(symbol);
  const instrument = getInstrumentDisplay(symbol, symbolLabel, market);
  const marketBadge = getMarketBadgeMeta(market);
  const candles = data?.candles ?? [];
  const { lastCandle, high, low, change, changePct } = useMemo(() => summarizeCandles(candles), [candles]);
  const changeColor = change >= 0 ? "var(--market-up)" : "var(--market-down)";
  const enabledIndicatorCount = useMemo(
    () =>
      Object.values(indicators).reduce((count, item) => {
        if (item && typeof item === "object" && "enabled" in item && item.enabled) {
          return count + 1;
        }
        return count;
      }, 0),
    [indicators],
  );
  const scopedAlerts = useMemo(
    () => priceAlerts.filter((alert) => alert.symbol === symbol && alert.market === market),
    [market, priceAlerts, symbol],
  );
  const compareSuggestions = useMemo(() => getCompareSuggestions(compare.market), [compare.market]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!focusRequest) return undefined;
    const targetMap: Record<DashboardDockFocusSection, HTMLElement | null> = {
      presets: presetSectionRef.current,
      alerts: alertSectionRef.current,
      compare: compareSectionRef.current,
    };
    const target = targetMap[focusRequest.section];
    if (!target) return undefined;

    setHighlightedSection(focusRequest.section);
    target.scrollIntoView({ behavior: "smooth", block: "start" });

    const timer = window.setTimeout(() => setHighlightedSection(null), 1800);
    return () => window.clearTimeout(timer);
  }, [focusRequest]);

  const announce = (message: string) => {
    setNotice(message);
  };

  const applyIndicatorPreset = (preset: IndicatorPresetId) => {
    const store = useSettingsStore.getState();

    const coreStates: Record<CoreIndicatorKey, boolean> =
      preset === "trend"
        ? {
          bb: true,
          rsi: false,
          macd: true,
          volume: true,
          vwap: true,
          signalZones: true,
          volumeProfile: false,
          fundamentals: false,
        }
        : preset === "momentum"
          ? {
            bb: false,
            rsi: true,
            macd: true,
            volume: true,
            vwap: false,
            signalZones: false,
            volumeProfile: false,
            fundamentals: false,
          }
          : {
            bb: true,
            rsi: false,
            macd: false,
            volume: false,
            vwap: true,
            signalZones: false,
            volumeProfile: false,
            fundamentals: false,
          };

    (Object.entries(coreStates) as Array<[CoreIndicatorKey, boolean]>).forEach(([key, enabled]) => {
      store.setIndicator(key, { enabled });
    });

    if (preset === "trend") {
      store.setIndicator("signalStrategies", {
        emaCrossover: true,
        macdHistReversal: true,
        vwapBreakout: true,
        rsiDivergence: false,
      });
      store.setIndicator("layout", { priceAreaRatio: 0.68 });
    } else if (preset === "momentum") {
      store.setIndicator("stochastic", { enabled: true });
      store.setIndicator("signalStrategies", {
        emaCrossover: false,
        macdHistReversal: true,
        vwapBreakout: false,
        rsiDivergence: true,
      });
      store.setIndicator("layout", { priceAreaRatio: 0.6 });
    } else {
      store.setIndicator("stochastic", { enabled: false });
      store.setIndicator("signalStrategies", {
        emaCrossover: false,
        macdHistReversal: false,
        vwapBreakout: false,
        rsiDivergence: false,
      });
      store.setIndicator("layout", { priceAreaRatio: 0.74 });
    }

    announce(`${PRESET_LABELS[preset].title} 프리셋을 적용했습니다.`);
  };

  const saveCurrentLayout = () => {
    const snapshot: SavedDashboardLayout = {
      savedAt: Date.now(),
      theme,
      chartType,
      multiChartLayout,
      priceScale,
      compare,
      layout: {
        priceAreaRatio: indicators.layout.priceAreaRatio,
      },
      indicators: {
        bb: indicators.bb.enabled,
        rsi: indicators.rsi.enabled,
        macd: indicators.macd.enabled,
        volume: indicators.volume.enabled,
        vwap: indicators.vwap.enabled,
        signalZones: indicators.signalZones.enabled,
        volumeProfile: indicators.volumeProfile.enabled,
        fundamentals: indicators.fundamentals.enabled,
      },
      signalStrategies: {
        emaCrossover: indicators.signalStrategies.emaCrossover,
        macdHistReversal: indicators.signalStrategies.macdHistReversal,
        vwapBreakout: indicators.signalStrategies.vwapBreakout,
        rsiDivergence: indicators.signalStrategies.rsiDivergence,
      },
    };
    try {
      localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(snapshot));
      setSavedLayoutAt(snapshot.savedAt);
      announce("현재 표시 구성을 저장했습니다.");
    } catch {
      announce("구성 저장에 실패했습니다.");
    }
  };

  const restoreSavedLayout = () => {
    try {
      const raw = localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);
      if (!raw) {
        announce("저장된 구성이 없습니다.");
        return;
      }
      const saved = JSON.parse(raw) as SavedDashboardLayout;
      const store = useSettingsStore.getState();

      if (saved.theme !== store.theme) {
        store.toggleTheme();
      }
      store.setChartType(saved.chartType);
      store.setMultiChartLayout(saved.multiChartLayout);
      store.setPriceScale(saved.priceScale);
      store.setCompare(saved.compare);
      store.setIndicator("layout", saved.layout);

      (Object.entries(saved.indicators) as Array<[CoreIndicatorKey, boolean]>).forEach(([key, enabled]) => {
        store.setIndicator(key, { enabled });
      });
      store.setIndicator("signalStrategies", saved.signalStrategies);
      announce("저장된 표시 구성을 적용했습니다.");
    } catch {
      announce("저장된 구성을 읽지 못했습니다.");
    }
  };

  const applyCompareOverlay = () => {
    setCompare({ enabled: true });
    announce(`${compare.symbol} 비교 오버레이를 적용했습니다.`);
  };

  const addRelativeAlert = (condition: "above" | "below", ratio: number) => {
    if (!lastCandle) {
      announce("가격 데이터가 준비되면 알림을 추가할 수 있습니다.");
      return;
    }
    const nextPrice =
      condition === "above"
        ? lastCandle.close * (1 + ratio)
        : lastCandle.close * (1 - ratio);
    addPriceAlert(nextPrice, condition, symbol, market);
    announce(`${condition === "above" ? "+" : "-"}${Math.round(ratio * 100)}% 가격 알림을 추가했습니다.`);
  };

  return (
    <aside
      className="dashboard-dock flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden"
      style={{ background: "var(--panel-fill)" }}
    >
      <div className="dashboard-dock__header flex h-12 items-center justify-between border-b px-5" style={{ borderColor: "var(--border)" }}>
        <div className="text-[15px] font-semibold text-[var(--foreground)]">
          {activeTab === "watchlist" ? "관심종목" : "분석 패널"}
        </div>
        {onClose ? (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="패널 닫기" title="닫기">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Button>
        ) : null}
      </div>

      {activeTab !== "watchlist" ? (
        <div className="dashboard-dock__hero border-b px-5 py-3.5" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex rounded-[6px] px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    background: `color-mix(in srgb, ${marketBadge.color} 14%, var(--panel-control-fill))`,
                    color: marketBadge.color,
                  }}
                >
                  {marketBadge.label}
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  {getIntervalLabel(interval as Interval)}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: isLoading ? "var(--warning)" : "var(--market-up)" }}
                  />
                  {isLoading ? "Sync" : "Live"}
                </span>
              </div>
              <div className="mt-1.5 text-[18px] font-semibold tracking-[-0.02em] text-[var(--foreground)]">{instrument.primary}</div>
              <div className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
                {instrument.secondary ?? symbol}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[28px] font-semibold leading-none tracking-[-0.04em] text-[var(--foreground)]">
                {lastCandle ? formatPrice(lastCandle.close, market) : "-"}
              </div>
              <div className="mt-1 text-[12px] font-medium" style={{ color: changeColor }}>
                {lastCandle ? `${change >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : "대기중"}
              </div>
            </div>
          </div>

          <div className="dashboard-dock__snapshot mt-3">
            <SnapshotRow label="고가" value={high !== null ? formatPrice(high, market) : "-"} />
            <SnapshotRow label="저가" value={low !== null ? formatPrice(low, market) : "-"} />
            <SnapshotRow
              label="변동"
              value={lastCandle ? `${change >= 0 ? "+" : ""}${formatPrice(Math.abs(change), market)}` : "-"}
              accent={changeColor}
            />
            <SnapshotRow label="거래량" value={formatCompactNumber(lastCandle?.volume ?? null)} />
          </div>
        </div>
      ) : null}

      <div className="dashboard-dock__mode-tabs px-5 py-3">
        <div className="grid grid-cols-3 gap-1 rounded-[10px] bg-[var(--panel-control-fill)] p-1">
          <SegmentButton active={activeTab === "watchlist"} activeTone="accent" onClick={() => onTabChange("watchlist")}>
            관심종목
          </SegmentButton>
          <SegmentButton active={activeTab === "indicators"} activeTone="accent" onClick={() => onTabChange("indicators")}>
            지표
          </SegmentButton>
          <SegmentButton active={activeTab === "layout"} activeTone="accent" onClick={() => onTabChange("layout")}>
            표시
          </SegmentButton>
        </div>
      </div>

      {notice ? (
        <div className="px-5 pb-3">
          <div className="dashboard-dock__notice" role="status" aria-live="polite">
            {notice}
          </div>
        </div>
      ) : null}

      {activeTab === "watchlist" ? (
        <div className="dashboard-dock__watchlist-host min-h-0 flex-1">
          <WatchlistSidebar
            embedded
            onSelectSymbol={() => {
              if (onClose) onClose();
            }}
          />
        </div>
      ) : null}

      {activeTab !== "watchlist" ? (
        <ScrollArea className="min-h-0 flex-1" viewportClassName="h-full pb-4">
          {activeTab === "indicators" ? (
            <>
              <DockSection
                title="추천 프리셋"
                sectionRef={presetSectionRef}
                highlighted={highlightedSection === "presets"}
              >
                <div className="dashboard-dock__preset-grid">
                  {(["trend", "momentum", "overlay"] as const).map((preset) => (
                    <PresetCard
                      key={preset}
                      title={PRESET_LABELS[preset].title}
                      description={PRESET_LABELS[preset].description}
                      onClick={() => applyIndicatorPreset(preset)}
                    />
                  ))}
                </div>
              </DockSection>

              <DockSection title={`핵심 지표 · ${enabledIndicatorCount}개 활성`}>
                <div className="space-y-2">
                  {CORE_INDICATORS.map((item) => (
                    <div
                      key={item.key}
                      className="dashboard-dock__toggle-row flex items-center justify-between gap-3 rounded-[10px] border px-3 py-2.5"
                      style={{
                        borderColor: indicators[item.key].enabled ? "color-mix(in srgb, var(--primary) 28%, var(--border))" : "var(--border)",
                        background: indicators[item.key].enabled ? "color-mix(in srgb, var(--primary) 8%, var(--panel-control-fill))" : "var(--panel-control-fill)",
                      }}
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[var(--foreground)]">{item.label}</div>
                        <div className="text-[12px] text-[var(--muted-foreground)]">{item.description}</div>
                      </div>
                      <Switch checked={indicators[item.key].enabled} onCheckedChange={() => toggleIndicator(item.key)} />
                    </div>
                  ))}
                </div>
              </DockSection>

              <DockSection
                title={`가격 알림 · ${scopedAlerts.length}개`}
                sectionRef={alertSectionRef}
                highlighted={highlightedSection === "alerts"}
              >
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" className="justify-center" onClick={() => addRelativeAlert("above", 0.02)}>
                    +2% 상향
                  </Button>
                  <Button variant="secondary" className="justify-center" onClick={() => addRelativeAlert("below", 0.02)}>
                    -2% 하향
                  </Button>
                  <Button variant="outline" className="justify-center" onClick={() => addRelativeAlert("above", 0.05)}>
                    +5% 상향
                  </Button>
                  <Button variant="outline" className="justify-center" onClick={() => addRelativeAlert("below", 0.05)}>
                    -5% 하향
                  </Button>
                </div>

                <div className="space-y-2">
                  {scopedAlerts.slice(0, 4).map((alert) => (
                    <div key={alert.id} className="dashboard-dock__alert-row">
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--foreground)]">
                          {alert.condition === "above" ? "상향 도달" : "하향 도달"}
                        </div>
                        <div className="text-[12px] text-[var(--muted-foreground)]">
                          {formatPrice(alert.price, market)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => togglePriceAlert(alert.id)}
                        >
                          {alert.active ? "활성" : "중지"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-[var(--destructive)]"
                          onClick={() => removePriceAlert(alert.id)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))}
                  {scopedAlerts.length === 0 ? (
                    <div className="dashboard-dock__empty-note">현재 종목에 등록된 가격 알림이 없습니다.</div>
                  ) : null}
                </div>
              </DockSection>

              <DockSection title="시그널 분석">
                <div className="grid grid-cols-2 gap-2">
                  <SegmentButton
                    inactiveSurface="card"
                    active={indicators.signalStrategies.emaCrossover}
                    onClick={() => setIndicator("signalStrategies", { emaCrossover: !indicators.signalStrategies.emaCrossover })}
                  >
                    EMA 교차
                  </SegmentButton>
                  <SegmentButton
                    inactiveSurface="card"
                    active={indicators.signalStrategies.macdHistReversal}
                    onClick={() =>
                      setIndicator("signalStrategies", { macdHistReversal: !indicators.signalStrategies.macdHistReversal })
                    }
                  >
                    MACD 반전
                  </SegmentButton>
                  <SegmentButton
                    inactiveSurface="card"
                    active={indicators.signalStrategies.vwapBreakout}
                    onClick={() => setIndicator("signalStrategies", { vwapBreakout: !indicators.signalStrategies.vwapBreakout })}
                  >
                    VWAP 돌파
                  </SegmentButton>
                  <SegmentButton
                    inactiveSurface="card"
                    active={indicators.signalStrategies.rsiDivergence}
                    onClick={() =>
                      setIndicator("signalStrategies", { rsiDivergence: !indicators.signalStrategies.rsiDivergence })
                    }
                  >
                    RSI 다이버전스
                  </SegmentButton>
                </div>
              </DockSection>
            </>
          ) : (
            <>
              <DockSection title="차트 표현">
                <div className="grid grid-cols-2 gap-2">
                  <SegmentButton inactiveSurface="card" active={theme === "dark"} activeTone="accent" onClick={() => theme !== "dark" && toggleTheme()}>
                    다크
                  </SegmentButton>
                  <SegmentButton inactiveSurface="card" active={theme === "light"} activeTone="accent" onClick={() => theme !== "light" && toggleTheme()}>
                    라이트
                  </SegmentButton>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "candlestick" as const, label: "캔들" },
                    { value: "heikinAshi" as const, label: "HA" },
                    { value: "line" as const, label: "라인" },
                    { value: "area" as const, label: "영역" },
                    { value: "bar" as const, label: "바" },
                  ] as const).map((option) => (
                    <SegmentButton
                      key={option.value}
                      size="sm"
                      inactiveSurface="card"
                      activeTone="accent"
                      active={chartType === option.value}
                      onClick={() => setChartType(option.value)}
                    >
                      {option.label}
                    </SegmentButton>
                  ))}
                </div>
              </DockSection>

              <DockSection title="차트 레이아웃">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 1 as const, label: "1분할" },
                    { value: 2 as const, label: "2분할" },
                    { value: 4 as const, label: "4분할" },
                  ] as const).map((option) => (
                    <SegmentButton
                      key={option.value}
                      size="sm"
                      inactiveSurface="card"
                      activeTone="accent"
                      active={multiChartLayout === option.value}
                      onClick={() => setMultiChartLayout(option.value)}
                    >
                      {option.label}
                    </SegmentButton>
                  ))}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-[12px] text-[var(--muted-foreground)]">
                    <span>가격 영역 높이</span>
                    <span className="text-[var(--foreground)]">
                      {Math.round(indicators.layout.priceAreaRatio * 100)}%
                    </span>
                  </div>
                  <Slider
                    min={0.35}
                    max={0.85}
                    step={0.01}
                    value={[indicators.layout.priceAreaRatio]}
                    onValueChange={(next) => setIndicator("layout", { priceAreaRatio: next[0] ?? indicators.layout.priceAreaRatio })}
                    aria-label="가격 영역 높이"
                  />
                </div>
              </DockSection>

              <DockSection
                title="가격 축 · 비교"
                sectionRef={compareSectionRef}
                highlighted={highlightedSection === "compare"}
              >
                <div className="grid grid-cols-2 gap-2">
                  <SegmentButton active={priceScale.mode === "normal"} activeTone="accent" onClick={() => setPriceScale({ mode: "normal" })}>
                    기본 축
                  </SegmentButton>
                  <SegmentButton
                    inactiveSurface="card"
                    activeTone="accent"
                    active={priceScale.mode === "logarithmic"}
                    onClick={() => setPriceScale({ mode: "logarithmic" })}
                  >
                    로그 축
                  </SegmentButton>
                </div>

                <div className="flex items-center justify-between rounded-[10px] border px-3 py-2.5" style={{ borderColor: "var(--border)", background: "var(--panel-control-fill)" }}>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--foreground)]">자동 스케일</div>
                    <div className="text-[12px] text-[var(--muted-foreground)]">가격 변동에 맞춰 축 자동 조정</div>
                  </div>
                  <Switch checked={priceScale.autoScale} onCheckedChange={(checked) => setPriceScale({ autoScale: checked })} />
                </div>

                <div className="flex items-center justify-between rounded-[10px] border px-3 py-2.5" style={{ borderColor: "var(--border)", background: "var(--panel-control-fill)" }}>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--foreground)]">비교 오버레이</div>
                    <div className="text-[12px] text-[var(--muted-foreground)]">다른 심볼을 현재 차트 위에 겹쳐 표시</div>
                  </div>
                  <Switch checked={compare.enabled} onCheckedChange={(checked) => setCompare({ enabled: checked })} />
                </div>

                <div className="flex items-center justify-between rounded-[10px] border px-3 py-2.5" style={{ borderColor: "var(--border)", background: "var(--panel-control-fill)" }}>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--foreground)]">정규화 비교</div>
                    <div className="text-[12px] text-[var(--muted-foreground)]">비교 심볼을 같은 기준선으로 환산</div>
                  </div>
                  <Switch checked={compare.normalize} onCheckedChange={(checked) => setCompare({ normalize: checked })} />
                </div>

                <Input
                  type="text"
                  size="sm"
                  value={compare.symbol}
                  onChange={(event) => setCompare({ symbol: event.target.value.toUpperCase() })}
                  placeholder="비교 심볼"
                  className="font-medium"
                />

                <div className="grid grid-cols-4 gap-2">
                  {([
                    { value: "usStock" as const, label: "US" },
                    { value: "krStock" as const, label: "KR" },
                    { value: "crypto" as const, label: "코인" },
                    { value: "forex" as const, label: "FX" },
                  ] as const).map((option) => (
                    <SegmentButton
                      key={option.value}
                      size="sm"
                      inactiveSurface="card"
                      activeTone="accent"
                      active={compare.market === option.value}
                      onClick={() => setCompare({ market: option.value })}
                    >
                      {option.label}
                    </SegmentButton>
                  ))}
                </div>

                <div className="dashboard-dock__quick-symbols">
                  {compareSuggestions.map((nextSymbol) => (
                    <button
                      key={nextSymbol}
                      type="button"
                      className={`dashboard-dock__quick-symbol ${compare.symbol === nextSymbol ? "is-active" : ""}`}
                      onClick={() => setCompare({ symbol: nextSymbol })}
                    >
                      {nextSymbol}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="default" className="justify-center" onClick={applyCompareOverlay}>
                    비교 적용
                  </Button>
                  <Button variant="secondary" className="justify-center" onClick={() => setCompare({ enabled: false })}>
                    비교 해제
                  </Button>
                </div>
              </DockSection>

              <DockSection title="구성 저장">
                <div className="dashboard-dock__save-meta">
                  마지막 저장: <strong>{formatSavedTime(savedLayoutAt)}</strong>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="default" className="justify-center" onClick={saveCurrentLayout}>
                    현재 구성 저장
                  </Button>
                  <Button variant="secondary" className="justify-center" onClick={restoreSavedLayout}>
                    저장본 적용
                  </Button>
                </div>
              </DockSection>
            </>
          )}
        </ScrollArea>
      ) : null}
    </aside>
  );
}
