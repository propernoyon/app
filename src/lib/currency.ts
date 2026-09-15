const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "EUR";

/**
 * Format price according to locale and currency
 * Example: €2,49 (Portuguese) vs €2.49 (English)
 */
export function formatPrice(
  amount: number,
  locale: string = "en",
  currency: string = DEFAULT_CURRENCY
): string {
  const localeMap: Record<string, string> = {
    en: "en-GB",
    pt: "pt-PT",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
  };

  const resolvedLocale = localeMap[locale] || "en-GB";

  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Format quantity/unit display
 */
export function formatQuantity(quantity: number, locale: string = "en"): string {
  const localeMap: Record<string, string> = {
    en: "en-GB",
    pt: "pt-PT",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
  };

  try {
    return new Intl.NumberFormat(localeMap[locale] || "en-GB", {
      maximumFractionDigits: 2,
    }).format(quantity);
  } catch {
    return quantity.toString();
  }
}