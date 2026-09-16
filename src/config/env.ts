/**
 * Public (browser-safe) configuration.
 *
 * Only `NEXT_PUBLIC_*` values live here — Next inlines them at build time, so
 * they must be referenced as full literal expressions, never dynamically.
 * Anything secret belongs in `src/lib/api/client.ts`, which is server-only.
 */
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  storeName: process.env.NEXT_PUBLIC_STORE_NAME ?? "Mini Mercado",
  storeEmail: process.env.NEXT_PUBLIC_STORE_EMAIL ?? "",
  storePhone: process.env.NEXT_PUBLIC_STORE_PHONE ?? "",
  storeAddress: process.env.NEXT_PUBLIC_STORE_ADDRESS ?? "",
  openingHours: process.env.NEXT_PUBLIC_STORE_OPENING_HOURS ?? "",
  /** ISO 4217 fallback; the live symbol comes from the POS `/settings` endpoint. */
  defaultCurrency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "EUR",
  /** Base URL for legacy relative product image paths (usually empty). */
  imageBaseUrl: process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "",
} as const;

/** Absolute URL helper for canonical links, sitemaps and structured data. */
export function absoluteUrl(path = "/"): string {
  const base = publicEnv.siteUrl.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
