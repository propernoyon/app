import "server-only";

import { apiConfig, posRequest } from "./client";
import { mockProduct, mockProducts } from "./mock";
import { toProductList, toSingleProduct, type ProductListResult } from "./normalize";
import { getImageResolver } from "@/lib/images/resolve";
import { isPosApiError } from "./errors";
import type { Product } from "@/lib/domain/product";

/** Product data is mid-frequency: shorter than categories, longer than stock. */
export const PRODUCTS_CACHE_TAG = "products";
const PRODUCTS_REVALIDATE_SECONDS = 300;

export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 100;

export interface ProductQuery {
  /** Matches name, SKU or barcode server-side (the API's `q` parameter). */
  search?: string;
  categoryId?: number | null;
  page?: number;
  perPage?: number;
  /** Only products with stock available. */
  inStock?: boolean;
}

export function clampPerPage(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_PER_PAGE;
  return Math.min(MAX_PER_PAGE, Math.max(1, Math.floor(value)));
}

export async function listProducts(query: ProductQuery = {}): Promise<ProductListResult> {
  const perPage = clampPerPage(query.perPage);
  const resolveImage = await getImageResolver();

  if (apiConfig.useMock) {
    const payload = await mockProducts({
      q: query.search,
      categoryId: query.categoryId ?? undefined,
      inStock: query.inStock,
      page: query.page,
      perPage,
    });
    return toProductList(payload, resolveImage, perPage);
  }

  const payload = await posRequest<unknown>("/products", {
    query: {
      q: query.search,
      category_id: query.categoryId ?? undefined,
      in_stock: query.inStock ? 1 : undefined,
      page: query.page,
      per_page: perPage,
    },
    revalidate: PRODUCTS_REVALIDATE_SECONDS,
    tags: [PRODUCTS_CACHE_TAG],
  });

  return toProductList(payload, resolveImage, perPage);
}

/**
 * Single product. A 404 means "no such product" and returns `null` so the page
 * can call `notFound()`; any other failure propagates so `error.tsx` can show a
 * retry state instead of a misleading 404.
 */
export async function getProduct(id: number): Promise<Product | null> {
  const resolveImage = await getImageResolver();

  try {
    const payload = apiConfig.useMock
      ? await mockProduct(id)
      : await posRequest<unknown>(`/products/${id}`, {
          revalidate: PRODUCTS_REVALIDATE_SECONDS,
          tags: [PRODUCTS_CACHE_TAG, `product:${id}`],
        });

    if (payload === null) return null;
    return toSingleProduct(payload, resolveImage);
  } catch (error) {
    if (isPosApiError(error) && error.kind === "not_found") return null;
    throw error;
  }
}

/** Featured/popular products for the home page — the API orders by name. */
export async function listFeaturedProducts(limit = 8): Promise<Product[]> {
  const { products } = await listProducts({ perPage: Math.min(limit, MAX_PER_PAGE) });
  return products.slice(0, limit);
}

/** Same-category products for the detail page, excluding the current product. */
export async function listRelatedProducts(
  product: { id: number; category: { id: number } | null },
  limit = 4,
): Promise<Product[]> {
  if (!product.category) return [];

  const { products } = await listProducts({
    categoryId: product.category.id,
    perPage: limit + 1,
  });

  return products.filter((item) => item.id !== product.id).slice(0, limit);
}
