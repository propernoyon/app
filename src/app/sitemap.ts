import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/config/env";
import { listCategories } from "@/lib/api/categories";
import { MAX_PER_PAGE, listProducts } from "@/lib/api/products";
import { buildAlternates } from "@/lib/seo/metadata";
import { locales } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/routes";

/** The catalogue changes at the same cadence as the products themselves. */
export const revalidate = 3600;

/** Static routes that exist for every locale. */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/track-order", priority: 0.3, changeFrequency: "weekly" },
];

/**
 * Number of 100-product pages to include.
 *
 * Keeps sitemap generation bounded for very large catalogues. Beyond this,
 * segment the sitemap with `generateSitemaps` (see the Next.js docs) rather than
 * letting one file grow without limit.
 */
const MAX_PRODUCT_PAGES = 5;

async function collectProductIds(): Promise<{ id: number; updatedAt: string | null }[]> {
  const collected: { id: number; updatedAt: string | null }[] = [];

  for (let page = 1; page <= MAX_PRODUCT_PAGES; page += 1) {
    const result = await listProducts({ page, perPage: MAX_PER_PAGE });

    for (const product of result.products) {
      collected.push({ id: product.id, updatedAt: product.updatedAt });
    }

    if (page >= result.pagination.pages) break;
  }

  return collected;
}

/**
 * Sitemap covering both locales.
 *
 * Every entry is emitted once per locale with hreflang alternates, so search
 * engines index the language versions as translations of one another rather than
 * as duplicates. Customer-only routes (cart, checkout, order tracking, admin) are
 * excluded — they are `noindex`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  const [categories, products] = await Promise.all([
    listCategories().catch(() => []),
    collectProductIds().catch(() => []),
  ]);

  for (const locale of locales) {
    for (const route of STATIC_ROUTES) {
      entries.push({
        url: absoluteUrl(localePath(locale, route.path)),
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages: buildAlternates(locale, route.path).languages },
      });
    }

    for (const category of categories) {
      const path = `/category/${category.slug}`;
      entries.push({
        url: absoluteUrl(localePath(locale, path)),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages: buildAlternates(locale, path).languages },
      });
    }

    for (const product of products) {
      const path = `/product/${product.id}`;
      entries.push({
        url: absoluteUrl(localePath(locale, path)),
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: { languages: buildAlternates(locale, path).languages },
      });
    }
  }

  return entries;
}
