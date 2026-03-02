const UX_METRICS_STORAGE_KEY = "quanting-ux-metrics-v1";

type UxMetricCounter = {
  count: number;
  lastAt: number;
};

type UxMetricsStore = {
  version: 1;
  counters: Record<string, UxMetricCounter>;
};

const EMPTY_STORE: UxMetricsStore = {
  version: 1,
  counters: {},
};

function readStore(): UxMetricsStore {
  try {
    if (typeof window === "undefined") return EMPTY_STORE;
    const raw = localStorage.getItem(UX_METRICS_STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as Partial<UxMetricsStore>;
    if (parsed?.version !== 1 || typeof parsed.counters !== "object" || !parsed.counters) {
      return EMPTY_STORE;
    }
    return {
      version: 1,
      counters: parsed.counters,
    };
  } catch {
    return EMPTY_STORE;
  }
}

function writeStore(store: UxMetricsStore) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(UX_METRICS_STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

function metricKey(flow: string, action: string): string {
  return `${flow}:${action}`;
}

export function trackUxAction(flow: string, action: string) {
  const key = metricKey(flow, action);
  const store = readStore();
  const current = store.counters[key];
  store.counters[key] = {
    count: (current?.count ?? 0) + 1,
    lastAt: Date.now(),
  };
  writeStore(store);
}

export function getUxMetricsSnapshot(): UxMetricsStore {
  return readStore();
}

export function resetUxMetrics() {
  writeStore(EMPTY_STORE);
}

export function downloadUxMetrics() {
  if (typeof window === "undefined") return;
  const store = readStore();
  const payload = {
    exportedAt: Date.now(),
    ...store,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quanting-ux-metrics-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
