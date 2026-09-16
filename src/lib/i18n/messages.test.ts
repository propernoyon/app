import { describe, expect, it } from "vitest";

import boundaryEn from "@/messages/boundary/en.json";
import boundaryPt from "@/messages/boundary/pt.json";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";

/** Flattens a nested message object into the set of leaf key paths. */
function leafKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("dictionary completeness", () => {
  it("gives every English key a Portuguese translation and vice versa", () => {
    const enKeys = new Set(leafKeys(en));
    const ptKeys = new Set(leafKeys(pt));

    const missingInPt = [...enKeys].filter((key) => !ptKeys.has(key)).sort();
    const missingInEn = [...ptKeys].filter((key) => !enKeys.has(key)).sort();

    expect(missingInPt, `missing from pt.json: ${missingInPt.join(", ")}`).toEqual([]);
    expect(missingInEn, `missing from en.json: ${missingInEn.join(", ")}`).toEqual([]);
  });

  it("never leaves an empty string, which would render as a blank label", () => {
    const emptyInEn = leafKeys(en).filter((key) => {
      const value = key
        .split(".")
        .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)[part], en);
      return typeof value === "string" && value.trim() === "";
    });

    expect(emptyInEn).toEqual([]);
  });

  it("keeps placeholders identical across languages", () => {
    const placeholders = (template: string) =>
      [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

    const readPath = (source: unknown, key: string) =>
      key.split(".").reduce<unknown>((acc, part) => (acc as Record<string, unknown>)[part], source);

    const mismatched = leafKeys(en).filter((key) => {
      const enValue = readPath(en, key);
      const ptValue = readPath(pt, key);
      if (typeof enValue !== "string" || typeof ptValue !== "string") return false;
      return placeholders(enValue).join(",") !== placeholders(ptValue).join(",");
    });

    expect(mismatched).toEqual([]);
  });

  it("keeps the error-boundary catalogues in step too", () => {
    expect(new Set(leafKeys(boundaryEn))).toEqual(new Set(leafKeys(boundaryPt)));
  });
});
