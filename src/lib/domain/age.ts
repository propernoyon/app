import { ageRestrictionConfig as config } from "@/config/age-restriction";

export interface AgeRestrictionSubject {
  id: number;
  sku: string | null;
  category: { id: number; name: string } | null;
}

/**
 * Whether a product needs the age-confirmation gate.
 *
 * Returns `false` unless restriction is explicitly enabled, so the storefront
 * behaves exactly as before until the store opts in.
 */
export function isAgeRestricted(product: AgeRestrictionSubject): boolean {
  if (!config.enabled) return false;

  if (config.productIds.includes(product.id)) return true;

  if (product.category) {
    if (config.categoryIds.includes(product.category.id)) return true;
    if (config.categoryNamesLower.includes(product.category.name.toLowerCase())) return true;
  }

  if (product.sku) {
    const sku = product.sku.toUpperCase();
    if (config.skuPrefixesUpper.some((prefix) => sku.startsWith(prefix))) return true;
  }

  return false;
}
