import { describe, expect, it } from "vitest";

import {
  ORDER_TIMELINE,
  orderStatusStep,
  resolveOrderStatus,
  resolvePaymentStatus,
  resolveStockStatus,
} from "@/lib/domain/status";

describe("stock status", () => {
  it("trusts a known status from the API", () => {
    expect(resolveStockStatus("in_stock", 0, 0)).toBe("in_stock");
    expect(resolveStockStatus("low_stock", 100, 0)).toBe("low_stock");
    expect(resolveStockStatus("out_of_stock", 100, 0)).toBe("out_of_stock");
  });

  it("derives the status from quantities when the API omits it", () => {
    expect(resolveStockStatus(undefined, 0, 5)).toBe("out_of_stock");
    expect(resolveStockStatus(undefined, 3, 5)).toBe("low_stock");
    expect(resolveStockStatus(undefined, 50, 5)).toBe("in_stock");
    // No low-stock threshold configured means anything in stock is "in stock".
    expect(resolveStockStatus(undefined, 1, 0)).toBe("in_stock");
  });

  it("degrades to unknown rather than guessing", () => {
    expect(resolveStockStatus("discontinued", Number.NaN, 0)).toBe("unknown");
    expect(resolveStockStatus(null, Number.NaN, 0)).toBe("unknown");
  });
});

describe("order status", () => {
  it("maps the statuses the POS actually writes today", () => {
    expect(resolveOrderStatus("pending")).toBe("pending");
    expect(resolveOrderStatus("processing")).toBe("processing");
    expect(resolveOrderStatus("shipped")).toBe("shipped");
    expect(resolveOrderStatus("completed")).toBe("completed");
  });

  it("treats the POS 'void' status as cancelled", () => {
    expect(resolveOrderStatus("void")).toBe("cancelled");
    expect(resolveOrderStatus("cancelled")).toBe("cancelled");
  });

  it("normalises case and whitespace", () => {
    expect(resolveOrderStatus("  Pending ")).toBe("pending");
  });

  it("never throws on an unrecognised future status", () => {
    expect(resolveOrderStatus("awaiting_courier")).toBe("unknown");
    expect(resolveOrderStatus(undefined)).toBe("unknown");
    expect(resolveOrderStatus(42)).toBe("unknown");
  });

  it("places statuses on the timeline, and off it when they cannot progress", () => {
    expect(orderStatusStep("pending")).toBe(0);
    expect(orderStatusStep("completed")).toBe(ORDER_TIMELINE.length - 1);
    expect(orderStatusStep("cancelled")).toBe(-1);
    expect(orderStatusStep("unknown")).toBe(-1);
  });
});

describe("payment status", () => {
  it("accepts both the POS and the API spellings", () => {
    expect(resolvePaymentStatus("paid")).toBe("paid");
    expect(resolvePaymentStatus("due")).toBe("due");
    expect(resolvePaymentStatus("unpaid")).toBe("unpaid");
    expect(resolvePaymentStatus("weird")).toBe("unknown");
  });
});
