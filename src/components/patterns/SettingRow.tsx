import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingRowProps {
  label: ReactNode;
  description?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  hint?: ReactNode;
  className?: string;
  labelClassName?: string;
}

export default function SettingRow({
  label,
  description,
  right,
  children,
  hint,
  className,
  labelClassName,
}: SettingRowProps) {
  return (
    <div className={cn(className)}>
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <span className={cn("ds-type-label text-token-muted", labelClassName)}>
            {label}
          </span>
          {description ? (
            <p className="ds-type-caption text-token-muted mt-1 opacity-90">
              {description}
            </p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      {children ? <div className="mt-1.5">{children}</div> : null}
      {hint ? <div className="ds-type-caption text-token-muted mt-1.5">{hint}</div> : null}
    </div>
  );
}
