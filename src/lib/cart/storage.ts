import { CART_VERSION, EMPTY_CART, type CartLine, type CartState } from "@/lib/domain/cart";
import { normalizeSellMode } from "@/lib/domain/product";

export const CART_STORAGE_KEY = "mini-mercado:cart";

/**
 * Persistence for the anonymous cart.
 *
 * Only non-sensitive basket data is stored — product ids, sell modes and a
 * display snapshot. No customer details, tokens or prices that the server would
 * trust. Anything that fails validation is discarded rather than repaired, so a
 * corrupted or outdated payload can never crash the storefront.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toLine(value: unknown): CartLine | null {
  if (!isRecord(value)) return null;

  const productId = value.productId;
  const quantity = value.quantity;
  const name = value.name;
  const unitPrice = value.unitPrice;

  if (typeof productId !== "number" || !Number.isInteger(productId) || productId <= 0) return null;
  if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) return null;
  if (typeof name !== "string" || name.length === 0) return null;
  if (typeof unitPrice !== "number" || !Number.isFinite(unitPrice)) return null;

  return {
    productId,
    name,
    sku: typeof value.sku === "string" ? value.sku : null,
    sellMode: normalizeSellMode(value.sellMode),
    unitPrice,
    quantity: Math.max(1, Math.floor(quantity)),
    imageUrl: typeof value.imageUrl === "string" ? value.imageUrl : "",
    imageSource:
      value.imageSource === "uploaded" || value.imageSource === "api"
        ? value.imageSource
        : "placeholder",
    maxQuantity:
      typeof value.maxQuantity === "number" && Number.isFinite(value.maxQuantity)
        ? Math.max(0, Math.floor(value.maxQuantity))
        : null,
    isAgeRestricted: value.isAgeRestricted === true,
  };
}

export function parseCartState(raw: unknown): CartState {
  if (!isRecord(raw)) return { ...EMPTY_CART };
  if (raw.version !== CART_VERSION) return { ...EMPTY_CART };
  if (!Array.isArray(raw.lines)) return { ...EMPTY_CART };

  const lines: CartLine[] = [];
  for (const item of raw.lines) {
    const line = toLine(item);
    if (line) lines.push(line);
  }

  return { lines, version: CART_VERSION };
}

export function readCartState(): CartState {
  if (typeof window === "undefined") return { ...EMPTY_CART };

  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return { ...EMPTY_CART };
    return parseCartState(JSON.parse(stored) as unknown);
  } catch {
    return { ...EMPTY_CART };
  }
}

export function writeCartState(state: CartState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode, quota). The cart still works
    // for the current session; it just won't survive a refresh.
  }
}
