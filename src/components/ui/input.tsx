import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<InputProps["size"]>, string> = {
  sm: "h-[var(--control-height-sm)] px-2.5 text-[var(--font-size-body-sm)]",
  md: "h-[var(--control-height-md)] px-3 text-sm",
  lg: "h-[var(--control-height-lg)] px-3.5 text-[var(--font-size-subtitle)]",
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", size = "md", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "w-full rounded border border-border bg-secondary text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
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
