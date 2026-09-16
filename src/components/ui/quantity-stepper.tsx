"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  /** Upper bound, normally the available stock. */
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  labels: { decrease: string; increase: string; quantity: string };
  className?: string;
}

/**
 * Touch-friendly quantity control. Buttons stay at 44px on mobile so the
 * control is usable one-handed; the numeric input keeps typed entry fast.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  disabled = false,
  size = "md",
  labels,
  className,
}: QuantityStepperProps) {
  const [draft, setDraft] = useState(() => String(value));
  const [lastValue, setLastValue] = useState(value);

  // Adopt external changes (e.g. the parent clamping to available stock) during
  // render instead of in an effect — React's documented "adjust state when a
  // prop changes" pattern, which avoids a second render pass and a visible flicker.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(String(value));
  }

  const clamp = (next: number) => {
    const lower = Math.max(min, next);
    return max !== undefined ? Math.min(lower, max) : lower;
  };

  const commit = (next: number) => onChange(clamp(next));

  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;

  const buttonClass = cn(
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface",
    "text-foreground transition-colors duration-150 hover:bg-muted",
    "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-surface",
    // Both sizes keep a 44px touch target; `sm` only tightens the input width.
    "size-11",
  );

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface p-1",
        disabled && "opacity-60",
        className,
      )}
    >
      <button
        type="button"
        className={buttonClass}
        onClick={() => commit(value - step)}
        disabled={disabled || atMin}
        aria-label={labels.decrease}
      >
        <Minus aria-hidden="true" className="size-4" />
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={labels.quantity}
        disabled={disabled}
        value={draft}
        onChange={(event) => {
          const raw = event.target.value.replace(/[^0-9]/g, "");
          setDraft(raw);
          if (raw !== "") commit(Number(raw));
        }}
        onBlur={() => {
          if (draft === "" || Number(draft) < min) commit(min);
          else commit(Number(draft));
        }}
        className={cn(
          "min-w-0 flex-1 rounded-md border-0 bg-transparent text-center font-semibold tabular-nums text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          "disabled:cursor-not-allowed",
          "h-11",
          size === "sm" ? "max-w-10 text-small" : "max-w-12",
        )}
      />

      <button
        type="button"
        className={buttonClass}
        onClick={() => commit(value + step)}
        disabled={disabled || atMax}
        aria-label={labels.increase}
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
