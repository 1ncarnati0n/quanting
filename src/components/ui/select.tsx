import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  onValueChange?: (value: string) => void;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<SelectProps["size"]>, string> = {
  sm: "h-[var(--control-height-sm)] px-2.5 text-[var(--font-size-body-sm)]",
  md: "h-[var(--control-height-md)] px-3 text-[var(--font-size-body-sm)]",
  lg: "h-[var(--control-height-lg)] px-3.5 text-[var(--font-size-body)]",
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, onValueChange, onChange, children, size = "md", ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "ds-type-label w-full rounded-[var(--radius-sm)] border border-border bg-secondary text-foreground leading-none outline-none shadow-[var(--shadow-inset)] transition-[background-color,color,border-color,box-shadow] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-[var(--accent-glow)] disabled:cursor-not-allowed disabled:opacity-50",
          SIZE_CLASSES[size],
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
