import {
  rawCategorySchema,
  rawCreatedOrderSchema,
  rawLiveStockSchema,
  rawOrderSchema,
  rawPaginationSchema,
  rawProductSchema,
  rawSettingsSchema,
} from "./schemas";
import { apiImageResolver, type ImageResolver } from "@/lib/images/placeholder";
import { isAgeRestricted } from "@/lib/domain/age";
import { resolveCurrencyCode } from "@/lib/domain/currency";
import { slugify } from "@/lib/utils/slug";
import type { Category } from "@/lib/domain/category";
import type { CreatedOrder, Order, OrderLine } from "@/lib/domain/order";
import type { Product, SellType } from "@/lib/domain/product";
import { normalizeSellMode } from "@/lib/domain/product";
import { resolvePaymentStatus, resolveOrderStatus, resolveStockStatus } from "@/lib/domain/status";
import type { StockStatus } from "@/lib/domain/status";
import { publicEnv } from "@/config/env";

/* ────────────────────────────────────────────────────────────────────────────
 * The adapter layer.
 *
 * Everything that knows about the wire format lives here (plus `schemas.ts`),
 * so a change in the POS response is absorbed in one place and the rest of the
 * app only ever sees domain models. Parsing is deliberately tolerant:
 *  - envelopes are unwrapped from `{ success, products }`, `{ data }` or a bare array
 *  - list items are parsed individually, so one malformed product cannot blank a page
 * ──────────────────────────────────────────────────────────────────────────── */

export interface Pagination {
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export const EMPTY_PAGINATION: Pagination = { total: 0, page: 1, perPage: 20, pages: 0 };

function warn(message: string, detail?: unknown): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn(`[api] ${message}`, detail ?? "");
}

/** Finds the first array under any of `keys`, tolerating one level of nesting. */
export function extractArray(payload: unknown, keys: readonly string[]): unknown[] {
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of keys) {
      const value = record[key];
      if (Array.isArray(value)) return value;
    }
    const data = record.data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return extractArray(data, keys);
    }
  }

  return [];
}

/** Finds the first object under any of `keys`, distinguishing objects from arrays. */
export function extractObject(payload: unknown, keys: readonly string[]): unknown | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
  }

  return null;
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function toPagination(payload: unknown, fallbackPerPage = 20): Pagination {
  const raw = extractObject(payload, ["pagination"]);
  if (!raw) return { ...EMPTY_PAGINATION, perPage: fallbackPerPage };

  const parsed = rawPaginationSchema.safeParse(raw);
  const record = (parsed.success ? parsed.data : raw) as Record<string, unknown>;

  const perPage = readNumber(record, "per_page") ?? fallbackPerPage;
  const total = readNumber(record, "total") ?? 0;
  const page = readNumber(record, "page") ?? 1;
  const pages = readNumber(record, "pages") ?? (perPage > 0 ? Math.ceil(total / perPage) : 0);

  return {
    total,
    page: Math.max(1, page),
    perPage: perPage > 0 ? perPage : fallbackPerPage,
    pages: Math.max(0, pages),
  };
}

function normalizeSellType(raw: unknown): SellType {
  return raw === "piece" || raw === "box" || raw === "both" ? raw : "unknown";
}

/* ── Products ─────────────────────────────────────────────────────────────── */

export function toProduct(raw: unknown, resolveImage: ImageResolver): Product | null {
  const parsed = rawProductSchema.safeParse(raw);
  if (!parsed.success) {
    warn("skipping product that failed validation", parsed.error.issues.slice(0, 3));
    return null;
  }

  const item = parsed.data;
  const quantity = item.stock.qty;
  const lowAlert = item.stock.low_alert ?? 0;
  const apiImageUrl = item.image_url ?? null;

  const identity = {
    id: item.id,
    sku: item.sku ?? null,
    category: item.category
      ? { id: item.category.id, name: item.category.name, color: item.category.color ?? null }
      : null,
  };

  return {
    id: item.id,
    name: item.name,
    sku: identity.sku,
    barcode: item.barcode ?? null,
    description: item.description ?? null,
    category: identity.category,
    sellType: normalizeSellType(item.sell_type),
    saleUnit: item.sale_unit ?? null,
    purchaseUnit: item.purchase_unit ?? null,
    piecesPerBox: item.pcs_per_box && item.pcs_per_box > 0 ? item.pcs_per_box : 1,
    price: item.pricing.sale_price,
    boxPrice: item.pricing.sale_price_box ?? 0,
    taxPercent: item.pricing.tax_percent ?? 0,
    stock: {
      qty: quantity,
      boxes: item.stock.boxes ?? 0,
      pieces: item.stock.pieces ?? 0,
      lowAlert,
      status: resolveStockStatus(item.stock.status, quantity, lowAlert),
    },
    image: resolveImage(item.id, apiImageUrl),
    apiImageUrl,
    createdAt: item.created_at ?? null,
    updatedAt: item.updated_at ?? null,
    isAgeRestricted: isAgeRestricted(identity),
  };
}

export interface ProductListResult {
  products: Product[];
  pagination: Pagination;
}

