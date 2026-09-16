import "server-only";

import { redirect } from "next/navigation";

import { getAdminSession } from "./session";

/**
 * Authorises an admin request.
 *
 * This is the real access control. `proxy.ts` only performs a cheap cookie
 * presence check so unauthenticated visitors are redirected quickly — it is not
 * a security boundary, and every admin page, Server Action and Route Handler
 * calls through here.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** Non-redirecting variant for Route Handlers, which return a status instead. */
export async function getAdminOrNull(): Promise<{ email: string } | null> {
  return getAdminSession();
}
