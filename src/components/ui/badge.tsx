import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeVariant =
  "neutral" | "primary" | "accent" | "success" | "warning" | "danger" | "info" | "outline";

export type BadgeSize = "sm" | "md";

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: "bg-muted text-subtle-foreground border-border",
  primary: "bg-primary-muted text-primary-strong border-primary-border",
  accent: "bg-accent-muted text-accent-strong border-accent-border",
  success: "bg-success-muted text-success-foreground border-success-border",
  warning: "bg-warning-muted text-warning-foreground border-warning-border",
  danger: "bg-danger-muted text-danger-foreground border-danger-border",
  info: "bg-info-muted text-info-foreground border-info-border",
  outline: "bg-transparent text-subtle-foreground border-border-strong",
};

const SIZES: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-micro",
  md: "px-2.5 py-1 text-caption",
};

export interface BadgeProps extends ComponentPropsWithRef<"span"> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Small leading dot — used for stock/status indicators. */
  dot?: boolean;
}

const DOT_COLOR: Record<BadgeVariant, string> = {
  neutral: "bg-muted-foreground",
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  outline: "bg-muted-foreground",
};

export function Badge({
  variant = "neutral",
  size = "sm",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", DOT_COLOR[variant])}
        />
      ) : null}
      {children}
    </span>
  );
}
