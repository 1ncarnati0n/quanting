import * as React from "react";
import { cn } from "@/lib/utils";

const Command = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)]",
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
        "h-9 w-full border-0 border-b border-[var(--border-color)] bg-transparent px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]",
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
    <div ref={ref} className={cn("py-1", className)} {...props}>
      {heading ? (
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
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
      className={cn("px-3 py-6 text-center text-xs text-[var(--text-secondary)]", className)}
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
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)]",
        active && "bg-[var(--accent-soft)]",
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
      className={cn("my-1 h-px bg-[var(--border-color)]", className)}
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
