import type { MetadataRoute } from "next";

import { publicEnv } from "@/config/env";

/**
 * Web app manifest, so the storefront is installable.
 *
 * `start_url` is `/`, which the proxy resolves to the visitor's preferred
 * locale. Icons are generated from `public/images/logo.png`: a square 192/512
 * pair for launchers and a 512 maskable variant whose artwork sits inside the
 * safe zone, so Android can crop it to its own shape without clipping the logo.
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
    background_color: "#fcfbf2",
    theme_color: "#516393",
    lang: publicEnv.defaultCurrency === "EUR" ? "pt-PT" : "en",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
