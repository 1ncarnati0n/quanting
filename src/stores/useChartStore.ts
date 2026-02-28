import { create } from "zustand";
import type {
  AnalysisResponse,
  AnalysisParams,
  Candle,
  FundamentalsParams,
  FundamentalsResponse,
} from "../types";
import { fetchAnalysis, fetchFundamentals } from "../services/tauriApi";

interface ChartState {
  data: AnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  fundamentals: FundamentalsResponse | null;
  fundamentalsLoading: boolean;
  fundamentalsError: string | null;
  fundamentalsKey: string | null;
  fetchData: (params: AnalysisParams) => void;
  fetchFundamentals: (params: FundamentalsParams) => Promise<void>;
  updateRealtimeCandle: (candle: Candle) => void;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isFirstCall = true;

export const useChartStore = create<ChartState>((set) => ({
  data: null,
  isLoading: false,
  error: null,
  fundamentals: null,
  fundamentalsLoading: false,
  fundamentalsError: null,
  fundamentalsKey: null,
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
  fetchFundamentals: async (params: FundamentalsParams) => {
    const normalizedSymbol = params.symbol.trim().toUpperCase();
    if (!normalizedSymbol) return;

    const key = `${params.market}:${normalizedSymbol}`;

    const current = useChartStore.getState();
    if (
      current.fundamentalsKey === key &&
      current.fundamentals &&
      !current.fundamentalsError &&
      !current.fundamentalsLoading
    ) {
      return;
    }

    set((state) => ({
      fundamentalsLoading: true,
      fundamentalsError: null,
      fundamentalsKey: key,
      fundamentals:
        state.fundamentalsKey === key
          ? state.fundamentals
          : null,
    }));

    try {
      const response = await fetchFundamentals({
        symbol: normalizedSymbol,
        market: params.market,
      });
      set((state) => {
        if (state.fundamentalsKey !== key) return {};
        return {
          fundamentals: response,
          fundamentalsLoading: false,
          fundamentalsError: null,
        };
      });
    } catch (e) {
      const msg =
        typeof e === "string"
          ? e
          : e instanceof Error
            ? e.message
            : "재무 데이터 조회에 실패했습니다";

      set((state) => {
        if (state.fundamentalsKey !== key) return {};
        return {
          fundamentals: null,
          fundamentalsLoading: false,
          fundamentalsError: msg,
        };
      });
    }
  },
  updateRealtimeCandle: (candle) =>
    set((state) => {
      if (!state.data || !state.data.candles.length) return {};

      const candles = [...state.data.candles];
      const last = candles[candles.length - 1];
      if (!last) return {};

      if (candle.time < last.time) return {};
      if (candle.time === last.time) {
        candles[candles.length - 1] = candle;
      } else {
        candles.push(candle);
        if (candles.length > 500) {
          candles.shift();
        }
      }

      return {
        data: {
          ...state.data,
          candles,
        },
      };
    }),
}));
