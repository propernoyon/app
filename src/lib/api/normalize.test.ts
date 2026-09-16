import { describe, expect, it } from "vitest";

import {
  extractArray,
  extractObject,
  toCategoryList,
  toCreatedOrder,
  toLiveStock,
  toOrder,
  toProductList,
  toSettings,
  toSingleProduct,
} from "@/lib/api/normalize";
import type { ImageResolver } from "@/lib/images/placeholder";

const resolveImage: ImageResolver = () => ({
  url: "/images/placeholder-product.svg",
  source: "placeholder",
});

/** A payload shaped exactly like `api/v1/products.php` emits. */
function wireProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    name: "Orange Juice 1L",
    sku: "DRK-001",
    barcode: "590000000007",
    description: "Freshly squeezed.",
    category: { id: 2, name: "Drinks", color: "#2f7d4f" },
    sell_type: "both",
    sale_unit: "un",
    purchase_unit: "box",
    pcs_per_box: 12,
    pricing: { sale_price: 2.35, sale_price_box: 21.9, tax_percent: 6 },
    stock: { qty: 36, boxes: 3, pieces: 36, low_alert: 6, status: "in_stock" },
    image_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    created_at: "2026-01-12T09:15:00+00:00",
    updated_at: "2026-02-03T14:40:00+00:00",
    ...overrides,
  };
}

describe("envelope handling", () => {
  it("finds an array at the documented key", () => {
    expect(extractArray({ products: [1, 2] }, ["products"])).toEqual([1, 2]);
  });

  it("tolerates a bare array and a nested data wrapper", () => {
    expect(extractArray([1], ["products"])).toEqual([1]);
    expect(extractArray({ data: { products: [1] } }, ["products"])).toEqual([1]);
  });

  it("returns an empty array rather than throwing on unexpected shapes", () => {
    expect(extractArray({ nope: true }, ["products"])).toEqual([]);
    expect(extractArray(null, ["products"])).toEqual([]);
  });

  it("finds an object but never mistakes an array for one", () => {
    expect(extractObject({ product: { id: 1 } }, ["product"])).toEqual({ id: 1 });
    expect(extractObject({ product: [1] }, ["product"])).toBeNull();
  });
});

describe("product normalization", () => {
  it("maps the wire format onto the domain model", () => {
    const { products, pagination } = toProductList(
      {
        success: true,
        products: [wireProduct()],
        pagination: { total: 1, page: 1, per_page: 20, pages: 1 },
      },
      resolveImage,
    );

    expect(products).toHaveLength(1);
    const product = products[0];

    expect(product.id).toBe(7);
    expect(product.name).toBe("Orange Juice 1L");
    expect(product.price).toBe(2.35);
    expect(product.boxPrice).toBe(21.9);
    expect(product.taxPercent).toBe(6);
    expect(product.sellType).toBe("both");
    expect(product.piecesPerBox).toBe(12);
    expect(product.category).toEqual({ id: 2, name: "Drinks", color: "#2f7d4f" });
    expect(product.stock.status).toBe("in_stock");
    expect(pagination).toEqual({ total: 1, page: 1, perPage: 20, pages: 1 });
  });

  it("coerces numeric strings, which PHP emits for DECIMAL columns", () => {
    const { products } = toProductList(
      {
        products: [
          wireProduct({
            pricing: { sale_price: "2.35", sale_price_box: "21.90", tax_percent: "6" },
            stock: { qty: "36", boxes: "3", pieces: "36", low_alert: "6", status: "in_stock" },
          }),
        ],
      },
      resolveImage,
    );

    expect(products[0].price).toBe(2.35);
    expect(products[0].stock.qty).toBe(36);
  });

  it("skips a malformed product without dropping the rest of the page", () => {
    const { products } = toProductList(
      { products: [wireProduct(), { id: 9 }, wireProduct({ id: 8, name: "Apples" })] },
      resolveImage,
    );

    expect(products.map((product) => product.id)).toEqual([7, 8]);
  });

  it("derives a stock status when the API omits it", () => {
    const { products } = toProductList(
      {
        products: [
          wireProduct({ stock: { qty: 2, boxes: 0, pieces: 2, low_alert: 5, status: null } }),
        ],
      },
      resolveImage,
    );

    expect(products[0].stock.status).toBe("low_stock");
  });

  it("normalises an unknown sell type and a missing image", () => {
    const { products } = toProductList(
      { products: [wireProduct({ sell_type: "weird", image_url: null })] },
      resolveImage,
    );

    expect(products[0].sellType).toBe("unknown");
    expect(products[0].image.source).toBe("placeholder");
    expect(products[0].apiImageUrl).toBeNull();
  });

  it("computes pagination when the API omits a page count", () => {
    const { pagination } = toProductList(
      { products: [wireProduct()], pagination: { total: 45, page: 2, per_page: 20 } },
      resolveImage,
    );

    expect(pagination.pages).toBe(3);
  });

  it("reads a single product from its wrapper", () => {
    const product = toSingleProduct({ success: true, product: wireProduct() }, resolveImage);
    expect(product?.id).toBe(7);
  });

  it("returns null for an unreadable single product", () => {
    expect(toSingleProduct({ success: true, product: { id: 1 } }, resolveImage)).toBeNull();
    expect(toSingleProduct(null, resolveImage)).toBeNull();
  });
});

