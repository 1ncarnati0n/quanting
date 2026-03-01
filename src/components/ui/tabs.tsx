import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange?: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within Tabs");
  }
  return context;
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange?: (value: string) => void;
}

function Tabs({ value, onValueChange, className, children, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center rounded border border-border bg-secondary p-1",
        className,
      )}
      {...props}
    />
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, onClick, ...props }, ref) => {
    const context = useTabsContext();
    const active = context.value === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={active}
        data-state={active ? "active" : "inactive"}
        className={cn(
          "ds-type-label inline-flex items-center justify-center rounded px-2 py-1 font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            context.onValueChange?.(value);
          }
        }}
        {...props}
      />
    );
  },
);

TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

function TabsContent({ value, className, ...props }: TabsContentProps) {
  const context = useTabsContext();
  if (context.value !== value) return null;

  return (
    <div
      role="tabpanel"
      data-state="active"
      className={className}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
