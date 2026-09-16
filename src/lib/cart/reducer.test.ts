import { describe, expect, it } from "vitest";

import {
  cartItemCount,
  cartLineKey,
  cartLineTotal,
  cartSubtotal,
  hasAgeRestrictedLines,
  type CartLine,
} from "@/lib/domain/cart";
import { cartReducer } from "@/lib/cart/reducer";
import { EMPTY_CART, type CartState } from "@/lib/domain/cart";

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    productId: 1,
    name: "Bananas",
    sku: "FRU-001",
    sellMode: "piece",
    unitPrice: 1.49,
    quantity: 1,
    imageUrl: "/images/placeholder-product.svg",
    imageSource: "placeholder",
    maxQuantity: 10,
    isAgeRestricted: false,
    ...overrides,
  };
}

describe("cart calculations", () => {
  it("totals lines exactly like the POS does", () => {
    const lines = [line({ quantity: 3 }), line({ productId: 2, unitPrice: 0.59, quantity: 12 })];
    expect(cartLineTotal(lines[0])).toBe(4.47);
    expect(cartLineTotal(lines[1])).toBe(7.08);
    expect(cartSubtotal(lines)).toBe(11.55);
  });

  it("counts every unit, not every line", () => {
    expect(cartItemCount([line({ quantity: 3 }), line({ productId: 2, quantity: 2 })])).toBe(5);
    expect(cartItemCount([])).toBe(0);
  });

  it("keys piece and box lines of the same product separately", () => {
    expect(cartLineKey(7, "piece")).not.toBe(cartLineKey(7, "box"));
  });

  it("flags a basket containing age-restricted items", () => {
    expect(hasAgeRestrictedLines([line()])).toBe(false);
    expect(hasAgeRestrictedLines([line(), line({ productId: 2, isAgeRestricted: true })])).toBe(
      true,
    );
  });
});

describe("cart reducer", () => {
  it("adds a new line and increments an existing one", () => {
    const added = cartReducer(EMPTY_CART, { type: "add", line: line(), quantity: 2 });
    expect(added.lines).toHaveLength(1);
    expect(added.lines[0].quantity).toBe(2);

    const incremented = cartReducer(added, { type: "add", line: line(), quantity: 1 });
    expect(incremented.lines).toHaveLength(1);
    expect(incremented.lines[0].quantity).toBe(3);
  });

  it("treats box and piece of the same product as separate lines", () => {
    const state = cartReducer(EMPTY_CART, { type: "add", line: line(), quantity: 1 });
    const withBox = cartReducer(state, {
      type: "add",
      line: line({ sellMode: "box", unitPrice: 16.9 }),
      quantity: 1,
    });

    expect(withBox.lines).toHaveLength(2);
  });

  it("never exceeds the stock cap", () => {
    const capped = cartReducer(EMPTY_CART, { type: "add", line: line(), quantity: 99 });
    expect(capped.lines[0].quantity).toBe(10);

    const incremented = cartReducer(capped, { type: "increment", productId: 1, sellMode: "piece" });
    expect(incremented.lines[0].quantity).toBe(10);
  });

  it("refuses to add an unavailable product", () => {
    const unavailable = line({ maxQuantity: 0 });
    const state = cartReducer(EMPTY_CART, { type: "add", line: unavailable, quantity: 1 });
    expect(state.lines).toHaveLength(0);
  });

  it("removes a line when its quantity reaches zero", () => {
    const state = cartReducer(EMPTY_CART, { type: "add", line: line(), quantity: 1 });
    const decremented = cartReducer(state, {
      type: "decrement",
      productId: 1,
      sellMode: "piece",
    });

    expect(decremented.lines).toHaveLength(0);
  });

  it("never decrements below the minimum", () => {
    const state: CartState = { ...EMPTY_CART, lines: [line({ quantity: 2 })] };
    const once = cartReducer(state, { type: "decrement", productId: 1, sellMode: "piece" });
    const twice = cartReducer(once, { type: "decrement", productId: 1, sellMode: "piece" });

    expect(twice.lines).toHaveLength(0);
  });

  it("sets an explicit quantity and clamps it", () => {
    const state = cartReducer(EMPTY_CART, { type: "add", line: line(), quantity: 1 });
    const set = cartReducer(state, {
      type: "setQuantity",
      productId: 1,
      sellMode: "piece",
      quantity: 4,
    });
    expect(set.lines[0].quantity).toBe(4);

    const clamped = cartReducer(set, {
      type: "setQuantity",
      productId: 1,
      sellMode: "piece",
      quantity: 500,
    });
    expect(clamped.lines[0].quantity).toBe(10);
  });

  it("removes and clears lines", () => {
    const state = cartReducer(EMPTY_CART, { type: "add", line: line(), quantity: 1 });
    const withSecond = cartReducer(state, {
      type: "add",
      line: line({ productId: 2 }),
      quantity: 1,
    });

    expect(
      cartReducer(withSecond, { type: "remove", productId: 1, sellMode: "piece" }).lines,
    ).toHaveLength(1);
    expect(cartReducer(withSecond, { type: "clear" }).lines).toHaveLength(0);
  });

  it("reduces quantities when fresh stock is lower", () => {
    const state: CartState = {
      ...EMPTY_CART,
      lines: [line({ quantity: 5 }), line({ productId: 2, quantity: 4 })],
    };

    const clamped = cartReducer(state, {
      type: "clamp",
      limits: { "1:piece": 2, "2:piece": 3 },
    });

    expect(clamped.lines.map((item) => item.quantity)).toEqual([2, 3]);
    expect(clamped.lines[0].maxQuantity).toBe(2);
  });

  it("drops lines that clamping reduces to zero", () => {
    const state: CartState = { ...EMPTY_CART, lines: [line({ quantity: 4 })] };
    const clamped = cartReducer(state, { type: "clamp", limits: { "1:piece": 0 } });

    expect(clamped.lines).toHaveLength(0);
  });

  it("returns the same state object for an unknown action", () => {
    const state: CartState = { ...EMPTY_CART, lines: [line()] };
    // @ts-expect-error — deliberately exercising the default branch
    expect(cartReducer(state, { type: "nope" })).toBe(state);
  });
});
