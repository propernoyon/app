import type { Product } from "./product";

/**
 * Sorting options for the shop.
 *
 * Known limitation: the POS `GET /products` endpoint has **no sort parameter** —
 * it always returns rows ordered by name. Name ascending therefore matches the
 * API exactly, while the other options can only reorder the products *on the
 * current page*. (Fixing this properly means adding `ORDER BY` support to
 * `api/v1/products.php`; until then the limitation is shown to the customer
 * rather than hidden.)
 *
 * Sorting is applied locally rather than relying on the API's order, so the
 * behaviour does not depend on an undocumented server sort.
 */
export const PRODUCT_SORTS = ["nameAsc", "nameDesc", "priceAsc", "priceDesc"] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const DEFAULT_PRODUCT_SORT: ProductSort = "nameAsc";

export function parseProductSort(raw: unknown): ProductSort {
  return typeof raw === "string" && (PRODUCT_SORTS as readonly string[]).includes(raw)
    ? (raw as ProductSort)
    : DEFAULT_PRODUCT_SORT;
}

export function sortProducts(products: readonly Product[], sort: ProductSort): Product[] {
  const sorted = [...products];

  switch (sort) {
    case "nameAsc":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "nameDesc":
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "priceAsc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "priceDesc":
      sorted.sort((a, b) => b.price - a.price);
      break;
  }

  return sorted;
}
