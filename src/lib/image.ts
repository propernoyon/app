const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "";

/**
 * Determines if a URL is absolute (starts with http:// or https://)
 */
export function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Safely joins URL parts without duplicate slashes
 */
function joinUrl(base: string, path: string): string {
  if (!base) return path;
  if (!path) return base;
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

/**
 * Builds a proper image URL from various input formats
 * Handles: absolute URLs, relative paths, filenames only, null/empty
 */
export function getImageUrl(
  image: string | null | undefined
): string {
  if (!image) {
    return "/images/placeholder.svg";
  }

  // Already absolute URL
  if (isAbsoluteUrl(image)) {
    return image;
  }

  // Empty string
  if (image.trim() === "") {
    return "/images/placeholder.svg";
  }

  // Relative path or filename
  if (IMAGE_BASE_URL) {
    return joinUrl(IMAGE_BASE_URL, image);
  }

  return image;
}

/**
 * Helper to get product image
 */
export function getProductImageUrl(image: string | null | undefined): string {
  return getImageUrl(image);
}