import { describe, expect, it } from "vitest";

import {
  CHECKOUT_MESSAGE_KEYS,
  checkoutFieldErrors,
  checkoutSchema,
  composeOrderNote,
  parseCheckoutLines,
} from "@/lib/validation/checkout";

const validFields = {
  fullName: "Maria Silva",
  phone: "+351 912 345 678",
  email: "maria@example.com",
  fulfilment: "delivery" as const,
  address: "Rua Example 1, 1200-000 Lisboa",
  note: "",
  paymentMethod: "cash" as const,
};

describe("checkout schema", () => {
  it("accepts a complete, valid submission", () => {
    expect(checkoutSchema.safeParse(validFields).success).toBe(true);
  });

  it("requires a name and reports it as an i18n key, not a sentence", () => {
    const result = checkoutSchema.safeParse({ ...validFields, fullName: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(CHECKOUT_MESSAGE_KEYS.required);
    }
  });

  it("treats email as optional but validates it when present", () => {
    expect(checkoutSchema.safeParse({ ...validFields, email: "" }).success).toBe(true);

    const bad = checkoutSchema.safeParse({ ...validFields, email: "not-an-email" });
    expect(bad.success).toBe(false);
  });

  it("rejects an unknown payment method", () => {
    const result = checkoutSchema.safeParse({ ...validFields, paymentMethod: "bitcoin" });
    expect(result.success).toBe(false);
  });

  it("trims input before validating", () => {
    expect(checkoutSchema.safeParse({ ...validFields, fullName: "   Maria   " }).success).toBe(
      true,
    );
    expect(checkoutSchema.safeParse({ ...validFields, fullName: "   " }).success).toBe(false);
  });
});

describe("cross-field rules", () => {
  it("requires a usable phone number", () => {
    const errors = checkoutFieldErrors({ ...validFields, phone: "abc" });
    expect(errors.phone).toBe(CHECKOUT_MESSAGE_KEYS.invalidPhone);
  });

  it("accepts phone numbers with separators and a country code", () => {
    expect(checkoutFieldErrors({ ...validFields, phone: "(912) 345-678" })).toEqual({});
  });

  it("requires an address only for delivery", () => {
    expect(checkoutFieldErrors({ ...validFields, address: "" }).address).toBe(
      CHECKOUT_MESSAGE_KEYS.required,
    );
    expect(checkoutFieldErrors({ ...validFields, fulfilment: "pickup", address: "" })).toEqual({});
  });
});

describe("checkout line parsing", () => {
  it("parses the lines the cart submits", () => {
    const lines = parseCheckoutLines(
      JSON.stringify([
        { productId: 5, quantity: 2, sellMode: "piece" },
        { productId: 8, quantity: 1, sellMode: "box" },
      ]),
    );

    expect(lines).toEqual([
      { productId: 5, quantity: 2, sellMode: "piece" },
      { productId: 8, quantity: 1, sellMode: "box" },
    ]);
  });

  it("rejects anything that is not a positive integer", () => {
    const lines = parseCheckoutLines(
      JSON.stringify([
        { productId: -1, quantity: 2, sellMode: "piece" },
        { productId: 5, quantity: 0, sellMode: "piece" },
        { productId: 5.5, quantity: 1, sellMode: "piece" },
        { productId: 6, quantity: 10_000, sellMode: "piece" },
        { productId: "7", quantity: 1, sellMode: "piece" },
      ]),
    );

    expect(lines).toEqual([{ productId: 7, quantity: 1, sellMode: "piece" }]);
  });

  it("de-duplicates a product added twice in the same sell mode", () => {
    const lines = parseCheckoutLines(
      JSON.stringify([
        { productId: 5, quantity: 2, sellMode: "piece" },
        { productId: 5, quantity: 3, sellMode: "piece" },
      ]),
    );

    expect(lines).toEqual([{ productId: 5, quantity: 2, sellMode: "piece" }]);
  });

  it("defaults an unknown sell mode to piece and survives junk input", () => {
    expect(
      parseCheckoutLines(JSON.stringify([{ productId: 5, quantity: 1, sellMode: "pallet" }])),
    ).toEqual([{ productId: 5, quantity: 1, sellMode: "piece" }]);

    expect(parseCheckoutLines("not json")).toEqual([]);
    expect(parseCheckoutLines(JSON.stringify({ nope: true }))).toEqual([]);
    expect(parseCheckoutLines(null)).toEqual([]);
  });
});

describe("order note composition", () => {
  it("records the fulfilment method, since the POS has no column for it", () => {
    const note = composeOrderNote({
      fulfilment: "delivery",
      address: "Rua Example 1",
      note: "",
    });

    expect(note).toBe("Delivery · Rua Example 1");
  });

  it("omits the address for pickup", () => {
    const note = composeOrderNote({ fulfilment: "pickup", address: "ignored", note: "Ring twice" });
    expect(note).toBe("Pickup · Ring twice");
  });

  it("caps the length so it cannot exceed the API's field", () => {
    const note = composeOrderNote({
      fulfilment: "delivery",
      address: "x".repeat(500),
      note: "y".repeat(800),
    });

    expect(note.length).toBeLessThanOrEqual(1000);
  });
});
