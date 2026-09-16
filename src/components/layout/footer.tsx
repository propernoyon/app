import Link from "next/link";

import { storeConfig } from "@/config/store";
import { getStoreContext } from "@/lib/store/context";
import { Logo } from "./logo";

/**
 * Storefront footer. Contact details and opening hours come from public config,
 * quick links are locale-aware, and it carries the (honest) note that prices and
 * stock are driven by the point of sale.
 */
export async function Footer() {
  const { dict, href } = await getStoreContext();

  const quickLinks = [
    { href: href("/shop"), label: dict.nav.shop },
    { href: href("/track-order"), label: dict.nav.trackOrder },
    { href: href("/cart"), label: dict.nav.cart },
  ];

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="container-page py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo name={storeConfig.name} href={href("/")} />
            <p className="mt-3 max-w-xs text-small text-muted-foreground">
              {dict.footer.aboutText}
            </p>
          </div>

          <div>
            <h2 className="text-micro text-muted-foreground">{dict.footer.quickLinks}</h2>
            <ul className="mt-3 space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-small text-foreground underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-micro text-muted-foreground">{dict.footer.contact}</h2>
            <ul className="mt-3 space-y-2 text-small text-foreground">
              {storeConfig.address ? <li>{storeConfig.address}</li> : null}
              {storeConfig.phone ? (
                <li>
                  <a
                    href={`tel:${storeConfig.phone.replace(/\s+/g, "")}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {storeConfig.phone}
                  </a>
                </li>
              ) : null}
              {storeConfig.email ? (
                <li>
                  <a
                    href={`mailto:${storeConfig.email}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {storeConfig.email}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <h2 className="text-micro text-muted-foreground">{dict.footer.openingHours}</h2>
            <p className="mt-3 text-small text-foreground">
              {storeConfig.openingHours || dict.common.optional}
            </p>
            <h2 className="mt-5 text-micro text-muted-foreground">{dict.footer.payment}</h2>
            <p className="mt-3 text-small text-muted-foreground">{dict.footer.paymentNote}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-caption text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {storeConfig.name}. {dict.footer.rights}
          </p>
          <p>{dict.common.poweredBy}</p>
        </div>
      </div>
    </footer>
  );
}
