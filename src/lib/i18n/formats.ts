import { toBcp47 } from "@/lib/domain/currency";
import type { Locale } from "./config";

/* ────────────────────────────────────────────────────────────────────────────
 * Formatting helpers.
 *
 * All Intl usage lives here so every price, date and number in the storefront is
 * formatted the same way for a given locale + currency. Every function is pure
 * and safe to import from Client Components.
 * ──────────────────────────────────────────────────────────────────────────── */

function safeNumberFormat(
  locale: Locale,
  options: Intl.NumberFormatOptions,
  value: number,
): string | null {
  try {
    return new Intl.NumberFormat(toBcp47(locale), options).format(value);
  } catch {
    return null;
  }
}

/**
 * Formats a price. Falls back to a plain `12.50 EUR` style string if the
 * currency code is not one `Intl` recognises, so a bad configuration degrades
 * instead of throwing on a product page.
 */
export function formatPrice(amount: number, locale: Locale, currencyCode: string): string {
  const value = Number.isFinite(amount) ? amount : 0;

  const formatted = safeNumberFormat(
    locale,
    {
      style: "currency",
      currency: currencyCode.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    value,
  );

  return formatted ?? `${value.toFixed(2)} ${currencyCode.toUpperCase()}`;
}

export function formatNumber(
  value: number,
  locale: Locale,
  options: Intl.NumberFormatOptions = {},
): string {
  return safeNumberFormat(locale, { maximumFractionDigits: 2, ...options }, value) ?? String(value);
}

export function formatQuantity(value: number, locale: Locale): string {
  return formatNumber(value, locale, {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

export function formatPercent(value: number, locale: Locale): string {
  return (
    safeNumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }, value) ?? `${value}%`
  );
}

/** Formats an ISO date string (as returned by the POS) or a `Date`. */
export function formatDate(
  value: string | Date | null | undefined,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat(toBcp47(locale), options).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function formatDateTime(value: string | Date | null | undefined, locale: Locale): string {
  return formatDate(value, locale, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Minimal `{placeholder}` interpolation.
 *
 * Messages stay plain JSON (no message-format dependency), and translators see
 * the full sentence with its placeholders intact.
 */
export function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  );
}

/**
 * Picks the singular or plural form of a message that ships as two keys.
 * Used for counts like "1 item" / "3 items".
 */
export function pluralize(count: number, one: string, other: string): string {
  return count === 1 ? one : interpolate(other, { count });
}
