import { useStrategyStore, type StrategyBSubTab } from "@/stores/useStrategyStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MACDBBStrategy from "./MACDBBStrategy";
import PairTradingPanel from "./PairTradingPanel";

export default function StrategyBPanel() {
  const subTab = useStrategyStore((s) => s.strategyBSubTab);
  const setSubTab = useStrategyStore((s) => s.setStrategyBSubTab);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="ds-type-title font-bold text-[var(--foreground)]">
          Strategy B — 액티브 트레이딩
        </h2>
        <p className="ds-type-caption text-[var(--muted-foreground)] mt-1">
          기술적 지표 기반 매매 신호 포착
        </p>
      </div>

      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as StrategyBSubTab)}>
        <TabsList>
          <TabsTrigger value="macdbb">MACD + BB</TabsTrigger>
          <TabsTrigger value="pair">페어 트레이딩</TabsTrigger>
        </TabsList>
        <TabsContent value="macdbb" className="mt-4">
          <MACDBBStrategy />
        </TabsContent>
        <TabsContent value="pair" className="mt-4">
          <PairTradingPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
