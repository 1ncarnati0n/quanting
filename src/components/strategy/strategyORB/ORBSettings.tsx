import { useStrategyStore } from "@/stores/useStrategyStore";

export default function ORBSettings() {
  const config = useStrategyStore((s) => s.orbConfig);
  const setConfig = useStrategyStore((s) => s.setOrbConfig);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="ds-type-caption font-medium text-[var(--muted-foreground)]">
          레인지 시간(분)
        </span>
        <input
          type="number"
          min={1}
          max={30}
          value={config.rangeMinutes}
          onChange={(e) => setConfig({ rangeMinutes: Number(e.target.value) })}
          className="h-8 w-16 rounded border border-[var(--border)] bg-[var(--secondary)] px-2 font-mono ds-type-label text-[var(--foreground)]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="ds-type-caption font-medium text-[var(--muted-foreground)]">
          RVOL 기준
        </span>
        <input
          type="number"
          min={1}
          max={20}
          step={0.5}
          value={config.rvolThreshold}
          onChange={(e) => setConfig({ rvolThreshold: Number(e.target.value) })}
          className="h-8 w-16 rounded border border-[var(--border)] bg-[var(--secondary)] px-2 font-mono ds-type-label text-[var(--foreground)]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="ds-type-caption font-medium text-[var(--muted-foreground)]">
          변동률(%)
        </span>
        <input
          type="number"
          min={0.5}
          max={20}
          step={0.5}
          value={config.premarketChangeThreshold}
          onChange={(e) => setConfig({ premarketChangeThreshold: Number(e.target.value) })}
          className="h-8 w-16 rounded border border-[var(--border)] bg-[var(--secondary)] px-2 font-mono ds-type-label text-[var(--foreground)]"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={config.useVwapFilter}
          onChange={(e) => setConfig({ useVwapFilter: e.target.checked })}
          className="h-4 w-4 rounded border-[var(--border)]"
        />
        <span className="ds-type-caption font-medium text-[var(--muted-foreground)]">
          VWAP 필터
        </span>
      </label>
    </div>
  );
}
