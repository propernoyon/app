import { describe, expect, it } from "vitest";

import { lineTotal, round2, sumMoney } from "@/lib/domain/money";

describe("money", () => {
  it("rounds to two decimals", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });

  it("computes a line total the same way the POS does", () => {
    // The POS rounds each line: round(unitPrice * qty, 2).
    expect(lineTotal(1.99, 3)).toBe(5.97);
    expect(lineTotal(0.59, 12)).toBe(7.08);
    expect(lineTotal(22.9, 1)).toBe(22.9);
  });

  it("sums lines without accumulating floating point noise", () => {
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
    expect(sumMoney([lineTotal(1.99, 3), lineTotal(0.59, 12)])).toBe(13.05);
    expect(sumMoney([])).toBe(0);
  });
});
