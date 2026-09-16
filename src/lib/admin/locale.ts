import "server-only";

import { cookies } from "next/headers";

import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Locale for the admin area.
 *
 * `/admin` deliberately sits outside `[locale]` (it is an internal tool, not a
 * customer route), so it reads the visitor's language from the same cookie the
 * storefront's language switcher writes.
 */
export async function getAdminContext(): Promise<{ locale: Locale; dict: Dictionary }> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(value) ? value : defaultLocale;

  return { locale, dict: await getDictionary(locale) };
}