describe("category normalization", () => {
  it("maps the wire format and keeps the API's product count", () => {
    const categories = toCategoryList({
      categories: [
        {
          id: 1,
          name: "Fruits",
          description: "Fresh fruit",
          color: "#e0673f",
          icon: "apple",
          slug: "fruits",
          product_count: 5,
        },
      ],
      total: 1,
    });

    expect(categories).toEqual([
      {
        id: 1,
        name: "Fruits",
        description: "Fresh fruit",
        color: "#e0673f",
        icon: "apple",
        slug: "fruits",
        productCount: 5,
      },
    ]);
  });

  it("derives a slug when the POS left it empty", () => {
    const categories = toCategoryList({
      categories: [{ id: 3, name: "Soft Drinks", slug: "", product_count: 0 }],
    });

    expect(categories[0].slug).toBe("soft-drinks");
  });

  it("de-duplicates slugs so /category/[slug] stays unambiguous", () => {
    const categories = toCategoryList({
      categories: [
        { id: 1, name: "Fruits", slug: "fruits" },
        { id: 2, name: "Fruits", slug: "fruits" },
      ],
    });

    expect(categories).toHaveLength(1);
  });
});

describe("stock and order normalization", () => {
  it("maps the flat stock payload", () => {
    const stock = toLiveStock({
      success: true,
      product_id: 7,
      product_name: "Orange Juice",
      unit: "un",
      qty: 36,
      boxes: 3,
      pieces: 36,
      low_alert: 6,
      status: "in_stock",
      last_updated: "2026-02-03 14:40:00",
    });

    expect(stock?.productId).toBe(7);
    expect(stock?.status).toBe("in_stock");
    expect(stock?.qty).toBe(36);
  });

  it("maps an order and its lines, including unknown statuses", () => {
    const order = toOrder({
      success: true,
      order: {
        ref_no: "MATC-ABC1234567",
        date: "2026-02-03 14:40:00",
        status: "awaiting_courier",
        payment_status: "due",
        payment_method: "cash",
        grand_total: "32.96",
        note: "Delivery · Rua Example 1",
        customer: { name: "Maria", phone: "+351 900 000 000", email: "", address: "Rua 1" },
        items: [
          {
            product_id: 1,
            product_name: "Bananas",
            sku: "FRU-001",
            qty: 2,
            sell_mode: "piece",
            unit_price: "1.49",
            total: "2.98",
          },
        ],
      },
    });

    expect(order?.reference).toBe("MATC-ABC1234567");
    expect(order?.status).toBe("unknown");
    expect(order?.rawStatus).toBe("awaiting_courier");
    expect(order?.paymentStatus).toBe("due");
    expect(order?.grandTotal).toBe(32.96);
    expect(order?.items).toHaveLength(1);
    expect(order?.items[0].quantity).toBe(2);
    expect(order?.items[0].unitPrice).toBe(1.49);
  });

  it("reads the created-order reference from the POST response", () => {
    const created = toCreatedOrder({
      success: true,
      message: "Order submitted successfully.",
      ref_no: "MATC-ZZZ9999999",
      grand_total: 12.5,
      items_count: 2,
    });

    expect(created).toEqual({ reference: "MATC-ZZZ9999999", grandTotal: 12.5, itemsCount: 2 });
  });

  it("rejects a created-order response with no reference", () => {
    expect(toCreatedOrder({ success: true })).toBeNull();
  });
});

describe("settings normalization", () => {
  it("maps the POS currency symbol to an ISO code for Intl", () => {
    const settings = toSettings({
      success: true,
      settings: { app_name: "MATC POS", currency: "€" },
    });

    expect(settings.currencySymbol).toBe("€");
    expect(settings.currencyCode).toBe("EUR");
  });

  it("falls back to the configured default when no symbol is returned", () => {
    const settings = toSettings({ success: true, settings: {} });

    expect(settings.currencySymbol).toBe("");
    expect(settings.currencyCode).toBe("EUR");
  });
});
