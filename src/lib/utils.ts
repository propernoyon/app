/**
 * Debounce a function call
 */
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Build query string from params object
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Generate placeholder image URL
 */
export function getPlaceholderImage(fallbackText?: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const text = fallbackText ? `&text=${encodeURIComponent(fallbackText)}` : "";
  return `${base}/images/placeholder.svg${text}`;
}

/**
 * Deep merge objects
 */
export function deepMerge<T>(base: T, override: Partial<T>): T {
  const result: Record<string, unknown> = { ...base };

  Object.entries(override as Record<string, unknown>).forEach(
    ([key, value]) => {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        result[key] &&
        typeof result[key] === "object" &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMerge(
          result[key] as Record<string, unknown>,
          value as Record<string, unknown>
        );
      } else {
        result[key] = value;
      }
    }
  );

  return result as T;
}

/**
 * Truncate string
 */
export function truncate(str: string, length: number): string {
  if (!str) return "";
  if (str.length <= length) return str;
  return `${str.substring(0, length)}...`;
}

/**
 * Get category color with fallback
 */
export function getCategoryColor(color: string | null | undefined): string {
  if (!color) return "#16a34a"; // default green
  // Validate it's a proper hex color
  if (/^#[0-9A-F]{6}$/i.test(color)) return color;
  return "#16a34a";
}