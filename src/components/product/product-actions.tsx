"use client";

import { useEffect, useRef, useState } from "react";

import { Price } from "@/components/ui/price";
import type { Product, SellMode } from "@/lib/domain/product";
import { isOutOfStock } from "@/lib/domain/product";
import type { Locale } from "@/lib/i18n/config";
import { AddToCartControl, type AddToCartLabels } from "./add-to-cart";

/**
 * Product page actions.
 *
 * The page shows the same control twice — inline in the information column on
 * desktop, and in the fixed bottom bar on mobile/tablet. Rendering two
 * independent `AddToCartControl`s meant two pieces of `sellMode` state that could
 * disagree (pick "box" in one, switch viewport, and the other silently resets).
 * Holding the state here and driving both from it removes that class of bug.
 *
 * A `position: fixed` child is taken out of flow, so the bar can be rendered from
 * inside the column without affecting the layout.
 */
export function ProductActions({
  product,
  locale,
  currencyCode,
  cartHref,
  labels,
  price,
  unavailableLabel,
  outOfStockLabel,
}: {
  product: Product;
  locale: Locale;
  currencyCode: string;
  cartHref: string;
  labels: AddToCartLabels;
  /** Price already formatted on the server. */
  price: string;
  unavailableLabel: string;
  outOfStockLabel: string;
}) {
  const [sellMode, setSellMode] = useState<SellMode>("piece");
  const outOfStock = isOutOfStock(product);
  const barRef = useRef<HTMLDivElement>(null);

  /*
   * The bar's height is not a constant: the box/piece switch wraps its labels on
   * narrow screens, and the stepper replaces the button once the item is in the
   * basket. A fixed guess for its height would leave the toast dock — and the
   * page's bottom padding — misaligned with the real bar, so publish the measured
   * height as a custom property and let both consume it.
   */
  useEffect(() => {
    const node = barRef.current;
    if (!node) return;

    const root = document.documentElement;
    const observer = new ResizeObserver(([entry]) => {
      const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      root.style.setProperty("--mm-action-bar-height", `${Math.round(height)}px`);
    });

    observer.observe(node);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--mm-action-bar-height");
    };
  }, []);

  return (
    <>
      <div className="mt-6 hidden lg:block">
        {outOfStock ? (
          <p className="rounded-lg border border-danger-border bg-danger-muted px-4 py-3 text-small font-semibold text-danger-foreground">
            {unavailableLabel}
          </p>
        ) : (
          <AddToCartControl
            product={product}
            locale={locale}
            currencyCode={currencyCode}
            cartHref={cartHref}
            labels={labels}
            allowBoxMode
            size="lg"
            fullWidth
            sellMode={sellMode}
            onSellModeChange={setSellMode}
          />
        )}
      </div>

      {/* Mobile action bar: the primary action stays reachable with one thumb. */}
      <div
        ref={barRef}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 pt-3 pb-safe backdrop-blur-md lg:hidden"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 shrink-0">
            <Price value={price} size="md" className="truncate" />
          </div>
          <div className="ml-auto min-w-0 flex-1">
            {outOfStock ? (
              <p className="text-right text-caption font-semibold text-danger-foreground">
                {outOfStockLabel}
              </p>
            ) : (
              <AddToCartControl
                product={product}
                locale={locale}
                currencyCode={currencyCode}
                cartHref={cartHref}
                labels={labels}
                allowBoxMode
                fullWidth
                sellMode={sellMode}
                onSellModeChange={setSellMode}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
