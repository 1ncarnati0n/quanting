import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "type"> {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      ...props
    },
    ref,
  ) => {
    const resolvedValue = value?.[0] ?? defaultValue?.[0] ?? min;
    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={resolvedValue}
        onChange={(event) => onValueChange?.([Number(event.target.value)])}
        className={cn("h-2 w-full cursor-pointer accent-[var(--primary)]", className)}
        {...props}
      />
    );
  },
);

Slider.displayName = "Slider";

export { Slider };
