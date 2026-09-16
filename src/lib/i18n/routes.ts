import { defaultLocale, isLocale, locales, type Locale } from "./config";

/**
 * Locale-aware path helpers.
 *
 * All URLs are locale-prefixed (`/en/shop`). Building them through these helpers
 * keeps links, canonicals and the language switcher consistent — and makes the
 * prefix easy to change in one place if that decision is ever revisited.
 */

/** Prefixes an app-relative path with the locale. */
export function localePath(locale: Locale, path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (suffix === "/") return `/${locale}`;
  return `/${locale}${suffix}`;
}

/** Returns the locale in a pathname, if it has one. */
export function localeFromPathname(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return isLocale(segment) ? segment : null;
}

/** Removes the locale prefix, returning the app-relative path. */
export function stripLocale(pathname: string): string {
  const locale = localeFromPathname(pathname);
  if (!locale) return pathname;
  const rest = pathname.slice(locale.length + 1);
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/** Rewrites a pathname to another locale — used by the language switcher. */
export function switchLocaleInPathname(pathname: string, nextLocale: Locale): string {
  const rest = stripLocale(pathname);
  return localePath(nextLocale, rest);
}

/**
 * Rewrites a pathname for a new search value, preserving everything else.
 * Used by filters and pagination so state is never lost on navigation.
 */
export function withSearchParams(
  pathname: string,
  updates: Record<string, string | number | boolean | null | undefined>,
  current?: URLSearchParams | Record<string, string | undefined>,
): string {
  const params = new URLSearchParams(current instanceof URLSearchParams ? current.toString() : "");

  if (current && !(current instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(current)) {
      if (value !== undefined) params.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") params.delete(key);
    else params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** Locales in display order, default first. */
export function orderedLocales(): Locale[] {
  return [defaultLocale, ...locales.filter((locale) => locale !== defaultLocale)];
}
