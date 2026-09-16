import "server-only";

import { apiConfig, posRequest } from "./client";
import { mockCreateOrder, mockOrder } from "./mock";
import { toCreatedOrder, toOrder } from "./normalize";
import { PosApiError, isPosApiError } from "./errors";
import type { CreateOrderInput, CreatedOrder, Order } from "@/lib/domain/order";

/** Reference format the POS accepts: `/orders/{ref}` where ref is `[A-Za-z0-9_-]+`. */
const REFERENCE_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

export function isValidOrderReference(reference: string): boolean {
  return REFERENCE_PATTERN.test(reference.trim());
}

/**
 * Maps the domain input onto the POS payload.
 *
 * This is the single place the request contract is expressed. The v1 endpoint
 * accepts exactly `customer`, `items`, `payment_method` and `note` — there is no
 * column for delivery/pickup, discounts or shipping in `api_orders`, so anything
 * extra is folded into `note` here rather than being silently dropped.
 *
 * Prices are intentionally NOT sent: the POS looks up `sale_price` /
 * `sale_price_box` from its own database, so a tampered client cannot change
 * what is charged.
 */
export function toOrderPayload(input: CreateOrderInput): Record<string, unknown> {
  return {
    customer: {
      name: input.customer.name.trim(),
      phone: input.customer.phone.trim(),
      email: input.customer.email.trim(),
      address: input.customer.address.trim(),
    },
    items: input.items.map((line) => ({
      product_id: line.productId,
      qty: line.quantity,
      sell_mode: line.sellMode,
    })),
    payment_method: input.paymentMethod,
    note: input.note?.trim() ?? "",
  };
}

export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  const payload = apiConfig.useMock
    ? await mockCreateOrder(input)
    : await posRequest<unknown>("/orders", {
        method: "POST",
        body: toOrderPayload(input),
        // Never cached — and never retried (see client.ts).
        revalidate: false,
      });

  const created = toCreatedOrder(payload);
  if (!created) {
    throw new PosApiError("invalid_response", "The order response could not be read.", {
      endpoint: "/orders",
    });
  }

  return created;
}

/**
 * Order status lookup. Returns `null` for an unknown reference so the tracking
 * page can show "we couldn't find that order" instead of an error screen.
 */
export async function getOrderByReference(reference: string): Promise<Order | null> {
  const normalized = reference.trim();
  if (!isValidOrderReference(normalized)) return null;

  try {
    const payload = apiConfig.useMock
      ? await mockOrder(normalized)
      : await posRequest<unknown>(`/orders/${encodeURIComponent(normalized)}`, {
          revalidate: false,
        });

    if (payload === null) return null;
    return toOrder(payload);
  } catch (error) {
    if (isPosApiError(error) && error.kind === "not_found") return null;
    throw error;
  }
}
