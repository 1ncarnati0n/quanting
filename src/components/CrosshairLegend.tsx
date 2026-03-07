import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useChartStore } from "../stores/useChartStore";
import { useCrosshairStore } from "../stores/useCrosshairStore";
import { useSettingsStore, type IndicatorConfig } from "../stores/useSettingsStore";
import { COLORS, MA_COLORS } from "../utils/constants";
import { formatPrice } from "../utils/formatters";
import type { AnalysisResponse, MarketType } from "../types";

type OverlayToken = {
  text: string;
  color?: string;
};

type OverlayRow = {
  key: string;
  label: string;
  tokens: OverlayToken[];
};

function EyeOffGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
      <path d="M9.36 5.37A10.94 10.94 0 0 1 12 5c5 0 9.27 3.11 11 7-1 2.22-2.74 4.07-4.91 5.25" />
      <path d="M6.23 6.23C4.19 7.43 2.58 9.15 1.5 12c.64 1.48 1.59 2.85 2.79 4" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function ChevronGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      style={{ transform: collapsed ? "rotate(180deg)" : undefined }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function formatParam(value: number) {
  if (Number.isInteger(value)) {
    return `${value}`;
  }
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(value);
}

function buildOverlayRows(
  indicators: IndicatorConfig,
  chartData: AnalysisResponse | null,
  market: MarketType,
): OverlayRow[] {
  const rows: OverlayRow[] = [];
  const movingAverageTokens: OverlayToken[] = [];
  let colorCursor = 0;

  if (indicators.sma.enabled) {
    (chartData?.sma ?? []).forEach((ma) => {
      const latestPoint = ma.data[ma.data.length - 1];
      if (!latestPoint) return;
      movingAverageTokens.push({
        text: `${ma.period} ${formatPrice(latestPoint.value, market)}`,
        color: MA_COLORS[colorCursor % MA_COLORS.length],
      });
      colorCursor += 1;
    });
  }

  if (indicators.ema.enabled) {
    (chartData?.ema ?? []).forEach((ma) => {
      const latestPoint = ma.data[ma.data.length - 1];
      if (!latestPoint) return;
      movingAverageTokens.push({
        text: `${ma.period} ${formatPrice(latestPoint.value, market)}`,
        color: MA_COLORS[colorCursor % MA_COLORS.length],
      });
      colorCursor += 1;
    });
  }

  if (indicators.hma.enabled) {
    (chartData?.hma ?? []).forEach((ma) => {
      const latestPoint = ma.data[ma.data.length - 1];
      if (!latestPoint) return;
      movingAverageTokens.push({
        text: `${ma.period} ${formatPrice(latestPoint.value, market)}`,
        color: MA_COLORS[colorCursor % MA_COLORS.length],
      });
      colorCursor += 1;
    });
  }

  if (movingAverageTokens.length > 0) {
    rows.push({
      key: "moving-average",
      label: "이동평균선",
      tokens: movingAverageTokens,
    });
  }

  if (indicators.bb.enabled) {
    const bollingerBands = chartData?.bollingerBands ?? [];
    const latestBand = bollingerBands[bollingerBands.length - 1];
    rows.push({
      key: "bollinger",
      label: "볼린저 밴드",
      tokens: latestBand
        ? [
            { text: "중심선", color: COLORS.bbMiddle },
            { text: formatPrice(latestBand.middle, market) },
            { text: "상한선", color: COLORS.bbUpper },
            { text: formatPrice(latestBand.upper, market) },
            { text: "하한선", color: COLORS.bbLower },
            { text: formatPrice(latestBand.lower, market) },
          ]
        : [
            { text: formatParam(indicators.bb.period), color: COLORS.bbMiddle },
            { text: formatParam(indicators.bb.multiplier), color: COLORS.bbUpper },
          ],
    });
  }

  if (indicators.vwap.enabled) {
    rows.push({
      key: "vwap",
      label: "VWAP",
      tokens: [{ text: "기본", color: "#14B8A6" }],
    });
  }

  if (indicators.donchian.enabled) {
    rows.push({
      key: "donchian",
      label: "돈치안 채널",
      tokens: [
        { text: formatParam(indicators.donchian.period), color: COLORS.donchianMiddle },
      ],
    });
  }

  if (indicators.keltner.enabled) {
    rows.push({
      key: "keltner",
      label: "켈트너 채널",
      tokens: [
        { text: formatParam(indicators.keltner.emaPeriod), color: COLORS.keltnerMiddle },
        { text: formatParam(indicators.keltner.atrMultiplier), color: COLORS.keltnerUpper },
      ],
    });
  }

  if (indicators.supertrend.enabled) {
    rows.push({
      key: "supertrend",
      label: "슈퍼트렌드",
      tokens: [{ text: "ON", color: "#22C55E" }],
    });
  }

  if (indicators.psar.enabled) {
    rows.push({
      key: "psar",
      label: "PSAR",
      tokens: [{ text: "ON", color: "#F97316" }],
    });
  }

  return rows;
}

export default function CrosshairLegend() {
  const [collapsed, setCollapsed] = useState(false);
  const { time, open, high, low, close } = useCrosshairStore(
    useShallow((state) => ({
      time: state.time,
      open: state.open,
      high: state.high,
      low: state.low,
      close: state.close,
    })),
  );
  const data = useChartStore((state) => state.data);
  const { market, indicators } = useSettingsStore(
    useShallow((state) => ({
      market: state.market,
      indicators: state.indicators,
    })),
  );
  const candleContext = useMemo(() => {
    const candles = data?.candles ?? [];
    if (candles.length === 0) return null;

    let candleIndex = candles.length - 1;
    if (time !== null) {
      const foundIndex = candles.findIndex((item) => item.time === time);
      if (foundIndex >= 0) {
        candleIndex = foundIndex;
      }
    }

    const sourceCandle = candles[candleIndex] ?? candles[candles.length - 1];
    if (!sourceCandle) return null;

    const displayCandle =
      time !== null && (open !== 0 || high !== 0 || low !== 0 || close !== 0)
        ? { open, high, low, close }
        : {
            open: sourceCandle.open,
            high: sourceCandle.high,
            low: sourceCandle.low,
            close: sourceCandle.close,
          };

    const previousClose = candleIndex > 0 ? candles[candleIndex - 1]?.close ?? sourceCandle.open : sourceCandle.open;

    return {
      candle: displayCandle,
      previousClose,
    };
  }, [close, data?.candles, high, low, open, time]);
  const overlayRows = useMemo(() => buildOverlayRows(indicators, data, market), [data, indicators, market]);

  const ohlcMetrics = useMemo(() => {
    if (!candleContext) return [];
    const previousClose = candleContext.previousClose || candleContext.candle.close;
    const toMetric = (label: string, value: number) => {
      const deltaPct = previousClose !== 0 ? ((value - previousClose) / previousClose) * 100 : 0;
      return {
        label,
        value: formatPrice(value, market),
        delta: `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(2)}%`,
        color: deltaPct >= 0 ? COLORS.candleUp : COLORS.candleDown,
      };
    };

    return [
      toMetric("시작", candleContext.candle.open),
      toMetric("고가", candleContext.candle.high),
      toMetric("저가", candleContext.candle.low),
      toMetric("종가", candleContext.candle.close),
    ];
  }, [candleContext, market]);

  return (
    <div className="chart-crosshair-legend absolute left-4 top-3 z-10">
      {ohlcMetrics.length > 0 ? (
        <div className="chart-crosshair-legend__ohlc">
          {ohlcMetrics.map((metric) => (
            <span key={metric.label} className="chart-crosshair-legend__metric">
              <span className="chart-crosshair-legend__label">{metric.label}</span>
              <span className="chart-crosshair-legend__value">{metric.value}</span>
              <span className="chart-crosshair-legend__change" style={{ color: metric.color }}>
                ({metric.delta})
              </span>
            </span>
          ))}
        </div>
      ) : null}

      {!collapsed && overlayRows.length > 0 ? (
        <div className="chart-crosshair-legend__rows" aria-hidden="true">
          {overlayRows.map((row) => (
            <div key={row.key} className="chart-crosshair-legend__row">
              <span className="chart-crosshair-legend__row-controls">
                <span className="chart-crosshair-legend__control-chip">
                  <EyeOffGlyph />
                </span>
                <span className="chart-crosshair-legend__control-chip">
                  <CloseGlyph />
                </span>
              </span>
              <span className="chart-crosshair-legend__row-label">{row.label}</span>
              <span className="chart-crosshair-legend__row-values">
                {row.tokens.map((token, index) => (
                  <span
                    key={`${row.key}-${index}-${token.text}`}
                    className="chart-crosshair-legend__token"
                    style={token.color ? { color: token.color } : undefined}
                  >
                    {token.text}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {overlayRows.length > 0 ? (
        <button
          type="button"
          className="chart-crosshair-legend__collapse"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? "지표 범례 펼치기" : "지표 범례 접기"}
          title={collapsed ? "지표 범례 펼치기" : "지표 범례 접기"}
        >
          <ChevronGlyph collapsed={collapsed} />
        </button>
      ) : null}
    </div>
  );
}
