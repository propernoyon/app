import type { NextConfig } from "next";

/**
 * Extra image hosts from NEXT_PUBLIC_IMAGE_HOSTS="cdn.example.com,*.another.com".
 * Cloudinary is always allowed because the POS stores Cloudinary URLs in products.image.
 */
const extraImageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  /**
   * Next blocks cross-origin requests to dev-only assets by default, allowing
   * only `localhost`, its subdomains and the hostname the server was started
   * with. Without this, a phone browsing the LAN URL gets the HTML but none of
   * the JavaScript — so nothing hydrates (drawer dead, add-to-cart a no-op,
   * cart stuck on its skeleton). Bare hostnames only: no scheme, no port.
   */
  allowedDevOrigins: ["192.168.1.10", "192.168.1.*"],
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Prefer AVIF, fall back to WebP.
    formats: ["image/avif", "image/webp"],
    // `images.domains` is deprecated in Next 16 — allow-list hosts instead.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.cloudinary.com" },
      ...extraImageHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
    ],
    // Curated widths keep the srcset small on long product grids.
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [48, 64, 96, 128, 200, 256, 384],
    minimumCacheTTL: 14400,
  },
};

export default nextConfig;
