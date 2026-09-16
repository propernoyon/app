import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_SECONDS } from "./constants";

/* ────────────────────────────────────────────────────────────────────────────
 * Admin authentication.
 *
 * There is no user table in the storefront — a single operator account is
 * configured through environment variables. The session is a stateless,
 * HMAC-signed token in an httpOnly cookie, verified with a constant-time
 * comparison. No session state is stored server-side.
 * ──────────────────────────────────────────────────────────────────────────── */

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? "";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const ADMIN_PASSWORD_HASH = (process.env.ADMIN_PASSWORD_HASH ?? "").trim();
const ADMIN_PASSWORD_PLAINTEXT = (process.env.ADMIN_PASSWORD ?? "").trim();
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * A plaintext `ADMIN_PASSWORD` is accepted **only** outside production, so a
 * development environment does not require generating a hash first. Production
 * refuses it outright.
 */
export const adminAuthConfig = {
  configured:
    SESSION_SECRET.length >= 16 &&
    ADMIN_EMAIL.length > 0 &&
    (ADMIN_PASSWORD_HASH.length > 0 || (!IS_PRODUCTION && ADMIN_PASSWORD_PLAINTEXT.length > 0)),
  devPasswordInUse: ADMIN_PASSWORD_HASH.length === 0 && !IS_PRODUCTION,
} as const;

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/** Verifies a password against the configured scrypt hash (or a dev password). */
export function verifyAdminPassword(password: string): boolean {
  if (ADMIN_PASSWORD_HASH) {
    const [scheme, saltHex, hashHex] = ADMIN_PASSWORD_HASH.split("$");
    if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

    try {
      const derived = scryptSync(password, Buffer.from(saltHex, "hex"), 64).toString("hex");
      return safeEqual(derived, hashHex);
    } catch {
      return false;
    }
  }

  if (!IS_PRODUCTION && ADMIN_PASSWORD_PLAINTEXT) {
    return safeEqual(password, ADMIN_PASSWORD_PLAINTEXT);
  }

  return false;
}

export function verifyAdminEmail(email: string): boolean {
  if (!ADMIN_EMAIL) return false;
  return safeEqual(email.trim().toLowerCase(), ADMIN_EMAIL);
}

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

export function createSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: ADMIN_EMAIL, exp: Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000 }),
    "utf8",
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): { email: string } | null {
  if (!token || SESSION_SECRET.length === 0) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!safeEqual(signature, sign(payload))) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as unknown;
    if (typeof data !== "object" || data === null) return null;
    const record = data as Record<string, unknown>;

    if (typeof record.exp !== "number" || record.exp < Date.now()) return null;
    if (typeof record.sub !== "string") return null;

    return { email: record.sub };
  } catch {
    return null;
  }
}

/** Reads and verifies the session from the request cookies. */
export async function getAdminSession(): Promise<{ email: string } | null> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function startAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    path: "/",
    maxAge: 0,
  });
}

/** Generates a secret for `ADMIN_SESSION_SECRET`, used by the hash script. */
export function generateSessionSecret(): string {
  return randomBytes(32).toString("base64url");
}
