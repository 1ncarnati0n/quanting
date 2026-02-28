import { create } from "zustand";

export interface CrosshairData {
  time: number | null;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  indicators: Record<string, string>;
}

interface CrosshairState extends CrosshairData {
  setData: (data: CrosshairData) => void;
}

export const useCrosshairStore = create<CrosshairState>((set) => ({
  time: null,
  open: 0,
  high: 0,
  low: 0,
  close: 0,
  volume: 0,
  indicators: {},
  setData: (data) => set(data),
}));
