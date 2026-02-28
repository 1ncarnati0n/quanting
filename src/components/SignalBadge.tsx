import type { SignalType } from "../types";
import { COLORS } from "../utils/constants";

const SIGNAL_CONFIG: Record<
  SignalType,
  { label: string; color: string }
> = {
  strongBuy: { label: "Strong Buy", color: COLORS.strongBuy },
  weakBuy: { label: "Weak Buy", color: COLORS.weakBuy },
  strongSell: { label: "Strong Sell", color: COLORS.strongSell },
  weakSell: { label: "Weak Sell", color: COLORS.weakSell },
};

interface SignalBadgeProps {
  signalType: SignalType;
}

export default function SignalBadge({ signalType }: SignalBadgeProps) {
  const config = SIGNAL_CONFIG[signalType];

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{
        background: `${config.color}22`,
        color: config.color,
        border: `1px solid ${config.color}44`,
      }}
    >
      {config.label}
    </span>
  );
}
