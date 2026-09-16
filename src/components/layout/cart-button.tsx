"use client";

import Link from "next/link";
import { ShoppingBasket } from "lucide-react";

import { useCart } from "@/lib/cart/hooks";
import { cn } from "@/lib/utils/cn";

/**
 * Cart entry point with a live item count.
 *
 * The count only renders after hydration, because the server (and the first
 * client render) always sees an empty cart — rendering the real number earlier
 * would cause a hydration mismatch.
 */
export function CartButton({
  href,
  label,
  itemCountTemplateOne,
  itemCountTemplateOther,
  className,
}: {
  href: string;
  label: string;
  itemCountTemplateOne: string;
  itemCountTemplateOther: string;
  className?: string;
}) {
  const { itemCount, hydrated } = useCart();
  const showCount = hydrated && itemCount > 0;

  const accessibleLabel = showCount
    ? `${label} — ${
        itemCount === 1
          ? itemCountTemplateOne
          : itemCountTemplateOther.replace("{count}", String(itemCount))
      }`
    : label;

  return (
    <Link
      href={href}
      aria-label={accessibleLabel}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-lg text-foreground",
        "transition-colors duration-150 hover:bg-muted",
        className,
      )}
    >
      <ShoppingBasket aria-hidden="true" className="size-5" />
      {showCount ? (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] leading-none font-bold text-primary-foreground tabular-nums"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </Link>
  );
}
