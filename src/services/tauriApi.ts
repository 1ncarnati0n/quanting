import { invoke } from "@tauri-apps/api/core";
import type { AnalysisParams, AnalysisResponse } from "../types";

export async function fetchAnalysis(
  params: AnalysisParams,
): Promise<AnalysisResponse> {
  return invoke<AnalysisResponse>("fetch_analysis", { params });
}
