import type { StockStatus } from "./status";

export type SellType = "piece" | "box" | "both" | "unknown";

/** How a line is priced and picked. The POS accepts `piece` or `box`. */
export type SellMode = "piece" | "box";

export interface ProductCategoryRef {
  id: number;
  name: string;
  color: string | null;
}

export interface ProductStock {
  /** Total sellable quantity in sale units. */
  qty: number;
  boxes: number;
  pieces: number;
  lowAlert: number;
  status: StockStatus;
}

export type ImageSource = "uploaded" | "api" | "placeholder";

export interface ResolvedImage {
  url: string;
  source: ImageSource;
  /** Tiny inline preview for `next/image` while the real file loads. */
  blurDataURL?: string;
  width?: number;
  height?: number;
}

/**
 * Domain product. Field names are camelCase and prices are flattened out of the
 * API's `pricing` object — mapping happens once, in `lib/api/normalize.ts`.
 */
export interface Product {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  category: ProductCategoryRef | null;
  sellType: SellType;
  saleUnit: string | null;
  purchaseUnit: string | null;
  piecesPerBox: number;
  /** Price for one sale unit (`pricing.sale_price`). */
  price: number;
  /** Price for a full box (`pricing.sale_price_box`), 0 when not sold by box. */
  boxPrice: number;
  taxPercent: number;
  stock: ProductStock;
  /** Final image URL after applying upload overrides and the placeholder. */
  image: ResolvedImage;
  /** Raw `image_url` from the API, kept for the admin image list. */
  apiImageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** Resolved server-side so client components never read server config. */
  isAgeRestricted: boolean;
}

export function canSellByBox(product: Product): boolean {
  return (product.sellType === "box" || product.sellType === "both") && product.boxPrice > 0;
}

/** Coerces an untrusted value into a sell mode; anything but `box` is a piece. */
export function normalizeSellMode(raw: unknown): SellMode {
  return raw === "box" ? "box" : "piece";
}

export function unitPriceFor(product: Product, mode: SellMode): number {
  return mode === "box" ? product.boxPrice : product.price;
}

/**
 * How many units of `mode` the customer may add, based on available stock.
 * Boxes are capped by `stock.boxes`, derived from pieces when the API omits it.
 */
export function maxQuantityFor(product: Product, mode: SellMode): number {
  if (mode === "box") {
    const boxes = product.stock.boxes;
    if (boxes > 0) return Math.floor(boxes);
    if (product.piecesPerBox > 0) return Math.floor(product.stock.qty / product.piecesPerBox);
    return 0;
  }
  return Math.floor(product.stock.qty);
}

export function isOutOfStock(product: Product): boolean {
  return product.stock.status === "out_of_stock" || maxQuantityFor(product, "piece") <= 0;
}
