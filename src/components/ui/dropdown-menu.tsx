import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  setFocusOnOpen: (target: "first" | "last" | "active") => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  contentId: string;
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
  const focusOnOpenRef = React.useRef<"first" | "last" | "active">("active");
  const wasOpenRef = React.useRef(defaultOpen);
  const contentId = React.useId();
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
  const setFocusOnOpen = React.useCallback((target: "first" | "last" | "active") => {
    focusOnOpenRef.current = target;
  }, []);

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

  React.useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      const items = Array.from(
        contentRef.current?.querySelectorAll<HTMLButtonElement>(
          '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
        ) ?? [],
      ).filter((item) => !item.disabled);
      if (!items.length) return;

      const activeItem = contentRef.current?.querySelector<HTMLButtonElement>(
        '[data-dropdown-active="true"]',
      );
      const strategy = focusOnOpenRef.current;
      if (strategy === "last") {
        items[items.length - 1]?.focus();
      } else if (strategy === "first") {
        items[0]?.focus();
      } else {
        activeItem?.focus() ?? items[0]?.focus();
      }
      focusOnOpenRef.current = "active";
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  React.useEffect(() => {
    if (wasOpenRef.current && !open) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  return (
    <DropdownMenuContext.Provider
      value={{
        open,
        setOpen,
        setFocusOnOpen,
        triggerRef,
        contentRef,
        contentId,
      }}
    >
      {children}
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ asChild = false, children, onClick, onKeyDown, ...props }, forwardedRef) => {
    const { open, setOpen, setFocusOnOpen, triggerRef, contentId } = useDropdownMenuContext();

    const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.defaultPrevented) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusOnOpen("active");
        if (!open) setOpen(true);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusOnOpen("last");
        if (!open) setOpen(true);
      }
    };

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{
        onClick?: React.MouseEventHandler<HTMLElement>;
        onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
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
        onKeyDown: (event: React.KeyboardEvent) => {
          child.props.onKeyDown?.(event as React.KeyboardEvent<HTMLElement>);
          onKeyDown?.(event as React.KeyboardEvent<HTMLButtonElement>);
          handleTriggerKeyDown(event as React.KeyboardEvent<HTMLElement>);
        },
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": open ? contentId : undefined,
      } as Record<string, unknown>);
    }

    return (
      <button
        ref={mergeRefs(triggerRef as React.Ref<HTMLButtonElement>, forwardedRef)}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? contentId : undefined}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            setOpen(!open);
          }
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          handleTriggerKeyDown(event as unknown as React.KeyboardEvent<HTMLElement>);
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
  ({ className, align = "start", sideOffset = 4, style, onKeyDown, ...props }, forwardedRef) => {
    const { open, setOpen, contentRef, contentId } = useDropdownMenuContext();
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
        id={contentId}
        role="menu"
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            return;
          }
          if (event.key === "Tab") {
            setOpen(false);
            return;
          }
          const items = Array.from(
            (event.currentTarget as HTMLDivElement).querySelectorAll<HTMLButtonElement>(
              '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
            ),
          ).filter((item) => !item.disabled);
          if (!items.length) return;

          const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
          const focusAt = (index: number) => {
            items[(index + items.length) % items.length]?.focus();
          };

          if (event.key === "ArrowDown") {
            event.preventDefault();
            focusAt(currentIndex + 1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            focusAt(currentIndex <= 0 ? items.length - 1 : currentIndex - 1);
          } else if (event.key === "Home") {
            event.preventDefault();
            focusAt(0);
          } else if (event.key === "End") {
            event.preventDefault();
            focusAt(items.length - 1);
          }
        }}
        className={cn(
          "absolute top-full z-50 min-w-[8rem] overflow-hidden rounded-[var(--radius-md)] border border-border bg-card p-1 shadow-[var(--shadow-elevated)]",
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
          "dropdown-menu-item ds-type-label flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-50",
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
