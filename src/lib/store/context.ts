import "server-only";

import { cache } from "react";
import { locale as rootLocale } from "next/root-params";

import { getStoreSettings } from "@/lib/api/settings";
import { publicEnv } from "@/config/env";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { formatPrice } from "@/lib/i18n/formats";
import { localePath } from "@/lib/i18n/routes";

/**
 * Everything a server-rendered screen needs: locale, translations, currency and
 * a locale-aware link builder.
 *
 * `cache()` dedupes the work across a single render pass, so a page, its layout
 * and nested components can all call this without extra requests. Because it
 * reads the `[locale]` root parameter it works in any Server Component — but not
 * in Server Actions or Route Handlers, which must receive the locale explicitly.
 */
export interface StoreContext {
  locale: Locale;
  dict: Dictionary;
  currencyCode: string;
  /** Currency symbol as configured in the POS; empty when it isn't available. */
  currencySymbol: string;
  /** Formats an amount using the store's locale and currency. */
  price: (amount: number) => string;
  /** Builds a locale-prefixed, app-relative URL. */
  href: (path?: string) => string;
}

export const getStoreContext = cache(async (): Promise<StoreContext> => {
  const rawLocale = await rootLocale();
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  // Settings only supply the display currency and app name. If the POS is
  // unreachable the storefront still renders, using the configured fallback.
  const settings = await getStoreSettings().catch(() => null);

  const dict = await getDictionary(locale);
  const currencyCode = settings?.currencyCode ?? publicEnv.defaultCurrency;

  return {
    locale,
    dict,
    currencyCode,
    currencySymbol: settings?.currencySymbol ?? "",
    price: (amount: number) => formatPrice(amount, locale, currencyCode),
    href: (path = "/") => localePath(locale, path),
  };
});
