import "server-only";

import { PosApiError, type PosErrorKind } from "./errors";

/* ────────────────────────────────────────────────────────────────────────────
 * Server-only POS API client.
 *
 * The API key never leaves the server: this module is marked `server-only`, so
 * importing it from a Client Component fails the build. Every browser-initiated
 * call must go through a Server Component, a Server Action or a Route Handler.
 * ──────────────────────────────────────────────────────────────────────────── */

const BASE_URL = (process.env.API_BASE_URL ?? "").replace(/\/+$/, "");
const API_KEY = process.env.API_KEY ?? "";
const USE_MOCK = process.env.USE_MOCK_API === "true";
const ALLOW_INSECURE_TLS = process.env.ALLOW_INSECURE_TLS === "true";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_REVALIDATE_SECONDS = 300;

/**
 * Local XAMPP serves `https://localhost` with a self-signed certificate, which
 * Node rejects. `ALLOW_INSECURE_TLS` is a development-only escape hatch and is
 * ignored in production. Keeping Node's fetch here (rather than `node:https`)
 * preserves Next's Data Cache integration.
 */
if (ALLOW_INSECURE_TLS && !IS_PRODUCTION) {
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.warn(
      "[api] ALLOW_INSECURE_TLS=true — TLS certificate verification is disabled for this dev process only.",
    );
  }
}

export const apiConfig = {
  baseUrl: BASE_URL,
  useMock: USE_MOCK,
  isProduction: IS_PRODUCTION,
  /** Whether a real key is present; when false, callers surface a setup hint. */
  hasApiKey: API_KEY.length > 0,
  configured: BASE_URL.length > 0 && API_KEY.length > 0,
} as const;

export interface PosRequestOptions {
  method?: "GET" | "POST";
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  /**
   * Next Data Cache lifetime in seconds, or `false` for `no-store`.
   * Omit to accept the default (300s).
   */
  revalidate?: number | false;
  /** Cache tags for targeted revalidation. */
  tags?: string[];
  timeoutMs?: number;
  /** Caller-owned abort signal, combined with the timeout. */
  signal?: AbortSignal;
}

function buildUrl(path: string, query: PosRequestOptions["query"]): string {
  const url = new URL(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function classifyStatus(status: number): PosErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 422) return "validation";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";
  if (status >= 400) return "bad_request";
  return "server";
}

/** Narrows the API's `errors` payload, which is an array in v2 and an object in some paths. */
function extractFieldErrors(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const messages = value.filter((item): item is string => typeof item === "string");
    return messages.length ? messages : undefined;
  }
  if (value && typeof value === "object") {
    const messages = Object.values(value as Record<string, unknown>)
      .flatMap((item) => (Array.isArray(item) ? item : [item]))
      .filter((item): item is string => typeof item === "string");
    return messages.length ? messages : undefined;
  }
  return undefined;
}

function logFailure(details: Record<string, unknown>): void {
  console.error("[api] request failed", details);
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { __unparsed: text.slice(0, 500) };
  }
}

/**
 * Performs an authenticated request and unwraps the API envelope.
 *
 * Retries are limited to idempotent GETs — a POST never retries, because the
 * order endpoint is not idempotent and a duplicate would create a second order.
 */
export async function posRequest<T>(path: string, options: PosRequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    query,
    body,
    revalidate = DEFAULT_REVALIDATE_SECONDS,
    tags,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: callerSignal,
  } = options;

  if (!BASE_URL) {
    throw new PosApiError(
      "not_configured",
      "API_BASE_URL is not set. Copy .env.example to .env.local and fill it in.",
      { endpoint: path },
    );
  }

  if (!API_KEY) {
    throw new PosApiError(
      "not_configured",
      "API_KEY is not set. Create a key in the POS (Admin → API Keys) and add it to .env.local. Alternatively set USE_MOCK_API=true to develop against fixtures.",
      { endpoint: path },
    );
  }

  const url = buildUrl(path, query);
  const attempts = method === "GET" ? 2 : 1;
  let lastError: PosApiError | undefined;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const onCallerAbort = () => controller.abort();
    callerSignal?.addEventListener("abort", onCallerAbort, { once: true });

    const init: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
      method,
      headers: {
        Accept: "application/json",
        "X-API-Key": API_KEY,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      signal: controller.signal,
    };

    if (body !== undefined) init.body = JSON.stringify(body);

    if (revalidate === false) {
      init.cache = "no-store";
    } else {
      init.next = { revalidate, ...(tags?.length ? { tags } : {}) };
    }

    try {
      const response = await fetch(url, init);
      const payload = await readJson(response);

      if (!response.ok) {
        const record = (payload ?? {}) as Record<string, unknown>;
        const message =
          typeof record.error === "string"
            ? record.error
            : typeof record.message === "string"
              ? record.message
              : `Request failed with status ${response.status}`;

        const error = new PosApiError(classifyStatus(response.status), message, {
          status: response.status,
          fields: extractFieldErrors(record.errors),
          endpoint: path,
        });

        // Only 5xx is worth an automatic second attempt.
        if (error.kind === "server" && attempt < attempts - 1) {
          lastError = error;
          continue;
        }

        logFailure({ endpoint: path, status: response.status, kind: error.kind, message });
        throw error;
      }

      if (
        payload &&
        typeof payload === "object" &&
        (payload as { success?: unknown }).success === false
      ) {
        const record = payload as Record<string, unknown>;
        const error = new PosApiError("server", String(record.error ?? "API reported failure"), {
          status: response.status,
          fields: extractFieldErrors(record.errors),
          endpoint: path,
        });
        logFailure({ endpoint: path, status: response.status, kind: error.kind });
        throw error;
      }

      return payload as T;
    } catch (error) {
      if (error instanceof PosApiError) throw error;

      const aborted = error instanceof Error && error.name === "AbortError";
      // A caller-initiated abort is not a failure worth reporting.
      if (aborted && callerSignal?.aborted) {
        throw new PosApiError("timeout", "Request cancelled", { endpoint: path, cause: error });
      }

      const wrapped = new PosApiError(
        aborted ? "timeout" : "network",
        aborted
          ? `Request timed out after ${timeoutMs}ms`
          : error instanceof Error
            ? error.message
            : "Network request failed",
        { endpoint: path, cause: error },
      );

      if (attempt < attempts - 1) {
        lastError = wrapped;
        continue;
      }

      logFailure({ endpoint: path, kind: wrapped.kind, message: wrapped.message });
      throw wrapped;
    } finally {
      clearTimeout(timeout);
      callerSignal?.removeEventListener("abort", onCallerAbort);
    }
  }

  throw lastError ?? new PosApiError("network", "Request failed after retries", { endpoint: path });
}
