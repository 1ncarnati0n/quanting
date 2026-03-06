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
    <div className="border-b border-[var(--border)] px-5 py-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="ds-type-caption font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
            Strategy Modules
          </div>
          <div className="mt-1 ds-type-title font-semibold text-[var(--foreground)]">
            Research Tracks
          </div>
        </div>
        <span className="ds-type-caption rounded-full border border-[var(--border)] bg-[var(--muted)] px-2.5 py-1 text-[var(--muted-foreground)]">
          Live Context
        </span>
      </div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StrategyTab)}>
        <TabsList className="grid w-full grid-cols-3 gap-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--muted)] p-1">
          {STRATEGY_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              title={tab.desc}
              className="h-auto min-h-[56px] flex-col items-start justify-center gap-1 rounded-[var(--radius-sm)] border px-3 py-2 text-left"
            >
              <span className="ds-type-label font-semibold leading-none">{tab.label}</span>
              <span className="ds-type-caption text-[var(--muted-foreground)]">{tab.desc}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
