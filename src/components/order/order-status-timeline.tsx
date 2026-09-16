import { Check, CircleX } from "lucide-react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  ORDER_STATUS_TONE,
  ORDER_TIMELINE,
  orderStatusStep,
  type OrderStatus,
  type StatusTone,
} from "@/lib/domain/status";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { orderStatusLabel } from "@/lib/i18n/status-labels";
import { cn } from "@/lib/utils/cn";

const TONE_TO_BADGE: Record<StatusTone, BadgeVariant> = {
  neutral: "neutral",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

/**
 * Order progress.
 *
 * The happy path renders as a four-step timeline. A cancelled or unrecognised
 * status can't be placed on that timeline, so it renders as a single badge —
 * and an unmapped status still shows its raw value rather than nothing.
 */
export function OrderStatusTimeline({
  status,
  rawStatus,
  dict,
  className,
}: {
  status: OrderStatus;
  rawStatus?: string;
  dict: Dictionary;
  className?: string;
}) {
  const step = orderStatusStep(status);

  if (step === -1) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <Badge variant={TONE_TO_BADGE[ORDER_STATUS_TONE[status]]} size="md" dot>
          {status === "cancelled" ? <CircleX aria-hidden="true" className="size-3.5" /> : null}
          {orderStatusLabel(dict, status)}
        </Badge>
        {status === "unknown" && rawStatus ? (
          <span className="font-mono text-caption text-muted-foreground">{rawStatus}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-micro text-muted-foreground">{dict.track.timeline}</p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-4">
        {ORDER_TIMELINE.map((item, index) => {
          const isDone = index < step;
          const isCurrent = index === step;
          return (
            <li key={item} className="flex items-center gap-2 sm:flex-col sm:items-start">
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold",
                  isDone && "border-success bg-success text-on-success",
                  isCurrent && "border-primary bg-primary text-primary-foreground",
                  !isDone && !isCurrent && "border-border text-muted-foreground",
                )}
              >
                {isDone ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-caption",
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {orderStatusLabel(dict, item)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
