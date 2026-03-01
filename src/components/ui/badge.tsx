import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default:
    "border-transparent bg-primary text-primary-foreground",
  secondary:
    "border-transparent bg-secondary text-foreground",
  outline: "border-border bg-transparent text-foreground",
  destructive: "border-transparent bg-destructive text-white",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "ds-type-caption inline-flex items-center rounded-full border px-2 py-0.5 font-semibold",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
