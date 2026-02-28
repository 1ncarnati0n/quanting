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
          "h-8 w-full rounded-md border border-border bg-secondary px-2 text-xs text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
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
    <option className={cn("bg-secondary text-foreground", className)} {...props}>
      {children}
    </option>
  );
}

export { Select, SelectItem };
