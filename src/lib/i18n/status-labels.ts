import type { OrderStatus, PaymentStatus } from "@/lib/domain/status";
import type { Dictionary } from "./dictionaries";

/**
 * Centralised status → label mapping.
 *
 * Written as explicit records of dictionary strings (not dotted lookups) so the
 * compiler enforces that every status has a translation. Unknown values from the
 * API still resolve to a real label rather than an empty string.
 */
export function orderStatusLabel(dict: Dictionary, status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: dict.order.statusLabel.pending,
    processing: dict.order.statusLabel.processing,
    shipped: dict.order.statusLabel.shipped,
    completed: dict.order.statusLabel.completed,
    cancelled: dict.order.statusLabel.cancelled,
    unknown: dict.order.statusLabel.unknown,
  };
  return labels[status];
}

export function paymentStatusLabel(dict: Dictionary, status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    paid: dict.order.paymentStatus.paid,
    partial: dict.order.paymentStatus.partial,
    due: dict.order.paymentStatus.due,
    unpaid: dict.order.paymentStatus.unpaid,
    void: dict.order.paymentStatus.void,
    unknown: dict.order.paymentStatus.unknown,
  };
  return labels[status];
}
