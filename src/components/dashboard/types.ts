export type DashboardDockTab = "watchlist" | "indicators" | "layout";
export type DashboardDockFocusSection = "presets" | "alerts";

export interface DashboardDockFocusRequest {
  section: DashboardDockFocusSection;
  nonce: number;
}
