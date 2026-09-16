import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin/constants";
import { LOCALE_COOKIE, isLocale, negotiateLocale } from "@/lib/i18n/config";

/**
 * `proxy.ts` is Next.js 16's renamed `middleware` convention and runs on the
 * Node.js runtime, before routes render.
 *
 * It does two cheap jobs:
 *   1. Locale negotiation — redirects un-prefixed paths to `/{locale}/...`
 *   2. /admin gating — redirects to the sign-in page when no session cookie is present
 *
 * Security note: the admin check here is a *presence* check for fast redirects
 * only. Redirects must never be the access control — every admin page and Server
 * Action re-verifies the signed session with `requireAdmin()`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin ────────────────────────────────────────────────────────────────
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const isLoginRoute = pathname === "/admin/login";
    const hasSessionCookie = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

    if (!hasSessionCookie && !isLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }

    if (hasSessionCookie && isLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // The dev-only styleguide is never locale-prefixed.
  if (pathname === "/dev" || pathname.startsWith("/dev/")) {
    return NextResponse.next();
  }

  // ── Locale ───────────────────────────────────────────────────────────────
  const firstSegment = pathname.split("/")[1];
  if (isLocale(firstSegment)) return NextResponse.next();

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : negotiateLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Run on everything except API routes, Next internals, and static assets.
     * `robots.txt` / `sitemap.xml` are generated routes that must not be
     * locale-redirected; `sw.js` and the manifest must be served as-is.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
