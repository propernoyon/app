import "server-only";

import { isPosApiError, toPosApiError, type PosApiError } from "./errors";

/**
 * Runs a data loader without letting an expected API failure escape.
 *
 * API outages are a normal operating condition for a storefront, so they are
 * handled as data rather than thrown: pages render a friendly, localized error
 * state with a retry, and — importantly — a build never fails because the POS
 * happened to be unreachable while a page was being prerendered.
 *
 * Genuinely unexpected errors (bugs) are re-thrown into `error.tsx`.
 */
export type LoadResult<T> = { ok: true; data: T } | { ok: false; error: PosApiError };

const EXPECTED_KINDS = new Set([
  "unauthorized",
  "forbidden",
  "not_found",
  "validation",
  "rate_limited",
  "bad_request",
  "server",
  "network",
  "timeout",
  "invalid_response",
  "not_configured",
]);

export async function tryLoad<T>(loader: () => Promise<T>): Promise<LoadResult<T>> {
  try {
    return { ok: true, data: await loader() };
  } catch (error) {
    if (!isPosApiError(error)) {
      // Not an API problem — let the error boundary deal with it.
      console.error("[api] unexpected loader failure", error);
      throw error;
    }

    if (!EXPECTED_KINDS.has(error.kind)) throw error;

    console.error("[api] loader failed", {
      kind: error.kind,
      status: error.status,
      endpoint: error.endpoint,
      message: error.message,
    });

    return { ok: false, error: toPosApiError(error) };
  }
}
