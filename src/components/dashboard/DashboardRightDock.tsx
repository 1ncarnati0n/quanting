import { type ReactNode, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import SegmentButton from "../patterns/SegmentButton";
import WatchlistSidebar from "../WatchlistSidebar";
import type { DashboardDockFocusRequest, DashboardDockTab } from "./types";

interface DashboardRightDockProps {
  activeTab: DashboardDockTab;
  embedded?: boolean;
  focusRequest?: DashboardDockFocusRequest | null;
  onClose?: () => void;
  onTabChange: (tab: DashboardDockTab) => void;
}

function DockSection({
  title,
  description,
  children,
  sectionRef,
  highlighted = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  sectionRef?: RefObject<HTMLElement | null>;
  highlighted?: boolean;
}) {
  return (
    <section ref={sectionRef} className={`dashboard-dock__section ${highlighted ? "is-highlighted" : ""}`}>
      <div className="dashboard-dock__section-head">
        <div className="dashboard-dock__section-title">{title}</div>
        {description ? <div className="dashboard-dock__section-description">{description}</div> : null}
      </div>
      <div className="dashboard-dock__section-body">{children}</div>
    </section>
  );
}

export default function DashboardRightDock({
  activeTab,
  onClose,
  onTabChange,
}: DashboardRightDockProps) {
  const headerTitle = activeTab === "watchlist" ? "관심종목" : "분석 패널";
  const headerSubtitle =
    activeTab === "watchlist"
      ? "실시간 종목 흐름과 즐겨찾기를 빠르게 확인합니다."
      : "분석 탭은 비워 두고, 추후 인사이트 모듈이 들어올 수 있게 정리했습니다.";

  return (
    <aside className="dashboard-dock flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="dashboard-dock__header">
        <div className="dashboard-dock__header-copy">
          <div className="dashboard-dock__title">{headerTitle}</div>
          <div className="dashboard-dock__subtitle">{headerSubtitle}</div>
        </div>
        {onClose ? (
          <Button variant="ghost" size="icon" className="dashboard-dock__close" onClick={onClose} aria-label="패널 닫기" title="닫기">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Button>
        ) : null}
      </div>

      <div className="dashboard-dock__mode-tabs">
        <div className="dashboard-dock__tabs-frame grid grid-cols-2">
          <SegmentButton active={activeTab === "watchlist"} activeTone="accent" onClick={() => onTabChange("watchlist")}>
            관심종목
          </SegmentButton>
          <SegmentButton active={activeTab === "indicators"} activeTone="accent" onClick={() => onTabChange("indicators")}>
            분석
          </SegmentButton>
        </div>
      </div>

      {activeTab === "watchlist" ? (
        <div className="dashboard-dock__watchlist-host min-h-0 flex-1">
          <WatchlistSidebar
            embedded
            onSelectSymbol={() => {
              if (onClose) onClose();
            }}
          />
        </div>
      ) : null}

      {activeTab === "indicators" ? (
        <ScrollArea className="min-h-0 flex-1" viewportClassName="h-full pb-4">
          <div className="dashboard-dock__scroll-body">
            <DockSection title="분석" description="이 영역은 추후 분석 카드와 어시스트 패널을 위한 공간입니다.">
              <div className="dashboard-dock__blank-state">
                분석 탭은 현재 비워져 있습니다.
              </div>
            </DockSection>
          </div>
        </ScrollArea>
      ) : null}
    </aside>
  );
}
