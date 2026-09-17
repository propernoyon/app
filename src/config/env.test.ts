import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `publicEnv` is computed at module load, so every case re-imports the module
 * with `NEXT_PUBLIC_SITE_URL` stubbed first.
 */
async function withSiteUrl(value: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", value);
  return import("@/config/env");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("NEXT_PUBLIC_SITE_URL", () => {
  it("keeps a fully-qualified origin", async () => {
    const { publicEnv } = await withSiteUrl("https://shop.example.com");
    expect(publicEnv.siteUrl).toBe("https://shop.example.com");
  });

  it("adds https:// to a bare host, which would otherwise throw in new URL()", async () => {
    const { publicEnv } = await withSiteUrl("shop.example.com");
    expect(publicEnv.siteUrl).toBe("https://shop.example.com");
  });

  it("drops a trailing slash so absoluteUrl never doubles up", async () => {
    const { publicEnv, absoluteUrl } = await withSiteUrl("https://shop.example.com/");
    expect(publicEnv.siteUrl).toBe("https://shop.example.com");
    expect(absoluteUrl("/en/shop")).toBe("https://shop.example.com/en/shop");
  });

  it("preserves an explicit http origin for local development", async () => {
    const { publicEnv } = await withSiteUrl("http://localhost:3000");
    expect(publicEnv.siteUrl).toBe("http://localhost:3000");
  });

  it("lower-cases the origin", async () => {
    const { publicEnv } = await withSiteUrl("HTTPS://Shop.Example.COM");
    expect(publicEnv.siteUrl).toBe("https://shop.example.com");
  });

  it("falls back to the documented default when empty or unparseable", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const empty = await withSiteUrl("");
    expect(empty.publicEnv.siteUrl).toBe("http://localhost:3000");

    const invalid = await withSiteUrl("not a url");
    expect(invalid.publicEnv.siteUrl).toBe("http://localhost:3000");
    expect(warn).toHaveBeenCalled();
  });
});
