import "server-only";

import { apiImageResolver, type ImageResolver } from "./placeholder";
import { imagePublicUrl, readImageMapping } from "./store";

/**
 * The single place the final product image is decided:
 *
 *   1. an image uploaded through `/admin` (mapping in `data/product-images.json`)
 *   2. the `image_url` the POS holds (Cloudinary)
 *   3. the branded placeholder
 *
 * Services call this once per request. The mapping is cached in memory and only
 * re-read when the file changes on disk.
 */
export async function getImageResolver(): Promise<ImageResolver> {
  const mapping = await readImageMapping();
  const fallback = apiImageResolver();

  return (productId, apiImageUrl) => {
    const entry = mapping[String(productId)];
    if (entry) {
      return {
        url: imagePublicUrl(entry),
        source: "uploaded",
        blurDataURL: entry.blurDataURL,
        width: entry.width,
        height: entry.height,
      };
    }

    return fallback(productId, apiImageUrl);
  };
}
