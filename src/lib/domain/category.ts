export interface Category {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  slug: string;
  /** Number of active products, supplied by the API. */
  productCount: number;
}

export interface CategoryList {
  categories: Category[];
  total: number;
}

/** Finds a category by slug — the API exposes a list endpoint only. */
export function findCategoryBySlug(categories: readonly Category[], slug: string): Category | null {
  const normalized = slug.trim().toLowerCase();
  return categories.find((category) => category.slug.toLowerCase() === normalized) ?? null;
}

/**
 * Returns a usable category color. Only 6-digit hex values are trusted; anything
 * else (or a missing value) falls back to the brand blue so a malformed value
 * can never produce an invisible or invalid UI.
 */
export function safeCategoryColor(color: string | null | undefined): string {
  if (typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color.trim())) {
    return color.trim();
  }
  return "#516393";
}
