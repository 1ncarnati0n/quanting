import { useCrosshairStore } from "../stores/useCrosshairStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { formatPrice } from "../utils/formatters";
import { COLORS } from "../utils/constants";

const CHART_TYPE_LABELS: Record<string, string> = {
  candlestick: "캔들스틱",
  heikinAshi: "하이킨 아시",
  line: "라인",
  area: "영역",
  bar: "바",
};

export default function CrosshairLegend() {
  const { open, high, low, close, volume, indicators } = useCrosshairStore();
  const { symbol, chartType, market } = useSettingsStore();

  const hasData = open !== 0 || high !== 0 || low !== 0 || close !== 0;
  const changeColor = close >= open ? COLORS.candleUp : COLORS.candleDown;
  const isLineType = chartType === "line" || chartType === "area";

  const compactFormat = (v: number) =>
    new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 2 }).format(v);

  return (
    <div
      className="pointer-events-none absolute left-3 top-2 z-10 flex flex-col gap-0.5 rounded px-2 py-1"
      style={{
        background: "color-mix(in srgb, var(--background) 80%, transparent)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="flex items-center gap-2 text-[10px]">
        <span className="font-semibold" style={{ color: "var(--primary)" }}>
          {symbol}
        </span>
        <span style={{ color: "var(--muted-foreground)" }}>
          {CHART_TYPE_LABELS[chartType] ?? chartType}
        </span>
      </div>

      {hasData && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0 font-mono text-[10px]">
          {!isLineType && (
            <>
              <span style={{ color: "var(--muted-foreground)" }}>O</span>
              <span style={{ color: changeColor }}>{formatPrice(open, market)}</span>
              <span style={{ color: "var(--muted-foreground)" }}>H</span>
              <span style={{ color: changeColor }}>{formatPrice(high, market)}</span>
              <span style={{ color: "var(--muted-foreground)" }}>L</span>
              <span style={{ color: changeColor }}>{formatPrice(low, market)}</span>
            </>
          )}
          <span style={{ color: "var(--muted-foreground)" }}>C</span>
          <span style={{ color: changeColor }}>{formatPrice(close, market)}</span>
          {volume > 0 && (
            <>
              <span style={{ color: "var(--muted-foreground)" }}>V</span>
              <span style={{ color: "var(--foreground)" }}>{compactFormat(volume)}</span>
            </>
          )}
        </div>
      )}

      {Object.keys(indicators).length > 0 && (
        <div className="flex flex-wrap gap-x-2 text-[9px]" style={{ color: "var(--muted-foreground)" }}>
          {Object.entries(indicators).map(([key, val]) => (
            <span key={key}>
              <span className="font-medium uppercase">{key.replace(/-\d+$/, "").replace("-line", "")}</span>{" "}
              <span className="font-mono" style={{ color: "var(--foreground)" }}>{val}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
