import { useMemo } from "react";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useReplayStore } from "../stores/useReplayStore";
import type { AnalysisResponse } from "../types";

interface VolumeProfileOverlayProps {
  data: AnalysisResponse | null;
}

interface VolumeBin {
  index: number;
  volume: number;
}

export default function VolumeProfileOverlay({ data }: VolumeProfileOverlayProps) {
  const enabled = useSettingsStore((s) => s.indicators.volumeProfile.enabled);
  const bins = useSettingsStore((s) => s.indicators.volumeProfile.bins);
  const replayEnabled = useReplayStore((s) => s.enabled);
  const replayIndex = useReplayStore((s) => s.currentIndex);

  const profile = useMemo(() => {
    if (!enabled || !data || data.candles.length < 12) {
      return { bins: [] as VolumeBin[], maxVolume: 0 };
    }

    const cappedIndex = replayEnabled
      ? Math.min(Math.max(replayIndex, 0), data.candles.length - 1)
      : data.candles.length - 1;
    const scoped = data.candles.slice(0, cappedIndex + 1);
    if (scoped.length < 12) return { bins: [] as VolumeBin[], maxVolume: 0 };

    const low = scoped.reduce(
      (acc, candle) => (candle.low < acc ? candle.low : acc),
      Number.POSITIVE_INFINITY,
    );
    const high = scoped.reduce(
      (acc, candle) => (candle.high > acc ? candle.high : acc),
      Number.NEGATIVE_INFINITY,
    );
    const range = Math.max(1e-9, high - low);
    const count = Math.max(12, Math.min(60, Math.floor(bins)));
    const buckets = new Array<number>(count).fill(0);

    for (const candle of scoped) {
      const ratio = (candle.close - low) / range;
      const idx = Math.max(0, Math.min(count - 1, Math.floor(ratio * (count - 1))));
      buckets[idx] += candle.volume;
    }

    const maxVolume = buckets.reduce((acc, vol) => (vol > acc ? vol : acc), 0);
    const mapped = buckets.map((volume, index) => ({ index, volume }));
    return { bins: mapped, maxVolume };
  }, [bins, data, enabled, replayEnabled, replayIndex]);

  if (!enabled || profile.bins.length === 0 || profile.maxVolume <= 0) return null;

  const binHeight = 100 / profile.bins.length;

  return (
    <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-[5] w-16">
      <div
        className="absolute right-1 top-1 rounded px-1 py-0.5 text-[9px] font-semibold"
        style={{
          color: "#60A5FA",
          background: "color-mix(in srgb, var(--bg-primary) 72%, transparent)",
        }}
      >
        VP
      </div>
      {profile.bins.map((bin, reversedIdx) => {
        const top = (profile.bins.length - 1 - reversedIdx) * binHeight;
        const width = (bin.volume / profile.maxVolume) * 100;
        return (
          <div
            key={`vp-${bin.index}`}
            className="absolute right-0"
            style={{ top: `${top}%`, height: `${binHeight}%`, width: "100%" }}
          >
            <div
              className="absolute right-0"
              style={{
                width: `${Math.max(4, width)}%`,
                height: "100%",
                background: "rgba(96,165,250,0.28)",
                borderTop: "1px solid rgba(148,163,184,0.08)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
