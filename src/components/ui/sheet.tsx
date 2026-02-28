import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface SheetContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

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

    React.useEffect(() => {
      if (!open) return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") onOpenChange?.(false);
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [onOpenChange, open]);

    if (typeof document === "undefined") return null;

    const sideOffset = side === "left" ? { left: "calc(env(safe-area-inset-left, 0px) + 0.5rem)" } : { right: "calc(env(safe-area-inset-right, 0px) + 0.5rem)" };
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
          className="fixed inset-0 z-20 bg-black/40 transition-opacity 2xl:hidden"
          style={{
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
          }}
          onClick={() => onOpenChange?.(false)}
        />
        <div
          ref={ref}
          className={cn(
            "fixed z-30 flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-elevated)] transition-transform duration-200 2xl:hidden",
            className,
          )}
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 0.5rem)",
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)",
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
