import type { MarketType } from "../types";

export function formatPrice(price: number, market?: MarketType): string {
  if (market === "krStock") {
    return "₩" + Math.round(price).toLocaleString("ko-KR");
  }
  if (market === "usStock") {
    return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // crypto: existing logic
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(8);
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function formatShortTime(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}
