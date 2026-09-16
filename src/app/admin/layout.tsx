import type { Metadata } from "next";

import { getAdminContext } from "@/lib/admin/locale";
import { fontVariables } from "@/lib/fonts";
import { HTML_LANG } from "@/lib/i18n/config";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme/config";

import "../globals.css";

/**
 * Root layout for the admin area.
 *
 * `/admin` is intentionally outside `[locale]`: it is an internal tool, not a
 * customer route, so it is not indexed, not translated per-URL, and keeps its
 * authentication boundary separate from the storefront. Its language still
 * follows the cookie set by the storefront's language switcher.
 */
export const metadata: Metadata = {
  title: "Mini Mercado · Admin",
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getAdminContext();

  return (
    <html
      lang={HTML_LANG[locale]}
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background">
        <script
          id="mm-theme-bootstrap"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
        {children}
      </body>
    </html>
  );
}
