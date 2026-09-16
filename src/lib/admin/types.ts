/** Shared admin types. Kept out of the `"use server"` modules, which may only export async functions. */

export type AdminLoginState =
  | { status: "idle" }
  | { status: "invalid" }
  | { status: "rate_limited" }
  | { status: "not_configured" };

export const INITIAL_ADMIN_LOGIN_STATE: AdminLoginState = { status: "idle" };

/** Per-client login attempt tracking (single-process, in-memory). */
interface AttemptRecord {
  count: number;
  firstAt: number;
}

const attempts = new Map<string, AttemptRecord>();

export function isLoginRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
  const record = attempts.get(key);
  if (!record) return false;

  if (Date.now() - record.firstAt > windowMs) {
    attempts.delete(key);
    return false;
  }

  return record.count >= maxAttempts;
}

export function recordLoginFailure(key: string, windowMs: number): void {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now - record.firstAt > windowMs) {
    attempts.set(key, { count: 1, firstAt: now });
    return;
  }

  record.count += 1;
}

export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}
