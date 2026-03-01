import { useMemo } from "react";
import { useChartStore } from "../stores/useChartStore";
import { useReplayStore } from "../stores/useReplayStore";

const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;

function formatReplayTime(unixTime: number | null): string {
  if (!unixTime) return "-";
  try {
    return new Date(unixTime * 1000).toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export default function ReplayControls() {
  const data = useChartStore((s) => s.data);
  const {
    enabled,
    playing,
    speed,
    currentIndex,
    enterReplay,
    exitReplay,
    togglePlaying,
    setSpeed,
    setCurrentIndex,
    step,
  } = useReplayStore();

  const totalBars = data?.candles.length ?? 0;
  const cappedIndex = Math.min(Math.max(currentIndex, 0), Math.max(0, totalBars - 1));

  const replayTime = useMemo(() => {
    if (!enabled || !data || totalBars === 0) return null;
    return data.candles[cappedIndex]?.time ?? null;
  }, [cappedIndex, data, enabled, totalBars]);

  if (!data || totalBars < 2) return null;

  const progress = totalBars > 1 ? ((cappedIndex + 1) / totalBars) * 100 : 0;

  return (
    <div
      className="pointer-events-auto absolute bottom-2 left-2 z-[11] rounded-sm border px-2 py-1.5"
      style={{
        background: "color-mix(in srgb, var(--background) 88%, transparent)",
        borderColor: "var(--border)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <button
          type="button"
          className="ds-type-caption rounded px-1.5 py-0.5 font-semibold"
          style={{
            background: enabled ? "rgba(239,68,68,0.16)" : "var(--accent)",
            color: enabled ? "#fca5a5" : "var(--primary)",
            border: "1px solid var(--border)",
          }}
          onClick={() => {
            if (enabled) {
              exitReplay();
            } else {
              enterReplay(totalBars);
            }
          }}
        >
          {enabled ? "리플레이 종료" : "바 리플레이"}
        </button>

        {enabled && (
          <>
            <button
              type="button"
              className="ds-type-caption rounded px-1.5 py-0.5"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
              onClick={() => step(-1, totalBars)}
              title="이전 바"
            >
              ◀
            </button>
            <button
              type="button"
              className="ds-type-caption rounded px-1.5 py-0.5"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
              onClick={togglePlaying}
              title={playing ? "일시정지" : "재생"}
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <button
              type="button"
              className="ds-type-caption rounded px-1.5 py-0.5"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
              onClick={() => step(1, totalBars)}
              title="다음 바"
            >
              ▶
            </button>
          </>
        )}
      </div>

      {enabled && (
        <>
          <div className="mb-1 flex items-center gap-1.5">
            <input
              type="range"
              min={0}
              max={Math.max(0, totalBars - 1)}
              step={1}
              value={cappedIndex}
              onChange={(e) => setCurrentIndex(Number(e.target.value), totalBars)}
              className="w-44"
              aria-label="리플레이 진행"
              style={{ accentColor: "var(--primary)" }}
            />
            <span className="ds-type-caption font-mono" style={{ color: "var(--muted-foreground)" }}>
              {progress.toFixed(0)}%
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="ds-type-caption font-mono" style={{ color: "var(--muted-foreground)" }}>
              {cappedIndex + 1}/{totalBars} · {formatReplayTime(replayTime)}
            </span>
            <div className="flex items-center gap-1">
              {SPEED_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="ds-type-caption rounded px-1 py-0.5"
                  style={{
                    background: speed === option ? "var(--accent)" : "transparent",
                    color: speed === option ? "var(--primary)" : "var(--muted-foreground)",
                    border: "1px solid var(--border)",
                  }}
                  onClick={() => setSpeed(option)}
                >
                  {option}x
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
