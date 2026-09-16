import { lineTotal, sumMoney } from "./money";
import type { ImageSource, SellMode } from "./product";

/**
 * A cart line stores only what is needed to render and re-price the basket:
 * identifiers, the sell mode, and a *display snapshot* taken when the item was
 * added. Prices are always re-read from the API before checkout, so a stale
 * snapshot can never change what the customer is charged.
 */
export interface CartLine {
  productId: number;
  name: string;
  sku: string | null;
  sellMode: SellMode;
  /** Display-only snapshot; the API recalculates authoritative prices. */
  unitPrice: number;
  quantity: number;
  imageUrl: string;
  imageSource: ImageSource;
  /** Stock observed when added — a hint for the UI, re-validated before checkout. */
  maxQuantity: number | null;
  isAgeRestricted: boolean;
}

export interface CartState {
  lines: CartLine[];
  /** Bumped when the persisted shape changes, so old payloads can be discarded. */
  version: number;
}

export const CART_VERSION = 1;

export const EMPTY_CART: CartState = { lines: [], version: CART_VERSION };

export function cartItemCount(lines: readonly CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function cartLineTotal(line: CartLine): number {
  return lineTotal(line.unitPrice, line.quantity);
}

export function cartSubtotal(lines: readonly CartLine[]): number {
  return sumMoney(lines.map(cartLineTotal));
}

/**
 * The key a line is stored under. The same product bought by the piece and by
 * the box are separate lines, because they carry different prices and stock.
 */
export function cartLineKey(productId: number, sellMode: SellMode): string {
  return `${productId}:${sellMode}`;
}

export function hasAgeRestrictedLines(lines: readonly CartLine[]): boolean {
  return lines.some((line) => line.isAgeRestricted);
}
