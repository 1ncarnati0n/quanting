import type { PremarketStock } from "@/stores/useStrategyStore";
import StatePanel from "@/components/patterns/StatePanel";

interface PremarketScreenerProps {
  stocks: PremarketStock[];
}

export default function PremarketScreener({ stocks }: PremarketScreenerProps) {
  if (stocks.length === 0) {
    return (
      <StatePanel
        variant="empty"
        size="compact"
        title="조건에 맞는 종목이 없습니다"
        description="RVOL/변동률 기준을 조정해 보세요."
        className="h-20 border-dashed bg-transparent flex items-center justify-center"
      />
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-[var(--secondary)] ds-type-caption text-[var(--muted-foreground)]">
            <th className="px-3 py-1.5 text-left font-semibold">종목</th>
            <th className="px-3 py-1.5 text-right font-semibold">프리마켓 가격</th>
            <th className="px-3 py-1.5 text-right font-semibold">변동률</th>
            <th className="px-3 py-1.5 text-right font-semibold">RVOL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {stocks.map((stock) => (
            <tr key={stock.symbol} className="hover:bg-[var(--secondary)]">
              <td className="px-3 py-1.5 font-mono ds-type-label font-semibold text-[var(--foreground)]">
                {stock.symbol}
              </td>
              <td className="px-3 py-1.5 text-right font-mono ds-type-label text-[var(--foreground)]">
                ${stock.prePrice.toFixed(2)}
              </td>
              <td
                className="px-3 py-1.5 text-right font-mono ds-type-label font-semibold"
                style={{
                  color: stock.preChange >= 0 ? "var(--success)" : "var(--destructive)",
                }}
              >
                {stock.preChange >= 0 ? "+" : ""}{stock.preChange.toFixed(1)}%
              </td>
              <td className="px-3 py-1.5 text-right font-mono ds-type-label text-[var(--primary)]">
                {stock.rVol.toFixed(1)}x
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
