/**
 * Error model for the POS API.
 *
 * Every failure crossing the API boundary becomes a `PosApiError` so callers can
 * branch on `kind` and render a friendly, localized message — raw technical text
 * is logged server-side and never shown to a customer.
 */
export type PosErrorKind =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "rate_limited"
  | "bad_request"
  | "server"
  | "network"
  | "timeout"
  | "invalid_response"
  | "not_configured";

/** Kind → i18n key under `errors.*`. */
export const POS_ERROR_MESSAGE_KEYS: Record<PosErrorKind, string> = {
  unauthorized: "errors.unauthorized",
  forbidden: "errors.forbidden",
  not_found: "errors.notFound",
  validation: "errors.validation",
  rate_limited: "errors.rateLimited",
  bad_request: "errors.badRequest",
  server: "errors.server",
  network: "errors.network",
  timeout: "errors.timeout",
  invalid_response: "errors.server",
  not_configured: "errors.notConfigured",
};

export class PosApiError extends Error {
  readonly kind: PosErrorKind;
  readonly status?: number;
  /** Field-level messages when the API returns them (HTTP 422). */
  readonly fields?: string[];
  readonly endpoint?: string;

  constructor(
    kind: PosErrorKind,
    message: string,
    options: { status?: number; fields?: string[]; endpoint?: string; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "PosApiError";
    this.kind = kind;
    this.status = options.status;
    this.fields = options.fields;
    this.endpoint = options.endpoint;
  }

  /** True when the request is worth retrying by a user action. */
  get isRetryable(): boolean {
    return this.kind === "network" || this.kind === "timeout" || this.kind === "server";
  }
}

export function isPosApiError(error: unknown): error is PosApiError {
  return error instanceof PosApiError;
}

/** Normalizes anything thrown into a PosApiError. */
export function toPosApiError(error: unknown): PosApiError {
  if (isPosApiError(error)) return error;
  return new PosApiError("server", error instanceof Error ? error.message : "Unknown error", {
    cause: error,
  });
}
