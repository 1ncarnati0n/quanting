import { create } from "zustand";

interface ReplayState {
  enabled: boolean;
  playing: boolean;
  speed: number;
  currentIndex: number;
  enterReplay: (totalBars: number, lookback?: number) => void;
  exitReplay: () => void;
  togglePlaying: () => void;
  setSpeed: (speed: number) => void;
  setCurrentIndex: (index: number, totalBars: number) => void;
  step: (delta: number, totalBars: number) => void;
  tick: (totalBars: number) => void;
}

function clampIndex(index: number, totalBars: number): number {
  if (totalBars <= 0) return 0;
  return Math.min(totalBars - 1, Math.max(0, Math.floor(index)));
}

export const useReplayStore = create<ReplayState>((set, get) => ({
  enabled: false,
  playing: false,
  speed: 1,
  currentIndex: 0,
  enterReplay: (totalBars, lookback = 120) => {
    const safeTotal = Math.max(1, totalBars);
    const startIndex = clampIndex(safeTotal - lookback, safeTotal);
    set({
      enabled: true,
      playing: false,
      currentIndex: startIndex,
    });
  },
  exitReplay: () => {
    set({ enabled: false, playing: false, currentIndex: 0 });
  },
  togglePlaying: () => {
    if (!get().enabled) return;
    set((state) => ({ playing: !state.playing }));
  },
  setSpeed: (speed) => {
    const next = Number.isFinite(speed) ? Math.min(8, Math.max(0.25, speed)) : 1;
    set({ speed: next });
  },
  setCurrentIndex: (index, totalBars) => {
    set({ currentIndex: clampIndex(index, totalBars) });
  },
  step: (delta, totalBars) => {
    if (!get().enabled) return;
    set((state) => ({
      currentIndex: clampIndex(state.currentIndex + delta, totalBars),
    }));
  },
  tick: (totalBars) => {
    const state = get();
    if (!state.enabled || !state.playing) return;
    const maxIndex = clampIndex(totalBars - 1, totalBars);
    if (state.currentIndex >= maxIndex) {
      set({ playing: false });
      return;
    }
    set({ currentIndex: state.currentIndex + 1 });
  },
}));
