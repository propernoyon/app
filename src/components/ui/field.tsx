import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Input, Select, Textarea } from "./input";

interface FieldShellProps {
  id: string;
  label: string;
  /** Hides the label visually but keeps it for screen readers. */
  labelHidden?: boolean;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Label + control + hint + error, with the ids wired so the message is announced.
 * Always render a real `<label>`; never rely on a placeholder for the name.
 */
export function FieldShell({
  id,
  label,
  labelHidden = false,
  hint,
  error,
  required,
  className,
  children,
}: FieldShellProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className={cn("block text-small font-semibold text-foreground", labelHidden && "sr-only")}
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-caption text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-caption font-medium text-danger-foreground">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Shared aria wiring for the composite fields below. */
function describedBy(id: string, hint?: ReactNode, error?: string | null) {
  const ids = [error ? `${id}-error` : hint ? `${id}-hint` : undefined].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export interface TextFieldProps extends Omit<ComponentPropsWithRef<"input">, "id"> {
  id: string;
  label: string;
  labelHidden?: boolean;
  hint?: ReactNode;
  error?: string | null;
}

export function TextField({
  id,
  label,
  labelHidden,
  hint,
  error,
  className,
  ...props
}: TextFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      required={props.required}
      className={className}
    >
      <Input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      />
    </FieldShell>
  );
}

export interface TextareaFieldProps extends Omit<ComponentPropsWithRef<"textarea">, "id"> {
  id: string;
  label: string;
  labelHidden?: boolean;
  hint?: ReactNode;
  error?: string | null;
}

export function TextareaField({
  id,
  label,
  labelHidden,
  hint,
  error,
  className,
  ...props
}: TextareaFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      required={props.required}
      className={className}
    >
      <Textarea
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      />
    </FieldShell>
  );
}

export interface SelectFieldProps extends Omit<ComponentPropsWithRef<"select">, "id"> {
  id: string;
  label: string;
  labelHidden?: boolean;
  hint?: ReactNode;
  error?: string | null;
}

export function SelectField({
  id,
  label,
  labelHidden,
  hint,
  error,
  className,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      required={props.required}
      className={className}
    >
      <Select
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      >
        {children}
      </Select>
    </FieldShell>
  );
}
