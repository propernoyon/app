import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The API client is the security boundary: it is the only module holding the POS
 * key, and it must refuse to run when misconfigured rather than leaking a
 * half-configured request.
 *
 * The client reads its environment at module load, and different cases need
 * different configuration — so each case loads a fresh copy of *both* the client
 * and the error module. (Loading them from the same registry matters: the error
 * classes must be identical for `instanceof` to hold.)
 */
async function loadClient(env: Record<string, string | undefined>) {
  vi.resetModules();

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  const [client, errors] = await Promise.all([
    import("@/lib/api/client"),
    import("@/lib/api/errors"),
  ]);

  return { posRequest: client.posRequest, ...errors };
}

const CONFIGURED = {
  API_BASE_URL: "https://localhost/pos/api",
  API_KEY: "super-secret-key",
  USE_MOCK_API: "false",
};

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("configuration guard", () => {
  it("refuses to send a request when API_BASE_URL is missing", async () => {
    const { posRequest } = await loadClient({ API_BASE_URL: "", API_KEY: "test-key" });

    await expect(posRequest("/products")).rejects.toMatchObject({
      name: "PosApiError",
      kind: "not_configured",
    });
  });

  it("refuses to send a request when API_KEY is missing, and says how to fix it", async () => {
    const { posRequest } = await loadClient({ ...CONFIGURED, API_KEY: "" });

    await expect(posRequest("/products")).rejects.toThrow(/API_KEY is not set/);
  });
});

describe("request shape", () => {
  it("sends the key as a header, never in the URL", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { posRequest } = await loadClient(CONFIGURED);
    await posRequest("/products", { query: { q: "apple", page: 2, empty: "" } });

    const [calledUrl, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];

    // Empty query values are dropped rather than sent as blanks.
    expect(calledUrl).toBe("https://localhost/pos/api/products?q=apple&page=2");
    expect(calledUrl).not.toContain("super-secret-key");
    expect((init.headers as Record<string, string>)["X-API-Key"]).toBe("super-secret-key");
  });

  it("uses no-store for uncacheable resources such as stock and orders", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { posRequest } = await loadClient(CONFIGURED);
    await posRequest("/stock/1", { revalidate: false });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.cache).toBe("no-store");
    expect(init.next).toBeUndefined();
  });

  it("applies the revalidation window and cache tags when caching is requested", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { posRequest } = await loadClient(CONFIGURED);
    await posRequest("/categories", { revalidate: 3600, tags: ["categories"] });

    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit & { next?: { revalidate?: number; tags?: string[] } },
    ];

    expect(init.cache).toBeUndefined();
    expect(init.next).toEqual({ revalidate: 3600, tags: ["categories"] });
  });
});

describe("error classification", () => {
  it("unwraps the API error envelope into a typed error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: false, error: "Order 'X' not found." }), {
            status: 404,
          }),
      ),
    );

    const { posRequest } = await loadClient(CONFIGURED);

    await expect(posRequest("/orders/X")).rejects.toMatchObject({
      kind: "not_found",
      status: 404,
      message: "Order 'X' not found.",
    });
  });

  it("classifies HTTP 422 as validation and keeps the field messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: false,
              error: "Order validation failed.",
              errors: ["items[0]: Only 2 in stock, requested 5."],
            }),
            { status: 422 },
          ),
      ),
    );

    const { posRequest, isPosApiError } = await loadClient(CONFIGURED);

    try {
      await posRequest("/orders", { method: "POST", body: {} });
      throw new Error("expected the request to fail");
    } catch (error) {
      expect(isPosApiError(error)).toBe(true);
      expect(error).toMatchObject({
        kind: "validation",
        fields: ["items[0]: Only 2 in stock, requested 5."],
      });
    }
  });

  it("maps rate limiting to its own kind so the UI can ask the user to wait", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: false, error: "Rate limit exceeded." }), {
            status: 429,
          }),
      ),
    );

    const { posRequest } = await loadClient(CONFIGURED);
    await expect(posRequest("/products")).rejects.toMatchObject({ kind: "rate_limited" });
  });

  it("treats a 200 response with success:false as a failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: false, error: "Nope" }), { status: 200 }),
      ),
    );

    const { posRequest } = await loadClient(CONFIGURED);
    await expect(posRequest("/products")).rejects.toMatchObject({ kind: "server" });
  });

  it("reports a network failure as retryable, after exhausting its one retry", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    vi.stubGlobal("fetch", fetchMock);

    const { posRequest, toPosApiError } = await loadClient(CONFIGURED);

    try {
      await posRequest("/stock/1", { revalidate: false });
      throw new Error("expected the request to fail");
    } catch (error) {
      const apiError = toPosApiError(error);
      expect(apiError.kind).toBe("network");
      expect(apiError.isRetryable).toBe(true);
      // GET is idempotent, so it is attempted twice before giving up.
      expect(fetchMock).toHaveBeenCalledTimes(2);
    }
  });

  it("never retries a POST, because creating an order is not idempotent", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    vi.stubGlobal("fetch", fetchMock);

    const { posRequest } = await loadClient(CONFIGURED);

    await expect(posRequest("/orders", { method: "POST", body: {} })).rejects.toMatchObject({
      kind: "network",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("treats a non-JSON response body as a server failure, not a parse crash", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>Apache error</html>", { status: 500 })),
    );

    const { posRequest } = await loadClient(CONFIGURED);
    await expect(posRequest("/products")).rejects.toMatchObject({ kind: "server", status: 500 });
  });
});
