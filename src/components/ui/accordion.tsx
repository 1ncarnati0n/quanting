import * as React from "react";
import { cn } from "@/lib/utils";

type AccordionType = "single" | "multiple";

interface AccordionContextValue {
  values: string[];
  toggleValue: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);
const AccordionItemContext = React.createContext<{ value: string } | null>(null);

function useAccordionContext() {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within Accordion");
  }
  return context;
}

function useAccordionItemContext() {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error("Accordion item components must be used within AccordionItem");
  }
  return context;
}

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AccordionType;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

function normalizeValues(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function Accordion({
  type = "single",
  value: valueProp,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: AccordionProps) {
  const [uncontrolledValues, setUncontrolledValues] = React.useState<string[]>(() =>
    normalizeValues(defaultValue),
  );
  const values = valueProp === undefined ? uncontrolledValues : normalizeValues(valueProp);

  const setValues = React.useCallback(
    (nextValues: string[]) => {
      if (valueProp === undefined) {
        setUncontrolledValues(nextValues);
      }
      if (type === "single") {
        onValueChange?.(nextValues[0] ?? "");
      } else {
        onValueChange?.(nextValues);
      }
    },
    [onValueChange, type, valueProp],
  );

  const toggleValue = React.useCallback(
    (next: string) => {
      if (type === "single") {
        setValues(values[0] === next ? [] : [next]);
        return;
      }
      if (values.includes(next)) {
        setValues(values.filter((v) => v !== next));
        return;
      }
      setValues([...values, next]);
    },
    [setValues, type, values],
  );

  return (
    <AccordionContext.Provider value={{ values, toggleValue }}>
      <div className={className} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

function AccordionItem({ value, className, children, ...props }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className={className} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

function AccordionTrigger({
  className,
  children,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { values, toggleValue } = useAccordionContext();
  const { value } = useAccordionItemContext();
  const open = values.includes(value);

  return (
    <button
      type="button"
      aria-expanded={open}
      data-state={open ? "open" : "closed"}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggleValue(value);
      }}
      {...props}
    >
      {children}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{
          color: "var(--text-secondary)",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 160ms ease",
        }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { values } = useAccordionContext();
  const { value } = useAccordionItemContext();
  const open = values.includes(value);
  if (!open) return null;

  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
