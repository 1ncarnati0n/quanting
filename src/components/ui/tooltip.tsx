import * as React from "react";
import { cn } from "@/lib/utils";

type TooltipSide = "top" | "bottom" | "left" | "right";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  side: TooltipSide;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

interface TooltipProviderProps {
  children: React.ReactNode;
}

function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

interface TooltipProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  side?: TooltipSide;
}

function Tooltip({ children, defaultOpen = false, side = "top" }: TooltipProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <TooltipContext.Provider value={{ open, setOpen, side }}>
      <span className="relative inline-flex">{children}</span>
    </TooltipContext.Provider>
  );
}

interface TooltipTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
}

function TooltipTrigger({ children, asChild = false }: TooltipTriggerProps) {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) return children;

  const triggerProps = {
    onMouseEnter: () => ctx.setOpen(true),
    onMouseLeave: () => ctx.setOpen(false),
    onFocus: () => ctx.setOpen(true),
    onBlur: () => ctx.setOpen(false),
  };

  if (!asChild) {
    return (
      <span tabIndex={0} {...triggerProps}>
        {children}
      </span>
    );
  }

  return React.cloneElement(children, {
    ...triggerProps,
    ...children.props,
  });
}

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
}

function TooltipContent({ children, className }: TooltipContentProps) {
  const ctx = React.useContext(TooltipContext);
  if (!ctx || !ctx.open) return null;

  const positionClasses: Record<TooltipSide, string> = {
    top: "bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2",
    bottom: "top-[calc(100%+6px)] left-1/2 -translate-x-1/2",
    left: "right-[calc(100%+6px)] top-1/2 -translate-y-1/2",
    right: "left-[calc(100%+6px)] top-1/2 -translate-y-1/2",
  };

  return (
    <span
      className={cn(
        "ds-type-caption pointer-events-none absolute z-[70] whitespace-nowrap rounded border border-border bg-card px-2 py-1 text-foreground shadow",
        positionClasses[ctx.side],
        className,
      )}
      role="tooltip"
    >
      {children}
    </span>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
