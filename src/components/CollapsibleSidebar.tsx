import { useEffect, useState, type ReactNode } from "react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

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
  label: _label,
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <aside
        className="sidebar-shell hidden h-full shrink-0 overflow-hidden 2xl:flex"
        style={{
          width: isOpen ? expandedWidth : 0,
          transition: "width 220ms ease, border-color 180ms ease, box-shadow 180ms ease",
          borderColor: isOpen ? "var(--border)" : "transparent",
          boxShadow: isOpen ? "var(--shadow-elevated)" : "none",
        }}
      >
        <CollapsibleContent
          forceMount
          className="min-w-0 flex-1 overflow-hidden"
          style={{
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
            transition: "opacity 160ms ease",
          }}
        >
          {children}
        </CollapsibleContent>
      </aside>
    </Collapsible>
  );
}
