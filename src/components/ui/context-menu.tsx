import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type MenuPosition = { x: number; y: number };

interface ContextMenuContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
}

const ContextMenuContext = React.createContext<ContextMenuContextValue | null>(null);

function assignRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  (ref as React.MutableRefObject<T>).current = value;
}

function useContextMenuContext() {
  const context = React.useContext(ContextMenuContext);
  if (!context) {
    throw new Error("ContextMenu components must be used within ContextMenu");
  }
  return context;
}

interface ContextMenuProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function ContextMenu({ open, onOpenChange, children }: ContextMenuProps) {
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (contentRef.current?.contains(target)) return;
      onOpenChange?.(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange?.(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  return (
    <ContextMenuContext.Provider value={{ open, onOpenChange, contentRef }}>
      {children}
    </ContextMenuContext.Provider>
  );
}

interface ContextMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  position: MenuPosition | null;
}

const ContextMenuContent = React.forwardRef<HTMLDivElement, ContextMenuContentProps>(
  ({ className, position, style, ...props }, forwardedRef) => {
    const { open, contentRef } = useContextMenuContext();
    const [adjustedPosition, setAdjustedPosition] = React.useState<MenuPosition | null>(position);

    React.useLayoutEffect(() => {
      if (!open || !position || !contentRef.current) {
        setAdjustedPosition(position);
        return;
      }

      const menu = contentRef.current;
      const padding = 8;
      const maxX = Math.max(padding, window.innerWidth - menu.offsetWidth - padding);
      const maxY = Math.max(padding, window.innerHeight - menu.offsetHeight - padding);

      setAdjustedPosition({
        x: Math.min(Math.max(position.x, padding), maxX),
        y: Math.min(Math.max(position.y, padding), maxY),
      });
    }, [open, position, contentRef]);

    if (!open || !adjustedPosition) return null;

    return createPortal(
      <div
        ref={(node) => {
          contentRef.current = node;
          assignRef(forwardedRef, node);
        }}
        role="menu"
        className={cn(
          "fixed z-[140] min-w-[10rem] overflow-hidden rounded-[var(--radius-md)] border border-border bg-card p-1 shadow-[var(--shadow-elevated)]",
          className,
        )}
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          ...style,
        }}
        {...props}
      />,
      document.body,
    );
  },
);

ContextMenuContent.displayName = "ContextMenuContent";

interface ContextMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  keepOpen?: boolean;
  onSelect?: () => void;
}

const ContextMenuItem = React.forwardRef<HTMLButtonElement, ContextMenuItemProps>(
  ({ className, keepOpen = false, onClick, onSelect, ...props }, forwardedRef) => {
    const { onOpenChange } = useContextMenuContext();

    return (
      <button
        ref={forwardedRef}
        type="button"
        role="menuitem"
        className={cn(
          "ds-type-label flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          onSelect?.();
          if (!keepOpen) onOpenChange?.(false);
        }}
        {...props}
      />
    );
  },
);

ContextMenuItem.displayName = "ContextMenuItem";

function ContextMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn("my-1 h-px bg-[var(--border)]", className)}
      {...props}
    />
  );
}

export { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator };
