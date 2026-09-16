import { defaultLocale, isLocale, type Locale } from "./config";

/**
 * Dictionary loading.
 *
 * `messages/en.json` is the single source of truth for the message shape: the
 * `Dictionary` type is derived from it, so a missing or misspelled key is a
 * compile error in every component rather than a silent fallback at runtime.
 * A unit test additionally asserts that `pt.json` has identical keys.
 *
 * `typeof import(...)` is a type-only import expression, so referencing the
 * English catalogue for typing does not bundle it.
 */
export type Dictionary = typeof import("@/messages/en.json");

type DictionaryLoader = () => Promise<Dictionary>;

const loaders: Record<Locale, DictionaryLoader> = {
  en: () => import("@/messages/en.json").then((module) => module.default as Dictionary),
  pt: () => import("@/messages/pt.json").then((module) => module.default as Dictionary),
};

/**
 * Loads the catalogue for a locale, falling back to the default locale when an
 * unknown value arrives (e.g. from a stale cookie).
 */
export async function getDictionary(locale: string | undefined): Promise<Dictionary> {
  const resolved: Locale = isLocale(locale) ? locale : defaultLocale;
  return loaders[resolved]();
}
