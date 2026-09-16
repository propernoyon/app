import { describe, expect, it } from "vitest";

import { CART_VERSION, EMPTY_CART, type CartLine } from "@/lib/domain/cart";
import {
  CART_STORAGE_KEY,
  parseCartState,
  readCartState,
  writeCartState,
} from "@/lib/cart/storage";

const validLine: CartLine = {
  productId: 3,
  name: "Ground Coffee 250g",
  sku: "COF-001",
  sellMode: "piece",
  unitPrice: 4.99,
  quantity: 2,
  imageUrl: "/api/images/3/abc123",
  imageSource: "uploaded",
  maxQuantity: 24,
  isAgeRestricted: false,
};

describe("cart persistence", () => {
  it("round-trips a valid cart", () => {
    const parsed = parseCartState({ version: CART_VERSION, lines: [validLine] });
    expect(parsed.lines).toEqual([validLine]);
  });

  it("discards a payload written by an older cart version", () => {
    expect(parseCartState({ version: CART_VERSION + 1, lines: [validLine] })).toEqual({
      lines: [],
      version: CART_VERSION,
    });
  });

  it("drops individual lines that fail validation", () => {
    const parsed = parseCartState({
      version: CART_VERSION,
      lines: [
        validLine,
        { productId: "3", quantity: 1 }, // id must be a number
        { productId: 4, quantity: -1, name: "Bad", unitPrice: 1 }, // quantity must be positive
        { productId: 5, quantity: 1, name: "", unitPrice: 1 }, // name must not be empty
        { productId: 6, quantity: 1, name: "No price" }, // price required
        null,
      ],
    });

    expect(parsed.lines).toHaveLength(1);
    expect(parsed.lines[0].productId).toBe(3);
  });

  it("normalises a corrupted sell mode and image source", () => {
    const parsed = parseCartState({
      version: CART_VERSION,
      lines: [{ ...validLine, sellMode: "pallet", imageSource: "evil" }],
    });

    expect(parsed.lines[0].sellMode).toBe("piece");
    expect(parsed.lines[0].imageSource).toBe("placeholder");
  });

  it("returns an empty cart for any unreadable payload", () => {
    expect(parseCartState(null)).toEqual(EMPTY_CART);
    expect(parseCartState("nope")).toEqual(EMPTY_CART);
    expect(parseCartState({ version: CART_VERSION, lines: "nope" })).toEqual({
      lines: [],
      version: CART_VERSION,
    });
  });

  it("survives a refresh through localStorage", () => {
    writeCartState({ version: CART_VERSION, lines: [validLine] });

    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toContain("Ground Coffee");

    const restored = readCartState();
    expect(restored.lines).toHaveLength(1);
    expect(restored.lines[0].quantity).toBe(2);
  });

  it("returns an empty cart when storage holds invalid JSON", () => {
    window.localStorage.setItem(CART_STORAGE_KEY, "{ this is not json");
    expect(readCartState()).toEqual(EMPTY_CART);
  });
});
