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
    "bg-primary text-primary-foreground hover:bg-primary",
  secondary:
    "bg-secondary text-foreground hover:bg-muted",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-secondary",
  ghost:
    "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
  destructive: "bg-destructive text-white hover:opacity-90",
  link: "bg-transparent text-primary underline-offset-4 hover:underline",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: "h-[var(--control-height-md)] px-4 text-sm",
  sm: "h-[var(--control-height-sm)] rounded px-3 text-[var(--font-size-body-sm)]",
  lg: "h-[var(--control-height-lg)] rounded px-6 text-sm",
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
          "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
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
