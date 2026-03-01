import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { trapFocusOnTab } from "./focus-utils";

interface SheetContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

function assignRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  (ref as React.MutableRefObject<T>).current = value;
}

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used within Sheet");
  }
  return context;
}

interface SheetProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right";
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", className, style, children, ...props }, ref) => {
    const { open, onOpenChange } = useSheetContext();
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const restoreFocusRef = React.useRef<HTMLElement | null>(null);

    React.useEffect(() => {
      if (!open) return;
      restoreFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") onOpenChange?.(false);
      };
      window.addEventListener("keydown", onKeyDown);
      const timer = window.setTimeout(() => {
        contentRef.current?.focus();
      }, 0);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
        window.clearTimeout(timer);
        restoreFocusRef.current?.focus?.();
      };
    }, [onOpenChange, open]);

    if (typeof document === "undefined") return null;

    const sideOffset = side === "left" ? { left: "calc(env(safe-area-inset-left, 0px) + 0.75rem)" } : { right: "calc(env(safe-area-inset-right, 0px) + 0.75rem)" };
    const transform = open
      ? "translateX(0)"
      : side === "left"
        ? "translateX(-110%)"
        : "translateX(110%)";

    return createPortal(
      <>
        <button
          type="button"
          aria-label="닫기"
          tabIndex={-1}
          className="fixed inset-0 z-20 bg-black/40 transition-opacity 2xl:hidden"
          style={{
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
          }}
          onClick={() => onOpenChange?.(false)}
        />
        <div
          ref={(node) => {
            contentRef.current = node;
            assignRef(ref, node);
          }}
          className={cn(
            "fixed z-30 flex flex-col overflow-hidden rounded-[var(--radius-panel)] border border-border bg-card shadow-[var(--shadow-elevated)] transition-transform duration-200 2xl:hidden",
            className,
          )}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={(event) => {
            const node = contentRef.current;
            if (!node) return;
            trapFocusOnTab(event, node);
          }}
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
            transform,
            pointerEvents: open ? "auto" : "none",
            ...sideOffset,
            ...style,
          }}
          data-state={open ? "open" : "closed"}
          {...props}
        >
          {children}
        </div>
      </>,
      document.body,
    );
  },
);

SheetContent.displayName = "SheetContent";

export { Sheet, SheetContent };
