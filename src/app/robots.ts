import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/config/env";

/**
 * Crawl rules.
 *
 * Customer-specific and operational routes are excluded: a cart, a checkout and
 * an order lookup are per-visitor and would only create thin/duplicate results.
 * `/dev` is the development styleguide.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/cart",
          "/checkout",
          "/order-success/",
          "/track-order",
          "/dev",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
