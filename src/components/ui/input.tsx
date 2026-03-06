import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<InputProps["size"]>, string> = {
  sm: "h-[var(--control-height-sm)] px-2.5 text-[var(--font-size-body-sm)]",
  md: "h-[var(--control-height-md)] px-3 text-[var(--font-size-body-sm)]",
  lg: "h-[var(--control-height-lg)] px-3.5 text-[var(--font-size-body)]",
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", size = "md", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "ds-type-label w-full rounded-[var(--radius-sm)] border border-border bg-secondary text-foreground leading-none outline-none shadow-[var(--shadow-inset)] transition-[background-color,color,border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-[var(--accent-glow)] disabled:cursor-not-allowed disabled:opacity-50",
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
