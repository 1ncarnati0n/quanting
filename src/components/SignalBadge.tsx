import type { SignalType } from "../types";
import { COLORS } from "../utils/constants";

const SIGNAL_CONFIG: Record<
  SignalType,
  { label: string; color: string }
> = {
  strongBuy: { label: "강매수", color: COLORS.strongBuy },
  weakBuy: { label: "약매수", color: COLORS.weakBuy },
  strongSell: { label: "강매도", color: COLORS.strongSell },
  weakSell: { label: "약매도", color: COLORS.weakSell },
  macdBullish: { label: "MACD 상승", color: COLORS.macdBullish },
  macdBearish: { label: "MACD 하락", color: COLORS.macdBearish },
  stochOversold: { label: "스토캐스틱 과매도", color: COLORS.stochOversold },
  stochOverbought: { label: "스토캐스틱 과매수", color: COLORS.stochOverbought },
};

interface SignalBadgeProps {
  signalType: SignalType;
  source?: string;
}

export default function SignalBadge({ signalType, source }: SignalBadgeProps) {
  const config = SIGNAL_CONFIG[signalType];
  if (!config) return null;

  const label = source && source !== "bb_rsi"
    ? `${source.toUpperCase()} ${config.label}`
    : config.label;

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{
        background: `${config.color}22`,
        color: config.color,
        border: `1px solid ${config.color}44`,
      }}
    >
      {label}
    </span>
  );
}
