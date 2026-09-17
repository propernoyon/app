import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { STOCK_STATUS_TONE, type StatusTone, type StockStatus } from "@/lib/domain/status";

const TONE_TO_BADGE: Record<StatusTone, BadgeVariant> = {
  neutral: "neutral",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

const LABELS: (dict: Dictionary) => Record<StockStatus, string> = (dict) => ({
  in_stock: dict.product.stock.inStock,
  low_stock: dict.product.stock.lowStock,
  out_of_stock: dict.product.stock.outOfStock,
  unknown: dict.product.stock.unknown,
});

/**
 * One stock vocabulary everywhere: In stock / Low stock / Out of stock.
 *
 * `quantity` is the *pre-formatted* available count — formatting belongs on the
 * server, like prices. It is appended after the label and omitted entirely when
 * unknown or zero, so the badge never reads “Out of stock · 0”.
 */
export function StockBadge({
  status,
  dict,
  size = "sm",
  quantity,
}: {
  status: StockStatus;
  dict: Dictionary;
  size?: "sm" | "md";
  quantity?: string | null;
}) {
  return (
    <Badge variant={TONE_TO_BADGE[STOCK_STATUS_TONE[status]]} dot size={size}>
      {LABELS(dict)[status]}
      {quantity ? <span className="font-normal tabular-nums">· {quantity}</span> : null}
    </Badge>
  );
}
