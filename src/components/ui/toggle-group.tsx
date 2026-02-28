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
          "inline-flex items-center gap-1 rounded-md border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-1",
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
          ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]",
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
