import type { ReactNode } from "react";

interface CollapsibleSidebarProps {
  side: "left" | "right";
  label: string;
  storageKey: string;
  expandedWidth: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function CollapsibleSidebar({
  side,
  expandedWidth,
  children,
}: CollapsibleSidebarProps) {
  return (
    <aside
      className="sidebar-shell hidden h-full shrink-0 overflow-hidden xl:flex"
      style={{
        width: expandedWidth,
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-elevated)",
        order: side === "left" ? 0 : 2,
      }}
    >
      <div className="min-w-0 flex-1 overflow-hidden">
        {children}
      </div>
    </aside>
  );
}
