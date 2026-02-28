import { create } from "zustand";

export type DrawingTool =
  | "none"
  | "horizontal"
  | "trend"
  | "fib"
  | "measure"
  | "rectangle"
  | "text"
  | "channel"
  | "pitchfork"
  | "gann"
  | "elliott"
  | "harmonic";

export interface DrawingPoint {
  time: number;
  price: number;
}

export interface HorizontalDrawing {
  id: string;
  type: "horizontal";
  price: number;
  color: string;
}

export interface TrendDrawing {
  id: string;
  type: "trend";
  start: DrawingPoint;
  end: DrawingPoint;
  color: string;
}

export interface FibDrawing {
  id: string;
  type: "fib";
  start: DrawingPoint;
  end: DrawingPoint;
  color: string;
}

export interface MeasureDrawing {
  id: string;
  type: "measure";
  start: DrawingPoint;
  end: DrawingPoint;
  color: string;
}

export interface RectangleDrawing {
  id: string;
  type: "rectangle";
  start: DrawingPoint;
  end: DrawingPoint;
  color: string;
  fillColor: string;
}

export interface TextDrawing {
  id: string;
  type: "text";
  point: DrawingPoint;
  text: string;
  color: string;
}

export interface ChannelDrawing {
  id: string;
  type: "channel";
  start: DrawingPoint;
  end: DrawingPoint;
  offset: DrawingPoint;
  color: string;
  fillColor: string;
}

export interface PitchforkDrawing {
  id: string;
  type: "pitchfork";
  a: DrawingPoint;
  b: DrawingPoint;
  c: DrawingPoint;
  color: string;
  fillColor: string;
}

export interface GannDrawing {
  id: string;
  type: "gann";
  start: DrawingPoint;
  end: DrawingPoint;
  color: string;
}

export interface ElliottDrawing {
  id: string;
  type: "elliott";
  points: [DrawingPoint, DrawingPoint, DrawingPoint, DrawingPoint, DrawingPoint];
  color: string;
}

export interface HarmonicDrawing {
  id: string;
  type: "harmonic";
  x: DrawingPoint;
  a: DrawingPoint;
  b: DrawingPoint;
  c: DrawingPoint;
  d: DrawingPoint;
  color: string;
  fillColor: string;
}

export type DrawingItem =
  | HorizontalDrawing
  | TrendDrawing
  | FibDrawing
  | MeasureDrawing
  | RectangleDrawing
  | TextDrawing
  | ChannelDrawing
  | PitchforkDrawing
  | GannDrawing
  | ElliottDrawing
  | HarmonicDrawing;

interface DrawingState {
  activeTool: DrawingTool;
  drawings: DrawingItem[];
  selectedDrawingId: string | null;
  setActiveTool: (tool: DrawingTool) => void;
  setSelectedDrawing: (id: string | null) => void;
  setDrawings: (drawings: DrawingItem[]) => void;
  addDrawing: (drawing: DrawingItem) => void;
  removeDrawing: (id: string) => void;
  undoLastDrawing: () => void;
  clearDrawings: () => void;
}

const DRAWING_STORAGE_KEY = "quanting-drawings";

function loadDrawings(): DrawingItem[] {
  try {
    const raw = localStorage.getItem(DRAWING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as DrawingItem[];
  } catch {
    return [];
  }
}

function saveDrawings(drawings: DrawingItem[]) {
  try {
    localStorage.setItem(DRAWING_STORAGE_KEY, JSON.stringify(drawings));
  } catch {}
}

export const useDrawingStore = create<DrawingState>((set) => ({
  activeTool: "none",
  drawings: loadDrawings(),
  selectedDrawingId: null,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedDrawing: (id) => set({ selectedDrawingId: id }),
  setDrawings: (drawings) => {
    saveDrawings(drawings);
    set((state) => ({
      drawings,
      selectedDrawingId:
        state.selectedDrawingId && drawings.some((item) => item.id === state.selectedDrawingId)
          ? state.selectedDrawingId
          : null,
    }));
  },
  addDrawing: (drawing) =>
    set((state) => {
      const next = [...state.drawings, drawing];
      saveDrawings(next);
      return { drawings: next, selectedDrawingId: drawing.id };
    }),
  removeDrawing: (id) =>
    set((state) => {
      const next = state.drawings.filter((item) => item.id !== id);
      saveDrawings(next);
      return {
        drawings: next,
        selectedDrawingId: state.selectedDrawingId === id ? null : state.selectedDrawingId,
      };
    }),
  undoLastDrawing: () =>
    set((state) => {
      if (state.drawings.length === 0) return {};
      const next = state.drawings.slice(0, -1);
      saveDrawings(next);
      return {
        drawings: next,
        selectedDrawingId:
          state.selectedDrawingId && next.some((item) => item.id === state.selectedDrawingId)
            ? state.selectedDrawingId
            : null,
      };
    }),
  clearDrawings: () =>
    set(() => {
      saveDrawings([]);
      return { drawings: [], selectedDrawingId: null };
    }),
}));
