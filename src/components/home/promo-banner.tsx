import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Promotional banner. Copy lives in the message catalogues, so it is translatable. */
export function PromoBanner({ dict, shopHref }: { dict: Dictionary; shopHref: string }) {
  return (
    <section className="container-page py-4 sm:py-6">
      <div className="relative overflow-hidden rounded-2xl bg-brand-700 px-6 py-8 text-on-brand sm:px-10 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-brand-500/40 blur-2xl"
        />
        <div className="relative max-w-xl">
          <p className="text-micro text-brand-100">{dict.home.promoBadge}</p>
          <h2 className="mt-2 text-h2 text-on-brand">{dict.home.promoTitle}</h2>
          <p className="mt-2 text-body text-brand-100">{dict.home.promoBody}</p>
          <Link
            href={shopHref}
            className={`mt-6 ${buttonVariants({ variant: "secondary", size: "md" })}`}
          >
            {dict.home.heroCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
