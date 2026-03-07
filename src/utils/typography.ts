const FALLBACK_ROOT_FONT_SIZE_PX = 15;

export function readRootFontSizePx(fallback = FALLBACK_ROOT_FONT_SIZE_PX): number {
  if (typeof window === "undefined") return fallback;
  const parsed = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function remToPx(rem: number, fallbackRootPx = FALLBACK_ROOT_FONT_SIZE_PX): number {
  return rem * readRootFontSizePx(fallbackRootPx);
}
