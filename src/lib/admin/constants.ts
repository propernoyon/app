/** Cookie that holds the signed admin session. Shared by `proxy.ts` and the guard. */
export const ADMIN_SESSION_COOKIE = "mm_admin_session";

/** How long an admin session stays valid. */
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;

/** Login attempts allowed per window, per client address. */
export const ADMIN_LOGIN_MAX_ATTEMPTS = 8;
export const ADMIN_LOGIN_WINDOW_MS = 10 * 60 * 1000;
