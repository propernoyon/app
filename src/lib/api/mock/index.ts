import { publicEnv } from "@/config/env";
import { MOCK_CATEGORIES, MOCK_PRODUCTS, type WireProduct } from "./data";
import type { CreateOrderInput } from "@/lib/domain/order";
import { lineTotal, sumMoney } from "@/lib/domain/money";

/* ────────────────────────────────────────────────────────────────────────────
 * Mock API.
 *
 * Mirrors the POS endpoints closely enough that the UI behaves the same:
 * name-ascending sort, `q`/`category_id`/`in_stock` filters, `per_page` capped at
 * 100, and the same response envelopes. Returns *wire-shaped* payloads so the
 * real normalizers run in mock mode too.
 * ──────────────────────────────────────────────────────────────────────────── */

const MAX_PER_PAGE = 100;
const ORDER_DEMO_PREFIX = "MATC-";

/** Orders created during this server process, so tracking works end to end. */
const sessionOrders = new Map<string, Record<string, unknown>>();

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  BDT: "৳",
  INR: "₹",
};

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 40));
}

export interface MockProductQuery {
  q?: string;
  categoryId?: number;
  inStock?: boolean;
  page?: number;
  perPage?: number;
}

function filterProducts(query: MockProductQuery): WireProduct[] {
  const search = query.q?.trim().toLowerCase() ?? "";

  const matches = MOCK_PRODUCTS.filter((product) => {
    if (query.categoryId && product.category?.id !== query.categoryId) return false;
    if (query.inStock && product.stock.qty <= 0) return false;
    if (!search) return true;

    const haystack = [product.name, product.sku ?? "", product.barcode ?? ""]
      .join(" ")
      .toLowerCase();
    return haystack.includes(search);
  });

  // The API always orders by name ascending.
  return matches.sort((a, b) => a.name.localeCompare(b.name));
}

export async function mockProducts(query: MockProductQuery): Promise<unknown> {
  await delay();

  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, query.perPage ?? 20));
  const filtered = filterProducts(query);
  const total = filtered.length;
  const pages = Math.ceil(total / perPage);
  const page = Math.min(Math.max(1, query.page ?? 1), Math.max(1, pages));
  const offset = (page - 1) * perPage;

  return {
    success: true,
    products: filtered.slice(offset, offset + perPage),
    pagination: { total, page, per_page: perPage, pages },
  };
}

export async function mockProduct(id: number): Promise<unknown | null> {
  await delay();
  // The API 404s unknown/inactive products. An out-of-stock product still
  // resolves, so the detail page can show its "out of stock" state.
  const product = MOCK_PRODUCTS.find((item) => item.id === id);
  if (!product) return null;
  return { success: true, product };
}

export async function mockCategories(): Promise<unknown> {
  await delay();
  return { success: true, categories: MOCK_CATEGORIES, total: MOCK_CATEGORIES.length };
}

export async function mockStock(productId: number): Promise<unknown | null> {
  await delay();
  const product = MOCK_PRODUCTS.find((item) => item.id === productId);
  if (!product) return null;

  return {
    success: true,
    product_id: product.id,
    product_name: product.name,
    unit: product.sale_unit,
    qty: product.stock.qty,
    boxes: product.stock.boxes,
    pieces: product.stock.pieces,
    low_alert: product.stock.low_alert,
    status: product.stock.status,
    last_updated: new Date().toISOString(),
  };
}

export async function mockSettings(): Promise<unknown> {
  return {
    success: true,
    settings: {
      app_name: publicEnv.storeName,
      currency: CURRENCY_SYMBOL[publicEnv.defaultCurrency] ?? publicEnv.defaultCurrency,
    },
  };
}

export async function mockCreateOrder(input: CreateOrderInput): Promise<unknown> {
  await delay();

  const items = input.items.map((line) => {
    const product = MOCK_PRODUCTS.find((item) => item.id === line.productId);
    const unitPrice =
      line.sellMode === "box"
        ? (product?.pricing.sale_price_box ?? 0)
        : (product?.pricing.sale_price ?? 0);

    return {
      product_id: line.productId,
      product_name: product?.name ?? `Product #${line.productId}`,
      sku: product?.sku ?? null,
      qty: line.quantity,
      sell_mode: line.sellMode,
      unit_price: unitPrice,
      total: lineTotal(unitPrice, line.quantity),
    };
  });

  const reference = `${ORDER_DEMO_PREFIX}${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(
    Math.random() * 900 + 100,
  )}`;
  const grandTotal = sumMoney(items.map((item) => item.total));
  const timestamp = new Date().toISOString();

  sessionOrders.set(reference, {
    ref_no: reference,
    date: timestamp,
    status: "pending",
    payment_status: "due",
    payment_method: input.paymentMethod,
    grand_total: grandTotal,
    note: input.note ?? null,
    source: "mock",
    customer: {
      name: input.customer.name,
      phone: input.customer.phone,
      email: input.customer.email,
      address: input.customer.address,
    },
    items,
  });

  return {
    success: true,
    message: "Order submitted successfully. (mock)",
    ref_no: reference,
    grand_total: grandTotal,
    items_count: items.length,
  };
}

export async function mockOrder(reference: string): Promise<unknown | null> {
  await delay();

  const existing = sessionOrders.get(reference);
  if (existing) return { success: true, order: existing };

  // Any well-formed reference resolves so order tracking can be demonstrated
  // without a live POS. Real references always start with a status prefix.
  if (!reference.toUpperCase().startsWith(ORDER_DEMO_PREFIX)) {
    return null;
  }

  return {
    success: true,
    order: {
      ref_no: reference.toUpperCase(),
      date: new Date(Date.now() - 86_400_000).toISOString(),
      status: "processing",
      payment_status: "due",
      payment_method: "cash",
      grand_total: 32.96,
      note: "Deliver after 18:00. (mock sample)",
      source: "mock",
      customer: {
        name: "Sample Customer",
        phone: "+351 900 000 000",
        email: "sample@example.com",
        address: "Rua Example 1, Lisboa",
      },
      items: [
        {
          product_id: 1,
          product_name: "Bananas",
          sku: "FRU-001",
          qty: 2,
          sell_mode: "piece",
          unit_price: 1.49,
          total: 2.98,
        },
        {
          product_id: 9,
          product_name: "Still Water 1.5L",
          sku: "WTR-001",
          qty: 12,
          sell_mode: "piece",
          unit_price: 0.59,
          total: 7.08,
        },
        {
          product_id: 21,
          product_name: "Washing Liquid 2L",
          sku: "HOU-001",
          qty: 1,
          sell_mode: "box",
          unit_price: 22.9,
          total: 22.9,
        },
      ],
    },
  };
}
