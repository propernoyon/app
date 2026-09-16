import { describe, expect, it } from "vitest";

import { DEFAULT_PRODUCT_SORT, parseProductSort, sortProducts } from "@/lib/domain/product-sort";
import { canSellByBox, maxQuantityFor, unitPriceFor, type Product } from "@/lib/domain/product";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: "Bananas",
    sku: "FRU-001",
    barcode: null,
    description: null,
    category: { id: 1, name: "Fruits", color: null },
    sellType: "piece",
    saleUnit: "kg",
    purchaseUnit: null,
    piecesPerBox: 1,
    price: 1.49,
    boxPrice: 0,
    taxPercent: 0,
    stock: { qty: 10, boxes: 10, pieces: 10, lowAlert: 2, status: "in_stock" },
    image: { url: "/images/placeholder-product.svg", source: "placeholder" },
    apiImageUrl: null,
    createdAt: null,
    updatedAt: null,
    isAgeRestricted: false,
    ...overrides,
  };
}

describe("product sorting", () => {
  it("falls back to the default for unknown input", () => {
    expect(parseProductSort("nonsense")).toBe(DEFAULT_PRODUCT_SORT);
    expect(parseProductSort(undefined)).toBe(DEFAULT_PRODUCT_SORT);
    expect(parseProductSort("priceDesc")).toBe("priceDesc");
  });

  it("sorts by name in both directions", () => {
    const items = [
      makeProduct({ id: 1, name: "Bananas" }),
      makeProduct({ id: 2, name: "Apples" }),
      makeProduct({ id: 3, name: "Oranges" }),
    ];

    expect(sortProducts(items, "nameAsc").map((p) => p.name)).toEqual([
      "Apples",
      "Bananas",
      "Oranges",
    ]);
    expect(sortProducts(items, "nameDesc").map((p) => p.name)).toEqual([
      "Oranges",
      "Bananas",
      "Apples",
    ]);
  });

  it("sorts by price without mutating the input", () => {
    const items = [makeProduct({ id: 1, price: 3 }), makeProduct({ id: 2, price: 1 })];

    expect(sortProducts(items, "priceAsc").map((p) => p.price)).toEqual([1, 3]);
    expect(sortProducts(items, "priceDesc").map((p) => p.price)).toEqual([3, 1]);
    expect(items.map((p) => p.price)).toEqual([3, 1]);
  });
});

describe("sell modes and stock caps", () => {
  it("only sells by box when the product is box-priced", () => {
    const pieceOnly = makeProduct();
    expect(canSellByBox(pieceOnly)).toBe(false);

    const both = makeProduct({ sellType: "both", boxPrice: 16.9, piecesPerBox: 24 });
    expect(canSellByBox(both)).toBe(true);
    expect(unitPriceFor(both, "piece")).toBe(1.49);
    expect(unitPriceFor(both, "box")).toBe(16.9);
  });

  it("caps box quantities by available boxes, or derives them from pieces", () => {
    const withBoxes = makeProduct({
      sellType: "both",
      boxPrice: 16.9,
      piecesPerBox: 12,
      stock: { qty: 36, boxes: 3, pieces: 36, lowAlert: 6, status: "in_stock" },
    });
    expect(maxQuantityFor(withBoxes, "box")).toBe(3);
    expect(maxQuantityFor(withBoxes, "piece")).toBe(36);

    // The API omits `boxes` sometimes — derive from pieces per box.
    const derived = makeProduct({
      sellType: "both",
      boxPrice: 16.9,
      piecesPerBox: 12,
      stock: { qty: 30, boxes: 0, pieces: 30, lowAlert: 6, status: "in_stock" },
    });
    expect(maxQuantityFor(derived, "box")).toBe(2);
  });

  it("never reports a negative cap", () => {
    const empty = makeProduct({
      stock: { qty: 0, boxes: 0, pieces: 0, lowAlert: 2, status: "out_of_stock" },
    });
    expect(maxQuantityFor(empty, "piece")).toBe(0);
    expect(maxQuantityFor(empty, "box")).toBe(0);
  });
});
