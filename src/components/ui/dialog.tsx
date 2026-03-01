import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
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

  const content = (
    <div className={cn("fixed inset-0 z-[200] flex items-center justify-center", overlayClassName)}>
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px]"
        onClick={() => context.onOpenChange?.(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-[201] max-h-[calc(100vh-4rem)] w-[min(100%-2rem,480px)] overflow-y-auto rounded border border-border bg-card p-6 shadow-[var(--shadow-elevated)]",
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
      className={cn("mb-4 flex items-center justify-between", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-sm font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export { Dialog, DialogContent, DialogHeader, DialogTitle };
