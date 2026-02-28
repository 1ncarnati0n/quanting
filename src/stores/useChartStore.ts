import { create } from "zustand";
import type { AnalysisResponse, AnalysisParams } from "../types";
import { fetchAnalysis } from "../services/tauriApi";

interface ChartState {
  data: AnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchData: (params: AnalysisParams) => void;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isFirstCall = true;

export const useChartStore = create<ChartState>((set) => ({
  data: null,
  isLoading: false,
  error: null,
  fetchData: (params: AnalysisParams) => {
    if (debounceTimer) clearTimeout(debounceTimer);

    const doFetch = async () => {
      set({ isLoading: true, error: null });
      try {
        const data = await fetchAnalysis(params);
        set({ data, isLoading: false });
      } catch (e) {
        const msg =
          typeof e === "string"
            ? e
            : e instanceof Error
              ? e.message
              : "분석 데이터 조회에 실패했습니다";
        console.error("데이터 조회 오류:", msg);
        set({ error: msg, isLoading: false });
      }
    };

    // No debounce on first call for instant loading
    if (isFirstCall) {
      isFirstCall = false;
      doFetch();
    } else {
      debounceTimer = setTimeout(doFetch, 300);
    }
  },
}));
