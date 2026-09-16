import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme/config";
import "../globals.css";

export const metadata: Metadata = {
  title: "Mini Mercado — UI",
  robots: { index: false, follow: false },
};

/**
 * Root layout for the dev-only styleguide. It is intentionally separate from
 * the storefront layout so `/dev` renders full-page (no locale, no cart, no
 * header) and can never be mistaken for a customer route.
 */
export default function DevRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <script
          id="mm-theme-bootstrap"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
        {children}
      </body>
    </html>
  );
}
