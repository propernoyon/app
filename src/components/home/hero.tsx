import Link from "next/link";
import { Clock, ShieldCheck, Sparkles, Truck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Home hero.
 *
 * Built from typography, a brand-tinted panel and CSS only — no hero image to
 * download, so the largest contentful paint is text and arrives immediately.
 */
export function Hero({
  dict,
  shopHref,
  trackHref,
  storeName,
}: {
  dict: Dictionary;
  shopHref: string;
  trackHref: string;
  storeName: string;
}) {
  const points = [
    { icon: Truck, label: dict.common.freeDelivery },
    { icon: Sparkles, label: dict.common.freshDaily },
    { icon: ShieldCheck, label: dict.common.secureCheckout },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary-muted to-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary-border/40 blur-3xl"
      />
      <div className="container-page relative py-12 sm:py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-primary-border bg-surface/80 px-3 py-1 text-caption font-semibold text-primary-strong">
            <Clock aria-hidden="true" className="size-3.5" />
            {dict.home.heroBadge}
          </p>

          <h1 className="mt-4 text-display text-foreground">{dict.home.heroTitle}</h1>
          <p className="mt-3 max-w-xl text-body-lg text-subtle-foreground">
            {dict.home.heroSubtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href={shopHref} className={buttonVariants({ size: "lg" })}>
              {dict.home.heroCta}
            </Link>
            <Link href={trackHref} className={buttonVariants({ variant: "outline", size: "lg" })}>
              {dict.home.heroSecondaryCta}
            </Link>
          </div>

          <dl className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
            {points.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />
                <dt className="sr-only">{storeName}</dt>
                <dd className="text-small font-medium text-subtle-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
