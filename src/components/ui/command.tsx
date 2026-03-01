import * as React from "react";
import { cn } from "@/lib/utils";

const Command = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded border border-border bg-card",
        className,
      )}
      {...props}
    />
  ),
);

Command.displayName = "Command";

const CommandInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "ds-type-label h-[var(--control-height-md)] w-full border-0 border-b border-border bg-transparent px-3 text-foreground leading-none outline-none placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
);

CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("max-h-[22rem] overflow-y-auto overflow-x-hidden", className)}
      {...props}
    />
  ),
);

CommandList.displayName = "CommandList";

interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: React.ReactNode;
}

const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ className, heading, children, ...props }, ref) => (
    <div ref={ref} className={cn("py-1.5", className)} {...props}>
      {heading ? (
        <div className="ds-type-caption px-3 py-1 font-bold uppercase tracking-wider text-muted-foreground">
          {heading}
        </div>
      ) : null}
      <div>{children}</div>
    </div>
  ),
);

CommandGroup.displayName = "CommandGroup";

const CommandEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("ds-type-label px-3 py-6 text-center text-muted-foreground", className)}
      {...props}
    />
  ),
);

CommandEmpty.displayName = "CommandEmpty";

interface CommandItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

const CommandItem = React.forwardRef<HTMLButtonElement, CommandItemProps>(
  ({ className, active, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "ds-type-label flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-foreground transition-colors hover:bg-secondary",
        active && "bg-accent",
        className,
      )}
      {...props}
    />
  ),
);

CommandItem.displayName = "CommandItem";

function CommandSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn("my-1 h-px bg-[var(--border)]", className)}
      {...props}
    />
  );
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandEmpty,
  CommandItem,
  CommandSeparator,
};
