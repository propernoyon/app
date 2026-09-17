const DEFAULT_SITE_URL = "http://localhost:3000";

/**
 * Normalises the canonical origin.
 *
 * `absoluteUrl()` feeds `new URL()` in `metadataBase`, and `new URL()` throws on
 * anything without a scheme — which would abort prerendering and fail the whole
 * build over a single environment-variable typo. A bare host is therefore given
 * `https://`, and anything still unparseable falls back to the default with a
 * loud warning rather than taking the deploy down.
 */
function normalizeSiteUrl(value: string | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return DEFAULT_SITE_URL;

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(candidate).origin;
  } catch {
    console.warn(
      `[env] NEXT_PUBLIC_SITE_URL is not a valid URL ("${raw}") — falling back to ${DEFAULT_SITE_URL}. Canonical links, robots.txt, sitemap.xml and JSON-LD will point at the wrong origin.`,
    );
    return DEFAULT_SITE_URL;
  }
}

/**
 * Public (browser-safe) configuration.
 *
 * Only `NEXT_PUBLIC_*` values live here — Next inlines them at build time, so
 * they must be referenced as full literal expressions, never dynamically.
 * Anything secret belongs in `src/lib/api/client.ts`, which is server-only.
 */
export const publicEnv = {
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
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
