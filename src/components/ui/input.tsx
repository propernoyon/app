import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";

const CONTROL_BASE =
  "w-full rounded-lg border bg-surface px-3 text-foreground placeholder:text-muted-foreground " +
  "transition-[border-color,box-shadow] duration-150 ease-[var(--ease-out-soft)] " +
  "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 " +
  "aria-[invalid=true]:border-danger";

export function Input({ className, ...props }: ComponentPropsWithRef<"input">) {
  return (
    <input
      {...props}
      className={cn(
        CONTROL_BASE,
        "h-11 border-input",
        "hover:border-border-strong focus:border-primary",
        className,
      )}
    />
  );
}

export function Textarea({ className, ...props }: ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(
        CONTROL_BASE,
        "min-h-24 border-input py-2.5 leading-relaxed",
        "hover:border-border-strong focus:border-primary",
        className,
      )}
    />
  );
}

export function Select({ className, children, ...props }: ComponentPropsWithRef<"select">) {
  return (
    <select
      {...props}
      className={cn(
        CONTROL_BASE,
        "h-11 cursor-pointer appearance-none border-input py-0 pr-9",
        "bg-[length:1rem] bg-[position:right_0.75rem_center] bg-no-repeat",
        "hover:border-border-strong focus:border-primary",
        className,
      )}
      style={{
        // The chevron is a data-URI, which cannot use `currentColor`. It is
        // supplied as a themed variable instead (see tokens.css) so it inverts
        // with the rest of the UI.
        backgroundImage: "var(--mm-select-chevron)",
        ...props.style,
      }}
    >
      {children}
    </select>
  );
}
