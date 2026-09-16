/**
 * Status vocabulary for both stock and orders.
 *
 * Everything is resolved through these functions so an unexpected value from the
 * API degrades to `"unknown"` and renders a neutral label instead of crashing a
 * page. Never compare raw API strings directly in components.
 */

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

/* ── Stock ────────────────────────────────────────────────────────────────── */

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "unknown";

const STOCK_STATUSES = ["in_stock", "low_stock", "out_of_stock"] as const;

export function resolveStockStatus(raw: unknown, quantity: number, lowAlert: number): StockStatus {
  if (typeof raw === "string" && (STOCK_STATUSES as readonly string[]).includes(raw)) {
    return raw as StockStatus;
  }

  // The API may omit or rename `status`; fall back to the quantities we do have.
  if (Number.isFinite(quantity)) {
    if (quantity <= 0) return "out_of_stock";
    if (lowAlert > 0 && quantity <= lowAlert) return "low_stock";
    return "in_stock";
  }

  return "unknown";
}

export const STOCK_STATUS_TONE: Record<StockStatus, StatusTone> = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "danger",
  unknown: "neutral",
};

/* ── Orders ───────────────────────────────────────────────────────────────── */

/** The happy-path progression, in display order, used for the tracking timeline. */
export const ORDER_TIMELINE = ["pending", "processing", "shipped", "completed"] as const;

export type OrderTimelineStatus = (typeof ORDER_TIMELINE)[number];
export type OrderStatus = OrderTimelineStatus | "cancelled" | "unknown";

/**
 * The POS writes `void` for a cancelled order (its admin UI labels it
 * "Cancelled"), so both spellings map to `cancelled`.
 */
const ORDER_STATUS_ALIASES: Record<string, OrderStatus> = {
  pending: "pending",
  processing: "processing",
  shipped: "shipped",
  completed: "completed",
  void: "cancelled",
  cancelled: "cancelled",
  canceled: "cancelled",
};

export function resolveOrderStatus(raw: unknown): OrderStatus {
  if (typeof raw !== "string") return "unknown";
  return ORDER_STATUS_ALIASES[raw.trim().toLowerCase()] ?? "unknown";
}

export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  pending: "neutral",
  processing: "info",
  shipped: "info",
  completed: "success",
  cancelled: "danger",
  unknown: "neutral",
};

/** Position in the timeline, or `-1` for cancelled/unknown (no progress shown). */
export function orderStatusStep(status: OrderStatus): number {
  return (ORDER_TIMELINE as readonly string[]).indexOf(status);
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === "completed" || status === "cancelled";
}

/* ── Payment ──────────────────────────────────────────────────────────────── */

export type PaymentStatus = "paid" | "partial" | "due" | "unpaid" | "void" | "unknown";

export function resolvePaymentStatus(raw: unknown): PaymentStatus {
  if (typeof raw !== "string") return "unknown";
  const value = raw.trim().toLowerCase();
  if (
    value === "paid" ||
    value === "partial" ||
    value === "due" ||
    value === "unpaid" ||
    value === "void"
  ) {
    return value;
  }
  return "unknown";
}
