/**
 * Age-restricted products (cigarettes, alcohol, …).
 *
 * The POS API has no age-restriction flag, so restriction is configuration
 * driven and **off by default**. This module is the single place that decides
 * what counts as restricted — if the API gains a flag later, only
 * `lib/domain/age.ts` and this file change.
 *
 * Note on matching: the API's product payload exposes `category: { id, name }`
 * but **no category slug**, so categories are matched by id or name rather than
 * slug. Names are compared case-insensitively.
 */

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseIds(value: string | undefined): number[] {
  return parseList(value)
    .map((item) => Number.parseInt(item, 10))
    .filter((item) => Number.isInteger(item) && item > 0);
}

export interface AgeRestrictionConfig {
  enabled: boolean;
  productIds: readonly number[];
  categoryIds: readonly number[];
  categoryNamesLower: readonly string[];
  skuPrefixesUpper: readonly string[];
}

export const ageRestrictionConfig: AgeRestrictionConfig = {
  enabled: process.env.AGE_RESTRICTION_ENABLED === "true",
  productIds: parseIds(process.env.AGE_RESTRICTED_PRODUCT_IDS),
  categoryIds: parseIds(process.env.AGE_RESTRICTED_CATEGORY_IDS),
  categoryNamesLower: parseList(process.env.AGE_RESTRICTED_CATEGORY_NAMES).map((name) =>
    name.toLowerCase(),
  ),
  skuPrefixesUpper: parseList(process.env.AGE_RESTRICTED_SKU_PREFIXES).map((prefix) =>
    prefix.toUpperCase(),
  ),
};
