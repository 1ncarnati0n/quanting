import { type RefObject } from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/react/shallow";
import { Switch } from "@/components/ui/switch";
import SegmentButton from "../patterns/SegmentButton";
import { useSettingsStore } from "../../stores/useSettingsStore";

interface DashboardGlobalSettingsPanelProps {
  anchorRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  panelRef?: RefObject<HTMLDivElement | null>;
}

function CloseGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function DashboardGlobalSettingsPanel({
  anchorRef: _anchorRef,
  onClose,
  panelRef,
}: DashboardGlobalSettingsPanelProps) {
  const {
    theme,
    chartColorStyle,
    isFullscreen,
    toggleTheme,
    toggleFullscreen,
    setChartColorStyle,
  } = useSettingsStore(
    useShallow((state) => ({
      theme: state.theme,
      chartColorStyle: state.chartColorStyle,
      isFullscreen: state.isFullscreen,
      toggleTheme: state.toggleTheme,
      toggleFullscreen: state.toggleFullscreen,
      setChartColorStyle: state.setChartColorStyle,
    })),
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="global-settings-panel__backdrop"
      role="presentation"
    >
      <div
        ref={panelRef}
        className="global-settings-panel"
        role="dialog"
        aria-modal="false"
        aria-label="전역 설정"
      >
        <div className="global-settings-panel__header">
          <div className="global-settings-panel__header-copy">
            <h3 className="global-settings-panel__title">전역 설정</h3>
            <p className="global-settings-panel__description">앱 전체에 적용되는 화면/작업 환경 설정을 조정합니다.</p>
          </div>
          <button
            type="button"
            className="global-settings-panel__icon-button"
            onClick={onClose}
            aria-label="전역 설정 패널 닫기"
          >
            <CloseGlyph />
          </button>
        </div>

        <div className="global-settings-panel__body">
          <section className="global-settings-panel__section">
            <div className="global-settings-panel__section-head">
              <div className="global-settings-panel__section-title">앱 테마</div>
              <div className="global-settings-panel__section-note">인터페이스 전체의 밝은 모드와 어두운 모드를 전환합니다.</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SegmentButton
                inactiveSurface="card"
                active={theme === "light"}
                activeTone="accent"
                onClick={() => {
                  if (theme !== "light") toggleTheme();
                }}
              >
                라이트
              </SegmentButton>
              <SegmentButton
                inactiveSurface="card"
                active={theme === "dark"}
                activeTone="accent"
                onClick={() => {
                  if (theme !== "dark") toggleTheme();
                }}
              >
                다크
              </SegmentButton>
            </div>
          </section>

          <section className="global-settings-panel__section">
            <div className="global-settings-panel__section-head">
              <div className="global-settings-panel__section-title">등락 색상 기준</div>
              <div className="global-settings-panel__section-note">상승/하락 봉과 등락 수치의 색상 기준을 바꿉니다.</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SegmentButton
                inactiveSurface="card"
                active={chartColorStyle === "international"}
                activeTone="accent"
                onClick={() => setChartColorStyle("international")}
              >
                해외식
              </SegmentButton>
              <SegmentButton
                inactiveSurface="card"
                active={chartColorStyle === "korean"}
                activeTone="accent"
                onClick={() => setChartColorStyle("korean")}
              >
                한국식
              </SegmentButton>
            </div>
          </section>

          <section className="global-settings-panel__section">
            <div className="global-settings-panel__switch-row">
              <div>
                <div className="global-settings-panel__switch-title">전체 화면</div>
                <div className="global-settings-panel__switch-note">메인 작업 영역만 남기고 차트에 집중합니다.</div>
              </div>
              <Switch checked={isFullscreen} onCheckedChange={() => toggleFullscreen()} />
            </div>
          </section>

          <section className="global-settings-panel__section">
            <button
              type="button"
              className="global-settings-panel__action"
              onClick={() => window.dispatchEvent(new CustomEvent("quanting:show-shortcuts"))}
            >
              단축키 안내 보기
            </button>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
