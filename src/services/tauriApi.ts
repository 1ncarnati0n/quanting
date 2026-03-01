import { invoke } from "@tauri-apps/api/core";
import type {
  AnalysisParams,
  AnalysisResponse,
  FundamentalsParams,
  FundamentalsResponse,
  MultiSymbolCandlesParams,
  MultiSymbolCandlesResponse,
  PremarketSnapshot,
  PremarketSnapshotParams,
  WatchlistSnapshot,
  WatchlistSnapshotParams,
} from "../types";

export async function fetchAnalysis(
  params: AnalysisParams,
): Promise<AnalysisResponse> {
  return invoke<AnalysisResponse>("fetch_analysis", { params });
}

export async function fetchWatchlistSnapshots(
  params: WatchlistSnapshotParams,
): Promise<WatchlistSnapshot[]> {
  return invoke<WatchlistSnapshot[]>("fetch_watchlist_snapshots", { params });
}

export async function fetchFundamentals(
  params: FundamentalsParams,
): Promise<FundamentalsResponse> {
  return invoke<FundamentalsResponse>("fetch_fundamentals", { params });
}

export async function fetchMultiSymbolCandles(
  params: MultiSymbolCandlesParams,
): Promise<MultiSymbolCandlesResponse> {
  return invoke<MultiSymbolCandlesResponse>("fetch_multi_symbol_candles", { params });
}

export async function fetchPremarketSnapshots(
  params: PremarketSnapshotParams,
): Promise<PremarketSnapshot[]> {
  return invoke<PremarketSnapshot[]>("fetch_premarket_snapshots", { params });
}
