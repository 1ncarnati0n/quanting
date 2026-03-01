import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleGroupContextValue {
  value: string;
  size: "sm" | "md" | "lg";
  onValueChange?: (value: string) => void;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(
  null,
);

interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single";
  value?: string;
  size?: "sm" | "md" | "lg";
  onValueChange?: (value: string) => void;
}

const GROUP_SIZE_CLASSES: Record<NonNullable<ToggleGroupProps["size"]>, string> = {
  sm: "gap-1 p-1",
  md: "gap-1.5 p-1.5",
  lg: "gap-2 p-2",
};

const ITEM_SIZE_CLASSES: Record<NonNullable<ToggleGroupProps["size"]>, string> = {
  sm: "h-[var(--control-height-sm)] px-2 text-[var(--font-size-body-sm)]",
  md: "h-[var(--control-height-md)] px-3 text-sm",
  lg: "h-[var(--control-height-lg)] px-4 text-[var(--font-size-subtitle)]",
};

function ToggleGroup({
  className,
  value = "",
  size = "md",
  onValueChange,
  children,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupContext.Provider value={{ value, size, onValueChange }}>
      <div
        className={cn(
          "inline-flex items-center rounded border border-border bg-secondary",
          GROUP_SIZE_CLASSES[size],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

interface ToggleGroupItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

function ToggleGroupItem({
  className,
  value,
  onClick,
  children,
  ...props
}: ToggleGroupItemProps) {
  const group = React.useContext(ToggleGroupContext);
  const active = group?.value === value;

  return (
    <button
      type="button"
      onClick={(e) => {
        group?.onValueChange?.(value);
        onClick?.(e);
      }}
      className={cn(
        "rounded font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        ITEM_SIZE_CLASSES[group?.size ?? "md"],
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted",
        className,
      )}
      aria-pressed={active}
      {...props}
    >
      {children}
    </button>
  );
}

export { ToggleGroup, ToggleGroupItem };
