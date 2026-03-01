import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStrategyStore, type StrategyTab } from "@/stores/useStrategyStore";

const STRATEGY_TABS: { value: StrategyTab; label: string; desc: string }[] = [
  { value: "A", label: "A 월간 포트폴리오", desc: "GEM + TAA + Sector" },
  { value: "B", label: "B 액티브 트레이딩", desc: "MACD·BB + Pair" },
  { value: "ORB", label: "ORB 시가돌파", desc: "Opening Range Breakout" },
];

export default function StrategyPanelHeader() {
  const activeTab = useStrategyStore((s) => s.activeTab);
  const setActiveTab = useStrategyStore((s) => s.setActiveTab);

  return (
    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2">
      <span className="ds-type-caption font-semibold text-[var(--muted-foreground)]">
        전략
      </span>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StrategyTab)}>
        <TabsList>
          {STRATEGY_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} title={tab.desc}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
