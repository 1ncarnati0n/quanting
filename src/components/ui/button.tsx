import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default:
    "border-transparent bg-primary text-primary-foreground shadow-[var(--accent-glow)] hover:brightness-[0.98]",
  secondary:
    "border-border bg-secondary text-foreground shadow-[var(--shadow-inset)] hover:bg-muted hover:shadow-[var(--shadow-soft)]",
  outline:
    "border border-border bg-transparent text-foreground shadow-[var(--shadow-inset)] hover:bg-secondary hover:shadow-[var(--shadow-soft)]",
  ghost:
    "border-transparent bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground hover:shadow-[var(--shadow-soft)]",
  destructive: "border-transparent bg-destructive text-white hover:brightness-95",
  link: "border-transparent bg-transparent text-primary underline-offset-4 hover:underline",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: "h-[var(--control-height-md)] px-3.5 text-[var(--font-size-body-sm)]",
  sm: "h-[var(--control-height-sm)] px-2.5 text-[var(--font-size-body-sm)]",
  lg: "h-[var(--control-height-lg)] px-4 text-[var(--font-size-body)]",
  icon: "h-[var(--control-height-sm)] w-[var(--control-height-sm)] p-0",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "default", type = "button", ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border font-medium leading-none backdrop-blur-sm transition-[background-color,color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
