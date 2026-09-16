import { publicEnv } from "@/config/env";
import type { ResolvedImage } from "@/lib/domain/product";

/** Branded fallback shown whenever a product has no usable image. */
export const PLACEHOLDER_PRODUCT_IMAGE = "/images/placeholder-product.svg";

/**
 * Resolves the raw `image_url` from the API into something `next/image` can use.
 *
 * The POS stores absolute Cloudinary URLs, so the common case is a pass-through.
 * Legacy installs may store a bare filename; those are joined with
 * `NEXT_PUBLIC_IMAGE_BASE_URL` when configured, and otherwise reported as `null`
 * so the caller falls back to the placeholder instead of rendering a broken link.
 */
export function resolveApiImageUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;

  const value = raw.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return value;

  const base = publicEnv.imageBaseUrl.replace(/\/+$/, "");
  if (base) return `${base}/${value.replace(/^\/+/, "")}`;

  return null;
}

export type ImageResolver = (productId: number, apiImageUrl: string | null) => ResolvedImage;

/**
 * Default resolver: the API image when there is one, otherwise the placeholder.
 * The admin-upload override is layered on top of this in `lib/images/resolve.ts`.
 */
export function apiImageResolver(): ImageResolver {
  return (_productId, apiImageUrl) => {
    const url = resolveApiImageUrl(apiImageUrl);
    return url ? { url, source: "api" } : { url: PLACEHOLDER_PRODUCT_IMAGE, source: "placeholder" };
  };
}
