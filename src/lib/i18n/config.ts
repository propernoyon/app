/**
 * Locale configuration.
 *
 * URL architecture: every route is prefixed with the locale (`/en/...`,
 * `/pt/...`). Prefixing *all* locales — including the default — keeps hreflang
 * symmetry and avoids duplicate-content ambiguity. Adding a language means
 * adding it here plus a matching `messages/<locale>.json`.
 */

export const locales = ["en", "pt"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Cookie that remembers the visitor's explicit language choice. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Shown in the language switcher, each written in its own language. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  pt: "Português",
};

/** Short form for compact switchers. */
export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  pt: "PT",
};

/** Value for `<html lang>`. */
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  pt: "pt-PT",
};

/** Value for `hreflang` alternates. Kept separate from `lang` for precision. */
export const HREFLANG: Record<Locale, string> = {
  en: "en",
  pt: "pt-PT",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * Picks the best supported locale from an `Accept-Language` header.
 *
 * A small hand-rolled negotiator (quality values + base-language matching)
 * avoids pulling in a dependency for something this small. Falls back to
 * `defaultLocale` when nothing matches.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;

  const parsed = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const quality = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="))
        ?.slice(2);
      const q = quality ? Number.parseFloat(quality) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of parsed) {
    if (tag === "*") continue;

    const base = tag.split("-")[0];
    const match = locales.find((locale) => locale === base);
    if (match) return match;

    // Regional variants of a supported base language (e.g. pt-BR → pt).
    const regional = locales.find((locale) => tag.startsWith(`${locale}-`));
    if (regional) return regional;
  }

  return defaultLocale;
}
