import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { ToastProvider } from "@/components/ui/toast";
import { absoluteUrl } from "@/config/env";
import { storeConfig } from "@/config/store";
import { fontVariables } from "@/lib/fonts";
import { HTML_LANG, isLocale, locales } from "@/lib/i18n/config";
import { getStoreContext } from "@/lib/store/context";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme/config";

import "../globals.css";

/**
 * Root layout for the storefront.
 *
 * It deliberately lives under the dynamic `[locale]` segment (there is no
 * `app/layout.tsx`), which makes `locale` a *root parameter* that any Server
 * Component can read via `next/root-params` — and lets `<html lang>` be correct
 * for each language. `/dev` and `/admin` define their own root layouts.
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Matches the app's own light/dark backgrounds so the browser chrome blends
  // in on mobile. A meta tag can only follow the OS preference, not the user's
  // explicit theme choice — the bootstrap script handles the document itself.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#14161a" },
  ],
};

export async function generateMetadata(props: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await props.params;
  const name = storeConfig.name;

  return {
    metadataBase: new URL(absoluteUrl("/")),
    title: {
      default: `${name} — ${locale === "pt" ? "mercearia online" : "online grocery"}`,
      template: `%s · ${name}`,
    },
    description: storeConfig.address ? `${name} — ${storeConfig.address}` : `${name} online store`,
    applicationName: name,
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout(props: LayoutProps<"/[locale]">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const { dict } = await getStoreContext();

  return (
    <html
      lang={HTML_LANG[locale]}
      className={`${fontVariables} h-full antialiased`}
      // The bootstrap script below sets the theme class on <html> before React
      // hydrates, so the server/client markup intentionally differs here.
      suppressHydrationWarning
      // Next 16 no longer overrides `scroll-behavior` during navigation unless
      // this attribute is present; we want instant scroll-to-top on navigation.
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col bg-background">
        <script
          id="mm-theme-bootstrap"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
        <a
          href="#main"
          className="sr-only-focusable absolute top-2 left-2 z-50 rounded-lg bg-primary px-4 py-2 text-small font-semibold text-primary-foreground"
        >
          {dict.common.skipToContent}
        </a>

        <ToastProvider closeLabel={dict.common.close}>
          <Header />
          <main id="main" className="flex-1">
            {props.children}
          </main>
          <Footer />
        </ToastProvider>

        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
