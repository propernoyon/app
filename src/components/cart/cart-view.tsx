"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, PackageOpen, ShoppingBasket, Trash2 } from "lucide-react";

import { checkAvailabilityAction } from "@/app/actions/checkout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Price } from "@/components/ui/price";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/lib/cart/hooks";
import {
  cartLineKey,
  cartLineTotal,
  hasAgeRestrictedLines,
  type CartLine,
} from "@/lib/domain/cart";
import { formatPrice } from "@/lib/i18n/formats";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/cn";

export interface CartLabels {
  title: string;
  empty: string;
  emptyHint: string;
  emptyCta: string;
  itemCount: string;
  itemCountOne: string;
  quantity: string;
  lineTotal: string;
  perBox: string;
  remove: string;
  removeConfirmTitle: string;
  removeConfirmBody: string;
  cancel: string;
  clear: string;
  clearConfirmTitle: string;
  clearConfirmBody: string;
  subtotal: string;
  total: string;
  deliveryNote: string;
  checkout: string;
  continueShopping: string;
  stockChanged: string;
  stockChangedHint: string;
  maxQuantity: string;
  ageNotice: string;
  ageNoticeBody: string;
  savedLocally: string;
  decrease: string;
  increase: string;
  checkAvailability: string;
  availabilityOk: string;
  availabilityError: string;
}

/**
 * The cart.
 *
 * Rendered client-side because the basket lives in this browser. Quantity
 * changes are optimistic (they hit the external store immediately); stock is
 * re-validated only when the customer asks, or again at checkout.
 */
export function CartView({
  labels,
  locale,
  currencyCode,
  shopHref,
  checkoutHref,
  productHrefBase,
}: {
  labels: CartLabels;
  locale: Locale;
  currencyCode: string;
  shopHref: string;
  checkoutHref: string;
  /** Locale-prefixed `/product` path; the id is appended per line. */
  productHrefBase: string;
}) {
  const { lines, subtotal, itemCount, hydrated, actions } = useCart();
  const { toast } = useToast();
  const [pendingRemove, setPendingRemove] = useState<CartLine | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [availability, setAvailability] = useState<"ok" | "changed" | "error" | null>(null);
  const [isChecking, startTransition] = useTransition();

  if (!hydrated) {
    return (
      <div className="space-y-3" role="status" aria-label={labels.title}>
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-card" />
        ))}
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBasket className="size-6" />}
        title={labels.empty}
        description={labels.emptyHint}
        action={
          <Link href={shopHref} className={buttonVariants({ size: "lg" })}>
            {labels.emptyCta}
          </Link>
        }
      />
    );
  }

  const productHref = (id: number) => `${productHrefBase}/${id}`;

  const countLabel =
    itemCount === 1 ? labels.itemCountOne : labels.itemCount.replace("{count}", String(itemCount));

  function checkAvailability() {
    setAvailability(null);
    startTransition(async () => {
      const result = await checkAvailabilityAction(
        lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          sellMode: line.sellMode,
        })),
      );

      if (result.status === "changed") {
        const limits: Record<string, number> = {};
        for (const issue of result.issues) {
          limits[cartLineKey(issue.productId, issue.sellMode)] = issue.available;
        }
        actions.clamp(limits);
        setAvailability("changed");
        toast({
          title: labels.stockChanged,
          description: labels.stockChangedHint,
          variant: "warning",
        });
        return;
      }

      setAvailability(result.status === "ok" ? "ok" : "error");
      if (result.status === "ok") {
        toast({ title: labels.availabilityOk, variant: "success" });
      } else {
        toast({ title: labels.availabilityError, variant: "error" });
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div>
        <ul className="space-y-3">
          {lines.map((line) => (
            <li key={cartLineKey(line.productId, line.sellMode)}>
              <Card className="p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  <Link
                    href={productHref(line.productId)}
                    className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24"
                  >
                    <Image
                      src={line.imageUrl || "/images/placeholder-product.svg"}
                      alt=""
                      fill
                      sizes="96px"
                      className={
                        line.imageSource === "placeholder" ? "object-contain p-3" : "object-cover"
                      }
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-body-lg leading-snug font-semibold text-foreground">
                          <Link
                            href={productHref(line.productId)}
                            className="underline-offset-4 hover:underline"
                          >
                            {line.name}
                          </Link>
                        </h2>
                        <p className="mt-0.5 text-caption text-muted-foreground tabular-nums">
                          {formatPrice(line.unitPrice, locale, currencyCode)}
                          {line.sellMode === "box" ? ` / ${labels.perBox}` : ""}
                          {line.sku ? ` · ${line.sku}` : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPendingRemove(line)}
                        aria-label={`${labels.remove}: ${line.name}`}
                        className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-muted hover:text-danger-foreground"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                      <QuantityStepper
                        value={line.quantity}
                        max={line.maxQuantity ?? undefined}
                        onChange={(next) =>
                          actions.setQuantity(line.productId, line.sellMode, next)
                        }
                        labels={{
                          decrease: labels.decrease,
                          increase: labels.increase,
                          quantity: labels.quantity,
                        }}
                      />
                      <Price
                        value={formatPrice(cartLineTotal(line), locale, currencyCode)}
                        size="md"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" loading={isChecking} onClick={checkAvailability}>
            {labels.checkAvailability}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
            {labels.clear}
          </Button>
        </div>

        {availability === "changed" ? (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-warning-border bg-warning-muted p-3 text-small text-warning-foreground">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong className="font-semibold">{labels.stockChanged}.</strong>{" "}
              {labels.stockChangedHint}
            </span>
          </p>
        ) : null}

        {hasAgeRestrictedLines(lines) ? (
          <p className="mt-3 rounded-lg border border-border bg-muted p-3 text-small text-subtle-foreground">
            <strong className="font-semibold text-foreground">{labels.ageNotice}.</strong>{" "}
            {labels.ageNoticeBody}
          </p>
        ) : null}
      </div>

      <Card className="lg:sticky lg:top-24">
        <CardBody className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-h4 text-foreground">{labels.subtotal}</h2>
            <p className="text-caption text-muted-foreground">{countLabel}</p>
          </div>

          <dl className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-small text-muted-foreground">{labels.subtotal}</dt>
              <dd className="text-small font-medium text-foreground tabular-nums">
                {formatPrice(subtotal, locale, currencyCode)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
              <dt className="text-body-lg font-semibold text-foreground">{labels.total}</dt>
              <dd className="text-h4 font-bold text-foreground tabular-nums">
                {formatPrice(subtotal, locale, currencyCode)}
              </dd>
            </div>
          </dl>

          <p className="text-caption text-muted-foreground">{labels.deliveryNote}</p>

          <Link href={checkoutHref} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
            {labels.checkout}
          </Link>

          <Link href={shopHref} className={cn(buttonVariants({ variant: "ghost" }), "w-full")}>
            <PackageOpen aria-hidden="true" className="size-4" />
            {labels.continueShopping}
          </Link>

          <p className="text-center text-caption text-muted-foreground">{labels.savedLocally}</p>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        title={labels.removeConfirmTitle}
        description={pendingRemove?.name}
        confirmLabel={labels.remove}
        cancelLabel={labels.cancel}
        destructive
        onConfirm={() => {
          if (pendingRemove) {
            actions.remove(pendingRemove.productId, pendingRemove.sellMode);
          }
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title={labels.clearConfirmTitle}
        description={labels.clearConfirmBody}
        confirmLabel={labels.clear}
        cancelLabel={labels.cancel}
        destructive
        onConfirm={() => actions.clear()}
      />
    </div>
  );
}
