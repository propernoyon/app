import type { CartLine } from "@/lib/domain/cart";
import { maxQuantityFor, unitPriceFor, type Product, type SellMode } from "@/lib/domain/product";

/**
 * Builds a cart line from a product.
 *
 * The line keeps a *snapshot* of name/price/image so the cart renders instantly
 * from storage. Prices are re-read from the API before checkout, so this snapshot
 * is presentation-only and can never change what is charged.
 */
export function toCartLine(product: Product, sellMode: SellMode = "piece"): CartLine {
  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    sellMode,
    unitPrice: unitPriceFor(product, sellMode),
    quantity: 1,
    imageUrl: product.image.url,
    imageSource: product.image.source,
    maxQuantity: maxQuantityFor(product, sellMode),
    isAgeRestricted: product.isAgeRestricted,
  };
}

/**
 * Refreshes a stored line with current product data after an order or a stock
 * check, keeping the customer's chosen quantity.
 */
export function refreshCartLine(line: CartLine, product: Product): CartLine {
  return {
    ...line,
    name: product.name,
    sku: product.sku,
    unitPrice: unitPriceFor(product, line.sellMode),
    imageUrl: product.image.url,
    imageSource: product.image.source,
    maxQuantity: maxQuantityFor(product, line.sellMode),
    isAgeRestricted: product.isAgeRestricted,
  };
}
