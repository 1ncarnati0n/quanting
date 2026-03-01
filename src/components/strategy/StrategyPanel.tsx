import { useStrategyStore } from "@/stores/useStrategyStore";
import StrategyPanelHeader from "./StrategyPanelHeader";
import StrategyAPanel from "./strategyA/StrategyAPanel";
import StrategyBPanel from "./strategyB/StrategyBPanel";
import StrategyORBPanel from "./strategyORB/StrategyORBPanel";

export default function StrategyPanel() {
  const activeTab = useStrategyStore((s) => s.activeTab);

  return (
    <div className="flex h-full flex-col">
      <StrategyPanelHeader />
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === "A" && <StrategyAPanel />}
        {activeTab === "B" && <StrategyBPanel />}
        {activeTab === "ORB" && <StrategyORBPanel />}
      </div>
    </div>
  );
}
