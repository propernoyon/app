import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";

export type ButtonSize = "sm" | "md" | "lg";

/**
 * Variant classes are exposed so non-button elements (e.g. `next/link`) can look
 * identical without an `asChild` dependency.
 */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 " +
  "ease-[var(--ease-out-soft)] select-none " +
  "disabled:pointer-events-none disabled:opacity-55 " +
  "active:translate-y-px";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "bg-primary-muted text-primary-strong border border-primary-border hover:bg-primary-muted-hover",
  outline: "bg-surface text-foreground border border-border-strong hover:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  danger: "bg-danger text-on-danger shadow-xs hover:brightness-95",
  link: "bg-transparent px-0 text-primary underline-offset-4 hover:underline",
};

/**
 * Every size clears the 44px minimum touch target; they differ in padding and
 * type scale rather than height, so a "small" button is still comfortably tappable.
 */
const SIZES: Record<ButtonSize, string> = {
  sm: "h-11 px-3 text-small",
  md: "h-11 px-4 text-small",
  lg: "h-12 px-6 text-body",
};

export interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, blocks interaction and announces busy state. */
  loading?: boolean;
  /** Rendered before the label (kept out of the label for screen readers). */
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonVariants({
        variant,
        size,
        className: cn(fullWidth && "w-full", className),
      })}
    >
      {loading ? <Spinner size={size === "lg" ? 18 : 16} /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
}
