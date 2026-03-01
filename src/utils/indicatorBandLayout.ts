type WeightedBand = {
  weight: number;
};

export type IndicatorBandLayout<T extends WeightedBand> = T & {
  top: number;
  height: number;
};

export interface IndicatorBandLayoutResult<T extends WeightedBand> {
  mainRegionTop: number;
  mainBottomMargin: number;
  oscTop: number;
  oscHeight: number;
  bands: IndicatorBandLayout<T>[];
}

interface ComputeIndicatorBandLayoutOptions {
  minMainRegionTop?: number;
  maxMainRegionTop?: number;
  splitGap?: number;
  oscBottomMargin?: number;
  minBandHeight?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function computeIndicatorBandLayout<T extends WeightedBand>(
  rawBands: T[],
  requestedMainRegionTop: number,
  options?: ComputeIndicatorBandLayoutOptions,
): IndicatorBandLayoutResult<T> {
  const minMainRegionTop = finiteOr(options?.minMainRegionTop ?? 0.35, 0.35);
  const maxMainRegionTop = finiteOr(options?.maxMainRegionTop ?? 0.85, 0.85);
  const splitGap = finiteOr(options?.splitGap ?? 0.006, 0.006);
  const oscBottomMargin = finiteOr(options?.oscBottomMargin ?? 0.02, 0.02);
  const minBandHeight = finiteOr(options?.minBandHeight ?? 0.028, 0.028);
  const requestedTop = finiteOr(requestedMainRegionTop, 0.62);

  const bands = rawBands.map((band) => ({
    ...band,
    weight: Math.max(0, finiteOr(band.weight, 1)),
  }));

  if (bands.length === 0) {
    const mainRegionTop = clamp(requestedTop, minMainRegionTop, maxMainRegionTop);
    const oscTop = clamp(mainRegionTop + splitGap, 0.01, 0.97);
    const mainBottomMargin = clamp(1 - mainRegionTop + splitGap, 0.01, 0.98);
    const oscHeight = Math.max(0.01, 1 - oscTop - oscBottomMargin);
    return { mainRegionTop, mainBottomMargin, oscTop, oscHeight, bands: [] };
  }

  const requiredBandHeight = bands.length * minBandHeight;
  const dynamicMaxMainTop = 1 - splitGap - oscBottomMargin - requiredBandHeight;
  const cappedMaxMainTop = clamp(dynamicMaxMainTop, minMainRegionTop, maxMainRegionTop);
  const mainRegionTop = clamp(requestedTop, minMainRegionTop, cappedMaxMainTop);
  const mainBottomMargin = clamp(1 - mainRegionTop + splitGap, 0.01, 0.98);
  const oscTop = clamp(mainRegionTop + splitGap, 0.01, 0.97);
  const oscHeight = Math.max(0.01, 1 - oscTop - oscBottomMargin);

  const perBandMinHeight = Math.min(minBandHeight, oscHeight / bands.length);
  const extraHeight = Math.max(0, oscHeight - perBandMinHeight * bands.length);
  const totalWeight = bands.reduce((sum, band) => sum + band.weight, 0);
  const safeTotalWeight = totalWeight > 0 ? totalWeight : bands.length;

  let cursorTop = oscTop;
  const computedBands = bands.map((band, index) => {
    const isLast = index === bands.length - 1;
    const weightedExtra = isLast
      ? 0
      : extraHeight * ((totalWeight > 0 ? band.weight : 1) / safeTotalWeight);
    const height = isLast
      ? Math.max(0.001, 1 - oscBottomMargin - cursorTop)
      : Math.max(0.001, perBandMinHeight + weightedExtra);
    const top = Math.max(0.001, cursorTop);
    cursorTop += height;
    return {
      ...(band as T),
      top,
      height,
    };
  });

  return {
    mainRegionTop,
    mainBottomMargin,
    oscTop,
    oscHeight,
    bands: computedBands,
  };
}
