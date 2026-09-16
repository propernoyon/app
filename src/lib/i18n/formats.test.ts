import { describe, expect, it } from "vitest";

import { formatDate, formatPercent, formatPrice, interpolate, pluralize } from "@/lib/i18n/formats";
import { negotiateLocale, HTML_LANG, isLocale } from "@/lib/i18n/config";
import {
  localeFromPathname,
  localePath,
  stripLocale,
  switchLocaleInPathname,
} from "@/lib/i18n/routes";
import { resolveCurrencyCode } from "@/lib/domain/currency";

describe("price formatting", () => {
  it("formats EUR with the conventions of each locale", () => {
    const en = formatPrice(2.49, "en", "EUR");
    const pt = formatPrice(2.49, "pt", "EUR");

    // Both must show the amount and the euro sign; the exact separator and
    // symbol placement are Intl's business, so assert loosely.
    expect(en).toContain("2");
    expect(en).toContain("49");
    expect(en).toContain("€");
    expect(pt).toContain("2");
    expect(pt).toContain("49");
    expect(pt).toContain("€");
  });

  it("always renders two decimals", () => {
    expect(formatPrice(3, "en", "EUR")).toContain("3");
    expect(formatPrice(3, "en", "EUR")).toMatch(/3[.,]00/);
  });

  it("degrades gracefully for an unusable currency code", () => {
    const result = formatPrice(5, "en", "NOT_A_CURRENCY");
    expect(result).toBe("5.00 NOT_A_CURRENCY");
  });

  it("treats non-finite input as zero rather than printing NaN", () => {
    expect(formatPrice(Number.NaN, "en", "EUR")).toMatch(/0[.,]00/);
  });
});

describe("number and percent formatting", () => {
  it("formats a fraction as a percentage", () => {
    expect(formatPercent(0.23, "en")).toContain("23");
  });
});

describe("date formatting", () => {
  it("formats an ISO string", () => {
    expect(formatDate("2026-02-03T14:40:00+00:00", "en")).toContain("2026");
  });

  it("returns an empty string for missing or invalid dates", () => {
    expect(formatDate(null, "en")).toBe("");
    expect(formatDate("not-a-date", "en")).toBe("");
  });
});

describe("interpolation", () => {
  it("substitutes named placeholders", () => {
    expect(interpolate("Only {count} available", { count: 3 })).toBe("Only 3 available");
  });

  it("leaves unknown placeholders intact", () => {
    expect(interpolate("Hello {name}", { other: 1 })).toBe("Hello {name}");
  });

  it("picks the singular form for exactly one", () => {
    expect(pluralize(1, "1 item", "{count} items")).toBe("1 item");
    expect(pluralize(0, "1 item", "{count} items")).toBe("0 items");
    expect(pluralize(5, "1 item", "{count} items")).toBe("5 items");
  });
});

describe("locale negotiation", () => {
  it("falls back to the default when nothing is sent", () => {
    expect(negotiateLocale(null)).toBe("en");
    expect(negotiateLocale("")).toBe("en");
  });

  it("matches a supported base language", () => {
    expect(negotiateLocale("pt")).toBe("pt");
    expect(negotiateLocale("en-GB,en;q=0.9")).toBe("en");
  });

  it("matches regional variants of a supported language", () => {
    expect(negotiateLocale("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt");
  });

  it("respects quality ordering", () => {
    expect(negotiateLocale("de;q=1,pt;q=0.9")).toBe("pt");
    expect(negotiateLocale("de-DE,fr;q=0.8")).toBe("en");
  });

  it("ignores a wildcard", () => {
    expect(negotiateLocale("*")).toBe("en");
  });
});

describe("locale routing", () => {
  it("prefixes paths", () => {
    expect(localePath("en", "/shop")).toBe("/en/shop");
    expect(localePath("pt", "/")).toBe("/pt");
    expect(localePath("pt", "shop")).toBe("/pt/shop");
  });

  it("extracts and strips the locale", () => {
    expect(localeFromPathname("/pt/shop")).toBe("pt");
    expect(localeFromPathname("/shop")).toBeNull();
    expect(stripLocale("/pt/shop")).toBe("/shop");
    expect(stripLocale("/en")).toBe("/");
  });

  it("switches the locale on the current path", () => {
    expect(switchLocaleInPathname("/en/shop", "pt")).toBe("/pt/shop");
    expect(switchLocaleInPathname("/pt", "en")).toBe("/en");
  });

  it("validates locale values", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("maps locales to html lang attributes", () => {
    expect(HTML_LANG.en).toBe("en");
    expect(HTML_LANG.pt).toBe("pt-PT");
  });
});

describe("currency symbol mapping", () => {
  it("maps the symbols the POS can return", () => {
    expect(resolveCurrencyCode("€", "EUR")).toBe("EUR");
    expect(resolveCurrencyCode("৳", "EUR")).toBe("BDT");
    expect(resolveCurrencyCode("$", "EUR")).toBe("USD");
    expect(resolveCurrencyCode("£", "EUR")).toBe("GBP");
  });

  it("accepts a three-letter code and falls back otherwise", () => {
    expect(resolveCurrencyCode("brl", "EUR")).toBe("BRL");
    expect(resolveCurrencyCode("??", "eur")).toBe("EUR");
    expect(resolveCurrencyCode(null, "GBP")).toBe("GBP");
  });
});
