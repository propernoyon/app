"use client";

import Image from "next/image";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/lib/cart/hooks";
import { useRecentLines } from "@/lib/cart/history";
import { formatPrice } from "@/lib/i18n/formats";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { SectionHeading } from "./section-heading";

/**
 * "Buy it again" rail.
 *
 * Reads the basket lines remembered after the last order (see
 * `lib/cart/history.ts`), so it needs no API call and shows nothing at all until
 * the customer has ordered once — no empty-state noise on a first visit.
 */
export function ReorderSection({
  dict,
  locale,
  currencyCode,
  cartHref,
}: {
  dict: Dictionary;
  locale: Locale;
  currencyCode: string;
  cartHref: string;
}) {
  const lines = useRecentLines();
  const { actions } = useCart();
  const { toast } = useToast();

  if (lines.length === 0) return null;

  function addAll() {
    for (const line of lines) {
      actions.add(line, line.quantity);
    }
    toast({
      title: dict.common.addedToCart,
      description: dict.home.reorderTitle,
      variant: "success",
    });
  }

  return (
    <section className="container-page py-10 sm:py-12">
      <SectionHeading
        title={dict.home.reorderTitle}
        subtitle={dict.home.reorderSubtitle}
        actionHref={cartHref}
        actionLabel={dict.common.viewCart}
      />

      <div className="mt-6 flex flex-col gap-4">
        <ul className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
          {lines.map((line) => (
            <li
              key={`${line.productId}:${line.sellMode}`}
              className="w-40 shrink-0 snap-start rounded-card border border-border bg-card p-3 shadow-card sm:w-44"
            >
              <div className="relative mb-2.5 aspect-square overflow-hidden rounded-lg bg-muted">
                <Image
                  src={line.imageUrl || "/images/placeholder-product.svg"}
                  alt=""
                  fill
                  sizes="176px"
                  className={
                    line.imageSource === "placeholder" ? "object-contain p-4" : "object-cover"
                  }
                />
              </div>
              <p className="line-clamp-2 text-small font-semibold text-foreground">{line.name}</p>
              <p className="mt-1 text-caption text-muted-foreground tabular-nums">
                {formatPrice(line.unitPrice, locale, currencyCode)} · ×{line.quantity}
              </p>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={addAll}
            leadingIcon={<RotateCcw aria-hidden="true" className="size-4" />}
          >
            {dict.home.reorderCta}
          </Button>
          <Link href={cartHref} className={buttonVariants({ variant: "outline" })}>
            {dict.common.viewCart}
          </Link>
        </div>
      </div>
    </section>
  );
}
