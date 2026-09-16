import { absoluteUrl } from "@/config/env";
import { HREFLANG, locales, type Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/routes";

/**
 * Canonical URL plus hreflang alternates for a page.
 *
 * Every route is built from the same `path` (without a locale prefix) so each
 * language version points at its siblings, and `x-default` points at the default
 * locale. This is what makes the multilingual pages index correctly rather than
 * competing as duplicates.
 */
export function buildAlternates(
  locale: Locale,
  path = "/",
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {};

  for (const item of locales) {
    languages[HREFLANG[item]] = absoluteUrl(localePath(item, path));
  }

  languages["x-default"] = absoluteUrl(localePath(locales[0], path));

  return { canonical: absoluteUrl(localePath(locale, path)), languages };
}

/** Truncates a description to a length search engines render fully. */
export function clampDescription(value: string, max = 160): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}
