import "server-only";

import { apiConfig, posRequest } from "./client";
import { mockStock } from "./mock";
import { toLiveStock, type LiveStock } from "./normalize";
import { isPosApiError } from "./errors";

/**
 * Live stock is the most volatile data in the system, so it is **never cached**.
 * It is also re-read immediately before an order is submitted, because the POS
 * orders endpoint (v1) does not validate stock itself.
 */
export async function getLiveStock(productId: number): Promise<LiveStock | null> {
  try {
    const payload = apiConfig.useMock
      ? await mockStock(productId)
      : await posRequest<unknown>(`/stock/${productId}`, { revalidate: false });

    if (payload === null) return null;
    return toLiveStock(payload);
  } catch (error) {
    if (isPosApiError(error) && error.kind === "not_found") return null;
    throw error;
  }
}

export interface StockCheck {
  productId: number;
  /** Quantity the customer wants. */
  requested: number;
  available: number;
  /** True when the basket line is still orderable as-is. */
  ok: boolean;
  status: LiveStock["status"] | "unknown";
}

/**
 * Batch stock validation for a cart. Runs the requests in parallel and treats an
 * unreachable product as unavailable rather than silently allowing the order.
 */
export async function checkStock(
  requested: readonly { productId: number; quantity: number }[],
): Promise<StockCheck[]> {
  const results = await Promise.all(
    requested.map(async ({ productId, quantity }) => {
      const stock = await getLiveStock(productId);
      const available = stock?.qty ?? 0;

      return {
        productId,
        requested: quantity,
        available,
        ok: Boolean(stock) && available >= quantity,
        status: stock?.status ?? "unknown",
      } satisfies StockCheck;
    }),
  );

  return results;
}
