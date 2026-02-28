import { invoke } from "@tauri-apps/api/core";
import type {
  AnalysisParams,
  AnalysisResponse,
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
