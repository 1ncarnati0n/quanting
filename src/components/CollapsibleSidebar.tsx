import { useEffect, useMemo, useState, type ReactNode } from "react";

interface CollapsibleSidebarProps {
  side: "left" | "right";
  label: string;
  storageKey: string;
  expandedWidth: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

function Chevron({ side, open }: { side: "left" | "right"; open: boolean }) {
  const points = useMemo(() => {
    if (side === "left") {
      return open ? "15 6 9 12 15 18" : "9 6 15 12 9 18";
    }
    return open ? "9 6 15 12 9 18" : "15 6 9 12 15 18";
  }, [side, open]);

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points={points} />
    </svg>
  );
}

export default function CollapsibleSidebar({
  side,
  label,
  storageKey,
  expandedWidth,
  defaultOpen = false,
  children,
}: CollapsibleSidebarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "1") setIsOpen(true);
      if (saved === "0") setIsOpen(false);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, isOpen ? "1" : "0");
    } catch {}
  }, [storageKey, isOpen]);

  useEffect(() => {
    const toggleEvent = side === "left" ? "quanting:toggle-left-sidebar" : "quanting:toggle-right-sidebar";
    const closeEvent = "quanting:close-sidebars";

    const onToggle = () => setIsOpen((prev) => !prev);
    const onClose = () => setIsOpen(false);

    window.addEventListener(toggleEvent, onToggle as EventListener);
    window.addEventListener(closeEvent, onClose as EventListener);
    return () => {
      window.removeEventListener(toggleEvent, onToggle as EventListener);
      window.removeEventListener(closeEvent, onClose as EventListener);
    };
  }, [side]);

  const rail = (
    <div
      className="sidebar-rail flex h-full w-11 shrink-0 flex-col items-center gap-2 py-2"
      style={side === "left" ? { borderRight: "1px solid var(--border-color)" } : { borderLeft: "1px solid var(--border-color)" }}
    >
      <button
        type="button"
        aria-label={`${label} ${isOpen ? "접기" : "펼치기"}`}
        title={`${label} ${isOpen ? "접기" : "펼치기"}`}
        className="btn-ghost rounded p-1.5"
        style={{ color: "var(--text-secondary)" }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Chevron side={side} open={isOpen} />
      </button>
      <span
        className="text-[9px] font-semibold tracking-wider [writing-mode:vertical-rl]"
        style={{ color: "var(--text-secondary)", textOrientation: "mixed" }}
      >
        {label}
      </span>
    </div>
  );

  return (
    <aside
      className="sidebar-shell hidden h-full shrink-0 overflow-hidden 2xl:flex"
      style={{
        width: isOpen ? expandedWidth : 44,
        transition: "width 220ms ease",
      }}
    >
      {side === "left" ? (
        <>
          {rail}
          <div
            className="min-w-0 flex-1 overflow-hidden"
            style={{
              opacity: isOpen ? 1 : 0,
              pointerEvents: isOpen ? "auto" : "none",
              transition: "opacity 160ms ease",
            }}
          >
            {children}
          </div>
        </>
      ) : (
        <>
          <div
            className="min-w-0 flex-1 overflow-hidden"
            style={{
              opacity: isOpen ? 1 : 0,
              pointerEvents: isOpen ? "auto" : "none",
              transition: "opacity 160ms ease",
            }}
          >
            {children}
          </div>
          {rail}
        </>
      )}
    </aside>
  );
}
