/**
 * Currency handling.
 *
 * The POS `/settings` endpoint returns a *symbol* (e.g. `৳`, `€`), but `Intl`
 * needs an ISO 4217 code to format numbers correctly per locale. We map the
 * common symbols back to codes and fall back to the configured default, so a
 * symbol the store sets is honoured rather than ignored.
 */

const SYMBOL_TO_CODE: Record<string, string> = {
  "€": "EUR",
  "£": "GBP",
  $: "USD",
  "৳": "BDT",
  "₹": "INR",
  "¥": "JPY",
  "₺": "TRY",
  "₩": "KRW",
  "₽": "RUB",
  "₴": "UAH",
  "₦": "NGN",
  "₱": "PHP",
  "฿": "THB",
  "₫": "VND",
  R$: "BRL",
  "﷼": "SAR",
  "د.إ": "AED",
  "ر.س": "SAR",
  "ر.ع": "OMR",
  "د.ك": "KWD",
  "د.ب": "BHD",
  "ر.ق": "QAR",
  زł: "PLN",
  zł: "PLN",
  Kč: "CZK",
  Ft: "HUF",
  lei: "RON",
  kr: "SEK",
  CHF: "CHF",
};

/** `Intl` locale for each supported storefront language. */
const LOCALE_TO_BCP47: Record<string, string> = {
  en: "en-GB",
  pt: "pt-PT",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  nl: "nl-NL",
};

export function resolveCurrencyCode(
  apiSymbol: string | null | undefined,
  fallback: string,
): string {
  if (apiSymbol) {
    const cleaned = apiSymbol.trim();
    const mapped = SYMBOL_TO_CODE[cleaned];
    if (mapped) return mapped;
    // A 3-letter symbol is already an ISO code in some configurations.
    if (/^[A-Za-z]{3}$/.test(cleaned)) return cleaned.toUpperCase();
  }
  return fallback.toUpperCase();
}

export function toBcp47(locale: string): string {
  return LOCALE_TO_BCP47[locale] ?? "en-GB";
}
