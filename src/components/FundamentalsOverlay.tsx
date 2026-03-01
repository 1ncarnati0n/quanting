import { useEffect } from "react";
import { useChartStore } from "../stores/useChartStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import type { FundamentalsResponse, MarketType } from "../types";
import { formatPrice } from "../utils/formatters";

function formatCompact(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRatio(value: number | null, digits = 2): string {
  if (value === null || !Number.isFinite(value)) return "-";
  return value.toFixed(digits);
}

function formatPercent(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return "-";
  return `${(value * 100).toFixed(digits)}%`;
}

function rangeLabel(data: FundamentalsResponse | null, market: MarketType): string {
  if (!data || data.fiftyTwoWeekLow === null || data.fiftyTwoWeekHigh === null) return "-";
  return `${formatPrice(data.fiftyTwoWeekLow, market)} ~ ${formatPrice(data.fiftyTwoWeekHigh, market)}`;
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-sm border px-2 py-1.5"
      style={{
        borderColor: "var(--border)",
        background: "color-mix(in srgb, var(--secondary) 74%, transparent)",
      }}
    >
      <div className="ds-type-caption uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </div>
      <div className="ds-type-label mt-0.5 font-mono font-semibold" style={{ color: "var(--foreground)" }}>
        {value}
      </div>
    </div>
  );
}

export default function FundamentalsOverlay() {
  const symbol = useSettingsStore((s) => s.symbol);
  const market = useSettingsStore((s) => s.market);
  const enabled = useSettingsStore((s) => s.indicators.fundamentals.enabled);
  const {
    fundamentals,
    fundamentalsLoading,
    fundamentalsError,
    fetchFundamentals,
  } = useChartStore();

  useEffect(() => {
    if (!enabled) return;
    void fetchFundamentals({ symbol, market });
  }, [enabled, fetchFundamentals, market, symbol]);

  if (!enabled) return null;

  const hasCurrentData =
    fundamentals &&
    fundamentals.symbol === symbol &&
    fundamentals.market === market;
  const currentData = hasCurrentData ? fundamentals : null;

  return (
    <section
      className="pointer-events-auto absolute right-3 top-11 z-[11] w-[min(22rem,calc(100%-1.5rem))] rounded border p-2.5"
      style={{
        borderColor: "var(--border)",
        background: "color-mix(in srgb, var(--background) 90%, transparent)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="ds-type-label truncate font-semibold" style={{ color: "var(--foreground)" }}>
            {currentData?.shortName || symbol}
          </div>
          <div className="ds-type-caption font-mono" style={{ color: "var(--muted-foreground)" }}>
            {symbol}
            {currentData?.currency ? ` · ${currentData.currency}` : ""}
          </div>
        </div>
        <span
          className="ds-type-caption rounded px-1.5 py-0.5 font-semibold"
          style={{
            background: "var(--accent)",
            color: "var(--primary)",
          }}
        >
          재무
        </span>
      </div>

      {market === "crypto" && (
        <div className="ds-type-caption rounded border px-2 py-2" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          암호화폐 심볼은 재무 지표를 제공하지 않습니다.
        </div>
      )}

      {market !== "crypto" && fundamentalsLoading && !currentData && (
        <div className="ds-type-caption rounded border px-2 py-2" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          재무 데이터 조회 중...
        </div>
      )}

      {market !== "crypto" && !fundamentalsLoading && fundamentalsError && !currentData && (
        <div className="ds-type-caption rounded border px-2 py-2" style={{ borderColor: "var(--border)", color: "var(--destructive)" }}>
          {fundamentalsError}
        </div>
      )}

      {market !== "crypto" && currentData && (
        <div className="grid grid-cols-2 gap-1.5">
          <Metric label="시가총액" value={formatCompact(currentData.marketCap)} />
          <Metric label="평균거래량" value={formatCompact(currentData.averageVolume)} />
          <Metric label="PER(TTM)" value={formatRatio(currentData.trailingPe)} />
          <Metric label="PBR" value={formatRatio(currentData.priceToBook)} />
          <Metric label="배당수익률" value={formatPercent(currentData.dividendYield)} />
          <Metric label="ROE" value={formatPercent(currentData.returnOnEquity)} />
          <Metric label="매출성장률" value={formatPercent(currentData.revenueGrowth)} />
          <Metric label="영업이익률" value={formatPercent(currentData.operatingMargins)} />
          <Metric label="순이익률" value={formatPercent(currentData.profitMargins)} />
          <Metric label="EPS(TTM)" value={formatRatio(currentData.trailingEps, 3)} />
          <Metric label="52주 범위" value={rangeLabel(currentData, market)} />
          <Metric label="D/E" value={formatRatio(currentData.debtToEquity)} />
        </div>
      )}
    </section>
  );
}