export function toProductList(
  payload: unknown,
  resolveImage: ImageResolver = apiImageResolver(),
  fallbackPerPage = 20,
): ProductListResult {
  const items = extractArray(payload, ["products", "data", "items"]);

  const products: Product[] = [];
  for (const item of items) {
    const product = toProduct(item, resolveImage);
    if (product) products.push(product);
  }

  return { products, pagination: toPagination(payload, fallbackPerPage) };
}

export function toSingleProduct(
  payload: unknown,
  resolveImage: ImageResolver = apiImageResolver(),
): Product | null {
  const candidate = extractObject(payload, ["product", "data"]) ?? payload;
  return toProduct(candidate, resolveImage);
}

/* ── Categories ───────────────────────────────────────────────────────────── */

export function toCategory(raw: unknown): Category | null {
  const parsed = rawCategorySchema.safeParse(raw);
  if (!parsed.success) {
    warn("skipping category that failed validation", parsed.error.issues.slice(0, 3));
    return null;
  }

  const item = parsed.data;
  const slug = item.slug?.trim() ? slugify(item.slug) : slugify(item.name);

  if (!slug) {
    warn("skipping category with no derivable slug", { id: item.id, name: item.name });
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    color: item.color ?? null,
    icon: item.icon ?? null,
    slug,
    productCount: Math.max(0, item.product_count ?? 0),
  };
}

export function toCategoryList(payload: unknown): Category[] {
  const items = extractArray(payload, ["categories", "data", "items"]);

  const categories: Category[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const category = toCategory(item);
    if (category && !seen.has(category.slug)) {
      seen.add(category.slug);
      categories.push(category);
    }
  }

  return categories;
}

/* ── Stock ────────────────────────────────────────────────────────────────── */

export interface LiveStock {
  productId: number;
  productName: string;
  unit: string | null;
  qty: number;
  boxes: number;
  pieces: number;
  lowAlert: number;
  status: StockStatus;
  lastUpdated: string | null;
}

export function toLiveStock(payload: unknown): LiveStock | null {
  const candidate = extractObject(payload, ["stock", "data"]) ?? payload;
  const parsed = rawLiveStockSchema.safeParse(candidate);
  if (!parsed.success) return null;

  const item = parsed.data;
  const lowAlert = item.low_alert ?? 0;

  return {
    productId: item.product_id,
    productName: item.product_name ?? "",
    unit: item.unit ?? null,
    qty: item.qty,
    boxes: item.boxes ?? 0,
    pieces: item.pieces ?? 0,
    lowAlert,
    status: resolveStockStatus(item.status, item.qty, lowAlert),
    lastUpdated: item.last_updated ?? null,
  };
}

/* ── Orders ───────────────────────────────────────────────────────────────── */

export function toOrder(payload: unknown): Order | null {
  const candidate = extractObject(payload, ["order", "data"]) ?? payload;
  const parsed = rawOrderSchema.safeParse(candidate);
  if (!parsed.success) {
    warn("order payload failed validation", parsed.error.issues.slice(0, 3));
    return null;
  }

  const item = parsed.data;
  const rawStatus = item.status ?? "";

  const items: OrderLine[] = (item.items ?? []).map((line) => ({
    productId: line.product_id,
    productName: line.product_name ?? "",
    sku: line.sku ?? null,
    quantity: line.qty,
    sellMode: normalizeSellMode(line.sell_mode),
    unitPrice: line.unit_price ?? 0,
    total: line.total ?? 0,
  }));

  return {
    reference: item.ref_no,
    date: item.date ?? null,
    status: resolveOrderStatus(rawStatus),
    rawStatus,
    paymentStatus: resolvePaymentStatus(item.payment_status),
    paymentMethod: item.payment_method ?? "",
    grandTotal: item.grand_total ?? 0,
    note: item.note ?? null,
    source: item.source ?? null,
    customer: {
      name: item.customer?.name ?? "",
      phone: item.customer?.phone ?? "",
      email: item.customer?.email ?? "",
      address: item.customer?.address ?? "",
    },
    items,
  };
}

export function toCreatedOrder(payload: unknown): CreatedOrder | null {
  const parsed = rawCreatedOrderSchema.safeParse(payload);
  if (!parsed.success) {
    warn("order creation response failed validation", parsed.error.issues.slice(0, 3));
    return null;
  }

  return {
    reference: parsed.data.ref_no,
    grandTotal: parsed.data.grand_total ?? 0,
    itemsCount: parsed.data.items_count ?? 0,
  };
}

/* ── Settings ─────────────────────────────────────────────────────────────── */

export interface StoreSettings {
  appName: string;
  /** Symbol as configured in the POS, e.g. `€` or `৳`. */
  currencySymbol: string;
  /** ISO 4217 code derived from the symbol, for Intl formatting. */
  currencyCode: string;
}

export function toSettings(payload: unknown): StoreSettings {
  const candidate = extractObject(payload, ["settings", "data"]) ?? payload;
  const parsed = rawSettingsSchema.safeParse(candidate ?? {});
  const data = parsed.success ? parsed.data : {};

  const currencySymbol = data.currency?.trim() ?? "";

  return {
    appName: data.app_name?.trim() || publicEnv.storeName,
    currencySymbol,
    currencyCode: resolveCurrencyCode(currencySymbol, publicEnv.defaultCurrency),
  };
}
