import type { SignalType } from "../types";
import { COLORS } from "../utils/constants";
import { Badge } from "@/components/ui/badge";

const SIGNAL_CONFIG: Record<
  SignalType,
  { label: string; color: string }
> = {
  strongBuy: { label: "강", color: COLORS.strongBuy },
  weakBuy: { label: "약", color: COLORS.weakBuy },
  strongSell: { label: "강", color: COLORS.strongSell },
  weakSell: { label: "약", color: COLORS.weakSell },
  macdBullish: { label: "MACD 상승", color: COLORS.macdBullish },
  macdBearish: { label: "MACD 하락", color: COLORS.macdBearish },
  stochOversold: { label: "스토캐스틱 과매도", color: COLORS.stochOversold },
  stochOverbought: { label: "스토캐스틱 과매수", color: COLORS.stochOverbought },
  supertrendBuy: { label: "ST 매수", color: COLORS.supertrendBuy },
  supertrendSell: { label: "ST 매도", color: COLORS.supertrendSell },
  emaCrossoverBuy: { label: "EMA 매수", color: COLORS.emaCrossoverBuy },
  emaCrossoverSell: { label: "EMA 매도", color: COLORS.emaCrossoverSell },
  stochRsiBuy: { label: "S+R 매수", color: COLORS.stochRsiBuy },
  stochRsiSell: { label: "S+R 매도", color: COLORS.stochRsiSell },
  cmfObvBuy: { label: "CMF 매수", color: COLORS.cmfObvBuy },
  cmfObvSell: { label: "CMF 매도", color: COLORS.cmfObvSell },
  ttmSqueezeBuy: { label: "TTM 매수", color: COLORS.ttmSqueezeBuy },
  ttmSqueezeSell: { label: "TTM 매도", color: COLORS.ttmSqueezeSell },
  vwapBreakoutBuy: { label: "VWAP 매수", color: COLORS.vwapBreakoutBuy },
  vwapBreakoutSell: { label: "VWAP 매도", color: COLORS.vwapBreakoutSell },
  parabolicSarBuy: { label: "SAR 매수", color: COLORS.parabolicSarBuy },
  parabolicSarSell: { label: "SAR 매도", color: COLORS.parabolicSarSell },
  macdHistReversalBuy: { label: "MH 매수", color: COLORS.macdHistReversalBuy },
  macdHistReversalSell: { label: "MH 매도", color: COLORS.macdHistReversalSell },
  ibsMeanRevBuy: { label: "IBS 매수", color: COLORS.ibsMeanRevBuy },
  ibsMeanRevSell: { label: "IBS 매도", color: COLORS.ibsMeanRevSell },
  rsiDivergenceBuy: { label: "DIV 매수", color: COLORS.rsiDivergenceBuy },
  rsiDivergenceSell: { label: "DIV 매도", color: COLORS.rsiDivergenceSell },
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
    <Badge
      variant="outline"
      className="ds-type-label font-semibold"
      style={{
        background: `${config.color}22`,
        color: config.color,
        border: `1px solid ${config.color}44`,
      }}
    >
      {label}
    </Badge>
  );
}
