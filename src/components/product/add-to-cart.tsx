"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShoppingBasket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/lib/cart/hooks";
import { toCartLine } from "@/lib/cart/line";
import { canSellByBox, maxQuantityFor, type Product, type SellMode } from "@/lib/domain/product";
import { formatPrice } from "@/lib/i18n/formats";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/cn";

export interface AddToCartLabels {
  addToCart: string;
  outOfStock: string;
  addedToCart: string;
  decrease: string;
  increase: string;
  quantity: string;
  soldByPiece: string;
  soldByBox: string;
  maxReached: string;
  viewCart: string;
}

/**
 * Add-to-cart with the quantity controls that replace it once the item is in the
 * basket.
 *
 * Optimistic by construction: the cart is an external store, so the count and the
 * stepper update in the same tick as the click, with a toast confirming it.
 */
export function AddToCartControl({
  product,
  locale,
  currencyCode,
  cartHref,
  labels,
  /** Enables the piece/box switch on the product page. */
  allowBoxMode = false,
  size = "md",
  fullWidth = false,
  /**
   * Product-card mode: the control fills the card and drops its label below
   * `sm`, where the text simply does not fit a 2-up grid tile. The icon and the
   * accessible name remain, so nothing is lost for screen readers.
   */
  compact = false,
  /** Controlled piece/box selection, so two mounts can share one choice. */
  sellMode: controlledSellMode,
  onSellModeChange,
}: {
  product: Product;
  locale: Locale;
  currencyCode: string;
  cartHref: string;
  labels: AddToCartLabels;
  allowBoxMode?: boolean;
  size?: "md" | "lg";
  fullWidth?: boolean;
  compact?: boolean;
  sellMode?: SellMode;
  onSellModeChange?: (mode: SellMode) => void;
}) {
  const { lines, actions } = useCart();
  const { toast } = useToast();
  const [internalSellMode, setInternalSellMode] = useState<SellMode>("piece");

  const sellMode = controlledSellMode ?? internalSellMode;
  const setSellMode = onSellModeChange ?? setInternalSellMode;

  const max = maxQuantityFor(product, sellMode);
  const available = max > 0;
  const line = lines.find((item) => item.productId === product.id && item.sellMode === sellMode);
  const showBoxMode = allowBoxMode && canSellByBox(product);

  function handleAdd() {
    actions.add(toCartLine(product, sellMode), 1);
    toast({
      title: labels.addedToCart,
      description: product.name,
      variant: "success",
    });
  }

  return (
    <div className={cn("space-y-2", fullWidth && "w-full")}>
      {showBoxMode ? (
        <fieldset className="flex gap-1.5 rounded-lg border border-border p-1">
          <legend className="sr-only">{labels.quantity}</legend>
          {(
            [
              ["piece", labels.soldByPiece, product.price],
              ["box", labels.soldByBox, product.boxPrice],
            ] as const
          ).map(([mode, label, price]) => {
            const disabled = maxQuantityFor(product, mode) <= 0;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setSellMode(mode)}
                disabled={disabled}
                aria-pressed={sellMode === mode}
                className={cn(
                  "flex min-h-11 min-w-0 flex-1 flex-wrap items-center justify-center gap-x-1 rounded-md px-2 py-1.5",
                  "text-caption font-semibold transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-45",
                  sellMode === mode
                    ? "bg-primary-muted text-primary-strong"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <span>{label}</span>
                <span className="font-normal tabular-nums">
                  {formatPrice(price, locale, currencyCode)}
                </span>
              </button>
            );
          })}
        </fieldset>
      ) : null}

      {!available ? (
        <Button variant="outline" size={size} fullWidth={fullWidth} disabled>
          {labels.outOfStock}
        </Button>
      ) : line ? (
        <div className={cn("flex flex-wrap items-center gap-2", fullWidth && "justify-between")}>
          <QuantityStepper
            value={line.quantity}
            max={max}
            size={size === "lg" ? "md" : "sm"}
            onChange={(next) => actions.setQuantity(product.id, sellMode, next)}
            labels={{
              decrease: labels.decrease,
              increase: labels.increase,
              quantity: labels.quantity,
            }}
          />
          {line.quantity >= max ? (
            <span className="text-caption text-warning-foreground">{labels.maxReached}</span>
          ) : null}
          <Link
            href={cartHref}
            className="inline-flex items-center gap-1 text-caption font-semibold text-primary underline-offset-4 hover:underline"
          >
            <Check aria-hidden="true" className="size-3.5" />
            {labels.viewCart}
          </Link>
        </div>
      ) : (
        <Button
          size={size}
          fullWidth={fullWidth || compact}
          onClick={handleAdd}
          aria-label={compact ? labels.addToCart : undefined}
          leadingIcon={<ShoppingBasket aria-hidden="true" className="size-4" />}
        >
          {compact ? (
            <span className="hidden truncate sm:inline">{labels.addToCart}</span>
          ) : (
            labels.addToCart
          )}
        </Button>
      )}
    </div>
  );
}
