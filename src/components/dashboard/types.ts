export type DashboardDockTab = "watchlist" | "indicators" | "layout";
export type DashboardDockFocusSection = "presets" | "alerts" | "compare";

export interface DashboardDockFocusRequest {
  section: DashboardDockFocusSection;
  nonce: number;
}
