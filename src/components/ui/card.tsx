import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      className={cn("rounded-card border border-border bg-card shadow-card", className)}
    />
  );
}

/**
 * Surfaces that respond to hover (product cards). Kept separate from `Card`
 * so interactive elevation is a deliberate choice, never accidental.
 */
export function InteractiveCard({ className, ...props }: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "group/card rounded-card border border-border bg-card shadow-card",
        "transition-[box-shadow,transform,border-color] duration-200 ease-[var(--ease-out-soft)]",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover",
        "focus-within:-translate-y-0.5 focus-within:shadow-card-hover",
        "motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0",
        className,
      )}
    />
  );
}

export function CardBody({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cn("p-4 sm:p-5", className)} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cn("border-t border-border px-4 py-3 sm:px-5", className)} />;
}
