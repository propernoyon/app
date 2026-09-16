import { cn } from "@/lib/utils/cn";

export type PriceSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<PriceSize, string> = {
  sm: "text-small",
  md: "text-body-lg font-semibold",
  lg: "text-h3",
  xl: "text-h2",
};

export interface PriceProps {
  /** Pre-formatted price (formatting lives on the server, see lib/i18n/formats). */
  value: string;
  /** Optional struck-through original price. */
  compareAt?: string | null;
  size?: PriceSize;
  /** Extra context appended in muted text, e.g. "per kg" or "/ un". */
  suffix?: string | null;
  className?: string;
}

export function Price({ value, compareAt, size = "md", suffix, className }: PriceProps) {
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("text-foreground tabular-nums", SIZES[size])}>{value}</span>
      {compareAt ? (
        <s className="text-caption text-muted-foreground tabular-nums">{compareAt}</s>
      ) : null}
      {suffix ? (
        <span className="text-caption font-normal text-muted-foreground">{suffix}</span>
      ) : null}
    </p>
  );
}
