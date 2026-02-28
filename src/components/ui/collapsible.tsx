import * as React from "react";

interface CollapsibleContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext() {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error("Collapsible components must be used within Collapsible");
  }
  return context;
}

interface CollapsibleProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Collapsible({ open, onOpenChange, children }: CollapsibleProps) {
  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange }}>
      {children}
    </CollapsibleContext.Provider>
  );
}

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ asChild = false, children, onClick, ...props }, forwardedRef) => {
    const context = useCollapsibleContext();

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, {
        ref: forwardedRef,
        onClick: (event: React.MouseEvent) => {
          (
            children as unknown as {
              props: { onClick?: (event: React.MouseEvent) => void };
            }
          ).props.onClick?.(event);
          onClick?.(event as React.MouseEvent<HTMLButtonElement>);
          if (!event.defaultPrevented) {
            context.onOpenChange?.(!context.open);
          }
        },
        "aria-expanded": context.open,
      });
    }

    return (
      <button
        ref={forwardedRef}
        type="button"
        aria-expanded={context.open}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            context.onOpenChange?.(!context.open);
          }
        }}
        {...props}
      >
        {children}
      </button>
    );
  },
);

CollapsibleTrigger.displayName = "CollapsibleTrigger";

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean;
}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ forceMount = false, ...props }, forwardedRef) => {
    const context = useCollapsibleContext();
    if (!context.open && !forceMount) return null;

    return (
      <div
        ref={forwardedRef}
        data-state={context.open ? "open" : "closed"}
        {...props}
      />
    );
  },
);

CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
