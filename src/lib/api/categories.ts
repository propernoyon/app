import "server-only";

import { apiConfig, posRequest } from "./client";
import { mockCategories } from "./mock";
import { toCategoryList } from "./normalize";
import { findCategoryBySlug, type Category } from "@/lib/domain/category";

/**
 * Categories change far less often than stock, so they get the longest cache.
 * Tagged `categories` so an admin or a deploy can revalidate them on demand.
 */
export const CATEGORIES_CACHE_TAG = "categories";
const CATEGORIES_REVALIDATE_SECONDS = 3600;

export async function listCategories(): Promise<Category[]> {
  const payload = apiConfig.useMock
    ? await mockCategories()
    : await posRequest<unknown>("/categories", {
        revalidate: CATEGORIES_REVALIDATE_SECONDS,
        tags: [CATEGORIES_CACHE_TAG],
      });

  return toCategoryList(payload);
}

/**
 * Resolves a category by slug. The API only exposes a list endpoint, so this
 * reads the (cached) list rather than making a second request per page view.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await listCategories();
  return findCategoryBySlug(categories, slug);
}
