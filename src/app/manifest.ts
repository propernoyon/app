import type { MetadataRoute } from "next";

import { publicEnv } from "@/config/env";

/**
 * Web app manifest, so the storefront is installable.
 *
 * `start_url` is `/`, which the proxy resolves to the visitor's preferred
 * locale. Icons are SVG (crisp at every size, no build step); adding 192px and
 * 512px PNGs would improve install prompts on some Android launchers.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: publicEnv.storeName,
    short_name: publicEnv.storeName.slice(0, 12),
    description: publicEnv.storeAddress || `${publicEnv.storeName} online store`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdfbfb",
    theme_color: "#065cd7",
    lang: publicEnv.defaultCurrency === "EUR" ? "pt-PT" : "en",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
