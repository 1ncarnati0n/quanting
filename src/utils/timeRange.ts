export const TIME_RANGE_STORAGE_KEY = "quanting-time-range";
export const DEFAULT_TIME_RANGE_ID = "all";

export const TIME_RANGES = [
  { id: "1d", label: "1일", days: 1, legacyValues: ["1D"] },
  { id: "5d", label: "5일", days: 5, legacyValues: ["5D"] },
  { id: "1m", label: "1개월", days: 30, legacyValues: ["1M"] },
  { id: "3m", label: "3개월", days: 90, legacyValues: ["3M"] },
  { id: "6m", label: "6개월", days: 180, legacyValues: ["6M"] },
  { id: "ytd", label: "연초대비", days: -1, legacyValues: ["YTD"] },
  { id: "1y", label: "1년", days: 365, legacyValues: ["1Y"] },
  { id: "5y", label: "5년", days: 1825, legacyValues: ["5Y"] },
  { id: "all", label: "전체", days: 0, legacyValues: ["전체"] },
] as const;

export type TimeRangeOption = (typeof TIME_RANGES)[number];
export type TimeRangeId = TimeRangeOption["id"];

export type ChartTimeRange = { from: number; to: number };

export function resolveTimeRangeId(raw: string | null | undefined): TimeRangeId {
  if (!raw) return DEFAULT_TIME_RANGE_ID;
  const matched = TIME_RANGES.find(
    (item) =>
      item.id === raw ||
      item.label === raw ||
      item.legacyValues.some((legacy) => legacy === raw),
  );
  return matched?.id ?? DEFAULT_TIME_RANGE_ID;
}

export function readSavedTimeRangeId(): TimeRangeId {
  try {
    return resolveTimeRangeId(localStorage.getItem(TIME_RANGE_STORAGE_KEY));
  } catch {
    return DEFAULT_TIME_RANGE_ID;
  }
}

export function getTimeRangeOptionById(id: string): TimeRangeOption {
  return TIME_RANGES.find((item) => item.id === id) ?? TIME_RANGES[TIME_RANGES.length - 1];
}

export function buildTimeRangeDetail(
  id: TimeRangeId,
  nowTs: number = Math.floor(Date.now() / 1000),
): ChartTimeRange | null {
  const range = getTimeRangeOptionById(id);

  if (range.days === 0) {
    return null;
  }

  if (range.days === -1) {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    return {
      from: Math.floor(yearStart.getTime() / 1000),
      to: nowTs,
    };
  }

  return {
    from: nowTs - range.days * 86400,
    to: nowTs,
  };
}
