"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_LOGIN_MAX_ATTEMPTS, ADMIN_LOGIN_WINDOW_MS } from "@/lib/admin/constants";
import {
  adminAuthConfig,
  endAdminSession,
  startAdminSession,
  verifyAdminEmail,
  verifyAdminPassword,
} from "@/lib/admin/session";
import {
  clearLoginAttempts,
  isLoginRateLimited,
  recordLoginFailure,
  type AdminLoginState,
} from "@/lib/admin/types";

async function clientKey(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "local";
}

/**
 * Admin sign-in.
 *
 * Credentials come from the environment (single operator account). Failures are
 * rate limited per client, and the response never distinguishes "unknown email"
 * from "wrong password" — keeping the state shape from `INITIAL_ADMIN_LOGIN_STATE`
 * so the form stays a real form.
 */
export async function adminLoginAction(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  if (!adminAuthConfig.configured) return { status: "not_configured" };

  const key = await clientKey();
  if (isLoginRateLimited(key, ADMIN_LOGIN_MAX_ATTEMPTS, ADMIN_LOGIN_WINDOW_MS)) {
    return { status: "rate_limited" };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const emailOk = verifyAdminEmail(email);
  const passwordOk = verifyAdminPassword(password);

  if (!emailOk || !passwordOk) {
    recordLoginFailure(key, ADMIN_LOGIN_WINDOW_MS);
    return { status: "invalid" };
  }

  clearLoginAttempts(key);
  await startAdminSession();

  const next = String(formData.get("next") ?? "");
  const destination =
    next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin";
  redirect(destination);
}

export async function adminLogoutAction(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}
