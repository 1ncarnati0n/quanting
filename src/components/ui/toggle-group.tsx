import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleGroupContextValue {
  value: string;
  onValueChange?: (value: string) => void;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(
  null,
);

interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single";
  value?: string;
  onValueChange?: (value: string) => void;
}

function ToggleGroup({
  className,
  value = "",
  onValueChange,
  children,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupContext.Provider value={{ value, onValueChange }}>
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-border bg-secondary p-1",
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
        "rounded px-2 py-1 text-xs font-semibold transition-colors",
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
