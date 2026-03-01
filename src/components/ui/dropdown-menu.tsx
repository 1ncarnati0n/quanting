import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used within DropdownMenu");
  }
  return context;
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  (ref as React.MutableRefObject<T>).current = value;
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (value: T) => {
    refs.forEach((ref) => assignRef(ref, value));
  };
}

interface DropdownMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function DropdownMenu({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: DropdownMenuProps) {
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (openProp === undefined) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [onOpenChange, openProp],
  );

  React.useEffect(() => {
    if (!open) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ asChild = false, children, onClick, ...props }, forwardedRef) => {
    const { open, setOpen, triggerRef } = useDropdownMenuContext();

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{
        onClick?: React.MouseEventHandler<HTMLElement>;
      }>;
      const childRef = (child as unknown as { ref?: React.Ref<HTMLElement> }).ref;
      return React.cloneElement(child as React.ReactElement, {
        ref: mergeRefs(childRef, triggerRef as React.Ref<HTMLElement>, forwardedRef as React.Ref<HTMLElement>),
        onClick: (event: React.MouseEvent) => {
          child.props.onClick?.(event as React.MouseEvent<HTMLElement>);
          onClick?.(event as React.MouseEvent<HTMLButtonElement>);
          if (!event.defaultPrevented) {
            setOpen(!open);
          }
        },
        "aria-haspopup": "menu",
        "aria-expanded": open,
      } as Record<string, unknown>);
    }

    return (
      <button
        ref={mergeRefs(triggerRef as React.Ref<HTMLButtonElement>, forwardedRef)}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            setOpen(!open);
          }
        }}
        {...props}
      >
        {children}
      </button>
    );
  },
);

DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = "start", sideOffset = 4, style, ...props }, forwardedRef) => {
    const { open, contentRef } = useDropdownMenuContext();
    if (!open) return null;

    const alignClass =
      align === "end"
        ? "right-0"
        : align === "center"
          ? "left-1/2 -translate-x-1/2"
          : "left-0";

    return (
      <div
        ref={mergeRefs(contentRef, forwardedRef)}
        role="menu"
        className={cn(
          "absolute top-full z-50 min-w-[8rem] overflow-hidden rounded border border-border bg-card p-1 shadow-[var(--shadow-elevated)]",
          alignClass,
          className,
        )}
        style={{ marginTop: sideOffset, ...style }}
        {...props}
      />
    );
  },
);

DropdownMenuContent.displayName = "DropdownMenuContent";

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
  keepOpen?: boolean;
  onSelect?: () => void;
}

const DropdownMenuItem = React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className, inset, keepOpen = false, onClick, onSelect, ...props }, forwardedRef) => {
    const { setOpen } = useDropdownMenuContext();

    return (
      <button
        ref={forwardedRef}
        type="button"
        role="menuitem"
        className={cn(
          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-50",
          inset && "pl-7",
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          onSelect?.();
          if (!keepOpen) setOpen(false);
        }}
        {...props}
      />
    );
  },
);

DropdownMenuItem.displayName = "DropdownMenuItem";

interface DropdownMenuCheckboxItemProps
  extends Omit<DropdownMenuItemProps, "onSelect"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuCheckboxItemProps
>(
  (
    {
      className,
      checked,
      keepOpen = true,
      onCheckedChange,
      onClick,
      children,
      ...props
    },
    forwardedRef,
  ) => {
    return (
      <DropdownMenuItem
        ref={forwardedRef}
        role="menuitemcheckbox"
        aria-checked={checked}
        className={cn("justify-between", className)}
        keepOpen={keepOpen}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          onCheckedChange?.(!checked);
        }}
        {...props}
      >
        <span className="truncate">{children}</span>
        <span
          className="h-3 w-3 rounded-[3px] border"
          style={{
            background: checked ? "var(--primary)" : "transparent",
            borderColor: checked ? "var(--primary)" : "var(--border)",
          }}
          aria-hidden="true"
        />
      </DropdownMenuItem>
    );
  },
);

DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn("my-1 h-px bg-[var(--border)]", className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
};
