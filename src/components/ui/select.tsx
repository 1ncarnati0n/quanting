import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, onValueChange, onChange, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-8 w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-2 text-xs text-[var(--text-primary)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        onChange={(event) => {
          onValueChange?.(event.target.value);
          onChange?.(event);
        }}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";

interface SelectItemProps
  extends React.OptionHTMLAttributes<HTMLOptionElement> {
  value: string;
}

function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <option className={cn("bg-[var(--bg-tertiary)] text-[var(--text-primary)]", className)} {...props}>
      {children}
    </option>
  );
}

export { Select, SelectItem };
