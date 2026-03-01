import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { getFocusableElements, trapFocusOnTab } from "./focus-utils";

interface DialogContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  titleId: string;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const titleId = React.useId();
  return (
    <DialogContext.Provider value={{ open, onOpenChange, titleId }}>
      {children}
    </DialogContext.Provider>
  );
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  overlayClassName?: string;
}

function DialogContent({
  className,
  overlayClassName,
  children,
  ...props
}: DialogContentProps) {
  const context = React.useContext(DialogContext);
  if (!context || !context.open) return null;
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const timer = window.setTimeout(() => {
      const node = contentRef.current;
      if (!node) return;
      const [firstFocusable] = getFocusableElements(node);
      (firstFocusable ?? node).focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        context.onOpenChange?.(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [context.onOpenChange]);

  const content = (
    <div className={cn("fixed inset-0 z-[200] flex items-center justify-center", overlayClassName)}>
      <button
        type="button"
        aria-label="닫기"
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px]"
        onClick={() => context.onOpenChange?.(false)}
      />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={context.titleId}
        tabIndex={-1}
        onKeyDown={(event) => {
          const node = contentRef.current;
          if (!node) return;
          trapFocusOnTab(event, node);
        }}
        className={cn(
          "relative z-[201] max-h-[calc(100vh-4rem)] w-[min(100%-2rem,480px)] overflow-y-auto rounded-[var(--radius-panel)] border border-border bg-card p-[var(--panel-padding)] shadow-[var(--shadow-elevated)]",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-5 flex items-center justify-between", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const context = React.useContext(DialogContext);
  return (
    <h2
      id={context?.titleId}
      className={cn("text-sm font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export { Dialog, DialogContent, DialogHeader, DialogTitle };
