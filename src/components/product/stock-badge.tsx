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

/** One stock vocabulary everywhere: In stock / Low stock / Out of stock. */
export function StockBadge({
  status,
  dict,
  size = "sm",
}: {
  status: StockStatus;
  dict: Dictionary;
  size?: "sm" | "md";
}) {
  return (
    <Badge variant={TONE_TO_BADGE[STOCK_STATUS_TONE[status]]} dot size={size}>
      {LABELS(dict)[status]}
    </Badge>
  );
}
