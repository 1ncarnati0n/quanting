import { useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/react/shallow";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import SegmentButton from "../patterns/SegmentButton";
import { useSettingsStore } from "../../stores/useSettingsStore";

interface ChartDisplaySettingsPanelProps {
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

export default function ChartDisplaySettingsPanel({
  anchorRef,
  onClose,
  panelRef,
}: ChartDisplaySettingsPanelProps) {
  const {
    chartColorStyle,
    priceScale,
    indicators,
    setChartColorStyle,
    setPriceScale,
    setIndicator,
  } = useSettingsStore(
    useShallow((state) => ({
      chartColorStyle: state.chartColorStyle,
      priceScale: state.priceScale,
      indicators: state.indicators,
      setChartColorStyle: state.setChartColorStyle,
      setPriceScale: state.setPriceScale,
      setIndicator: state.setIndicator,
    })),
  );

  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor || typeof window === "undefined") return;

      const rect = anchor.getBoundingClientRect();
      const gap = 10;
      const viewportPadding = 16;
      const preferredWidth = Math.min(368, window.innerWidth - viewportPadding * 2);
      const nextLeft = Math.min(
        Math.max(viewportPadding, rect.right - preferredWidth),
        Math.max(viewportPadding, window.innerWidth - preferredWidth - viewportPadding),
      );
      const nextTop = rect.bottom + gap;
      const nextHeight = Math.max(320, Math.min(620, window.innerHeight - nextTop - viewportPadding));

      setPanelStyle({
        top: nextTop,
        left: nextLeft,
        height: nextHeight,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef]);

  if (typeof document === "undefined" || panelStyle === null) {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      className="chart-display-panel"
      role="dialog"
      aria-modal="false"
      aria-label="차트 설정"
      style={{
        top: panelStyle.top,
        left: panelStyle.left,
        height: panelStyle.height,
      }}
    >
      <div className="chart-display-panel__header">
        <div className="chart-display-panel__header-copy">
          <h3 className="chart-display-panel__title">차트 설정</h3>
          <p className="chart-display-panel__description">가격 영역 높이와 메인 차트 가격축 동작을 빠르게 조정합니다.</p>
        </div>
        <button
          type="button"
          className="chart-display-panel__icon-button"
          onClick={onClose}
          aria-label="차트 설정 패널 닫기"
        >
          <CloseGlyph />
        </button>
      </div>

      <div className="chart-display-panel__body">
        <section className="chart-display-panel__section">
          <div className="chart-display-panel__section-head">
            <div className="chart-display-panel__section-title">등락 색상</div>
            <div className="chart-display-panel__section-note">상승/하락 봉과 등락 텍스트 색상을 기준에 맞게 바꿉니다.</div>
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

        <section className="chart-display-panel__section">
          <div className="chart-display-panel__section-head">
            <div className="chart-display-panel__section-title">차트 레이아웃</div>
            <div className="chart-display-panel__section-note">1분할 기준으로 메인 가격 영역의 비중만 조정합니다.</div>
          </div>

          <div className="chart-display-panel__metric-row">
            <span className="chart-display-panel__metric-label">가격 영역 높이</span>
            <span className="chart-display-panel__metric-value">{Math.round(indicators.layout.priceAreaRatio * 100)}%</span>
          </div>
          <Slider
            min={0.35}
            max={0.85}
            step={0.01}
            value={[indicators.layout.priceAreaRatio]}
            onValueChange={(next) => setIndicator("layout", { priceAreaRatio: next[0] ?? indicators.layout.priceAreaRatio })}
            aria-label="가격 영역 높이"
          />
        </section>

        <section className="chart-display-panel__section">
          <div className="chart-display-panel__section-head">
            <div className="chart-display-panel__section-title">가격 축</div>
            <div className="chart-display-panel__section-note">가격 스케일 모드와 자동 축 조정을 제어합니다.</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SegmentButton inactiveSurface="card" active={priceScale.mode === "normal"} activeTone="accent" onClick={() => setPriceScale({ mode: "normal" })}>
              기본 축
            </SegmentButton>
            <SegmentButton
              inactiveSurface="card"
              active={priceScale.mode === "logarithmic"}
              activeTone="accent"
              onClick={() => setPriceScale({ mode: "logarithmic" })}
            >
              로그 축
            </SegmentButton>
          </div>

          <div className="chart-display-panel__switch-row">
            <div>
              <div className="chart-display-panel__switch-title">자동 스케일</div>
              <div className="chart-display-panel__switch-note">가격 변동에 맞춰 축 범위를 자동으로 조정합니다.</div>
            </div>
            <Switch checked={priceScale.autoScale} onCheckedChange={(checked) => setPriceScale({ autoScale: checked })} />
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
}
