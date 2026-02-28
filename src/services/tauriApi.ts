import { invoke } from "@tauri-apps/api/core";
import type {
  AnalysisParams,
  AnalysisResponse,
  FundamentalsParams,
  FundamentalsResponse,
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
