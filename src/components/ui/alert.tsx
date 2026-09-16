import type { ComponentPropsWithRef, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type AlertVariant = "info" | "success" | "warning" | "danger";

const VARIANTS: Record<AlertVariant, { className: string; Icon: typeof Info }> = {
  info: { className: "bg-info-muted border-info-border text-info-foreground", Icon: Info },
  success: {
    className: "bg-success-muted border-success-border text-success-foreground",
    Icon: CheckCircle2,
  },
  warning: {
    className: "bg-warning-muted border-warning-border text-warning-foreground",
    Icon: AlertTriangle,
  },
  danger: {
    className: "bg-danger-muted border-danger-border text-danger-foreground",
    Icon: XCircle,
  },
};

export interface AlertProps extends Omit<ComponentPropsWithRef<"div">, "title"> {
  variant?: AlertVariant;
  title?: ReactNode;
}

/**
 * Inline status message. `danger` and `warning` announce immediately; the calmer
 * variants are polite so they don't interrupt a screen reader mid-sentence.
 */
export function Alert({ variant = "info", title, className, children, ...props }: AlertProps) {
  const { className: variantClass, Icon } = VARIANTS[variant];

  return (
    <div
      {...props}
      role={variant === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 text-small sm:p-4",
        variantClass,
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && "mt-0.5 opacity-90")}>{children}</div> : null}
      </div>
    </div>
  );
}
