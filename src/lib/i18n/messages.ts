import type { Dictionary } from "./dictionaries";
import type { PosErrorKind } from "@/lib/api/errors";

/**
 * Maps an API error kind to a customer-facing message.
 *
 * Written as an explicit record of dictionary strings (rather than a dotted-key
 * lookup) so every branch stays type-checked: adding a new error kind without
 * translating it is a compile error, not a blank space on the page.
 */
const ERROR_MESSAGES: (dict: Dictionary) => Record<PosErrorKind, string> = (dict) => ({
  unauthorized: dict.errors.unauthorized,
  forbidden: dict.errors.forbidden,
  not_found: dict.errors.notFound,
  validation: dict.errors.validation,
  rate_limited: dict.errors.rateLimited,
  bad_request: dict.errors.badRequest,
  server: dict.errors.server,
  network: dict.errors.network,
  timeout: dict.errors.timeout,
  invalid_response: dict.errors.server,
  not_configured: dict.errors.notConfigured,
});

export function apiErrorMessage(dict: Dictionary, kind: PosErrorKind): string {
  return ERROR_MESSAGES(dict)[kind] ?? dict.errors.genericBody;
}
