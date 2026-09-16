import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ApiErrorState } from "@/components/layout/api-error-state";
import { RefreshButton } from "@/components/layout/refresh-button";
import { OrderStatusTimeline } from "@/components/order/order-status-timeline";
import { RememberOrder } from "@/components/order/remember-order";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { tryLoad } from "@/lib/api/load";
import { getOrderByReference } from "@/lib/api/orders";
import { ORDER_STATUS_TONE, type StatusTone } from "@/lib/domain/status";
import { formatDateTime, formatPrice } from "@/lib/i18n/formats";
import { buildAlternates } from "@/lib/seo/metadata";
import { getStoreContext } from "@/lib/store/context";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/i18n/status-labels";

const TONE_TO_BADGE: Record<StatusTone, BadgeVariant> = {
  neutral: "neutral",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

export async function generateMetadata(
  props: PageProps<"/[locale]/order-success/[reference]">,
): Promise<Metadata> {
  const { reference } = await props.params;
  const { dict, locale } = await getStoreContext();

  return {
    title: `${dict.order.successTitle} · ${reference}`,
    robots: { index: false, follow: false },
    alternates: buildAlternates(locale, `/order-success/${reference}`),
  };
}

/**
 * Order confirmation.
 *
 * The order is re-read from the POS so the customer sees the shop's own view of
 * it. If the record is not readable yet (or the API key lacks `orders.read`), the
 * page still confirms the order with its reference rather than implying failure —
 * the order exists, we simply cannot display it.
 */
export default async function OrderSuccessPage(
  props: PageProps<"/[locale]/order-success/[reference]">,
) {
  const { reference } = await props.params;
  const { dict, href, locale, currencyCode } = await getStoreContext();

  const result = await tryLoad(() => getOrderByReference(reference));
  const order = result.ok ? result.data : null;

  return (
    <div className="container-page py-6 sm:py-10">
      <RememberOrder />

      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[{ label: dict.nav.home, href: href("/") }, { label: dict.order.successTitle }]}
      />

      <div className="mx-auto mt-6 max-w-3xl">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-success-muted text-success-foreground">
            <CheckCircle2 aria-hidden="true" className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-h1 text-foreground">{dict.order.successTitle}</h1>
            <p className="mt-1 text-body text-muted-foreground">{dict.order.successSubtitle}</p>
          </div>
        </div>

        <Card className="mt-6">
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-micro text-muted-foreground">{dict.order.reference}</p>
                <p className="mt-0.5 font-mono text-h4 font-bold break-all text-foreground">
                  {reference}
                </p>
              </div>
              {order ? (
                <Badge variant={TONE_TO_BADGE[ORDER_STATUS_TONE[order.status]]} size="md" dot>
                  {orderStatusLabel(dict, order.status)}
                </Badge>
              ) : null}
            </div>

            <p className="text-small text-muted-foreground">{dict.order.keepReference}</p>

            {!result.ok ? (
              <ApiErrorState
                error={result.error}
                dict={dict}
                variant="inline"
                title={dict.order.pendingSync}
                retrySlot={<RefreshButton label={dict.common.retry} variant="outline" size="sm" />}
              />
            ) : !order ? (
              <Alert variant="info" title={dict.order.pendingSync}>
                <p>{dict.order.pendingSyncHint}</p>
              </Alert>
            ) : (
              <>
                <OrderStatusTimeline
                  status={order.status}
                  rawStatus={order.rawStatus}
                  dict={dict}
                />

                <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border text-small">
                  <div className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-muted-foreground">{dict.order.date}</dt>
                    <dd className="text-right font-medium text-foreground">
                      {formatDateTime(order.date, locale)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-muted-foreground">{dict.order.payment}</dt>
                    <dd className="text-right font-medium text-foreground">
                      {paymentStatusLabel(dict, order.paymentStatus)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-muted-foreground">{dict.order.paymentMethod}</dt>
                    <dd className="text-right font-medium text-foreground">
                      {order.paymentMethod || "—"}
                    </dd>
                  </div>
                  {order.customer.name ? (
                    <div className="flex justify-between gap-4 px-4 py-2.5">
                      <dt className="text-muted-foreground">{dict.order.customer}</dt>
                      <dd className="text-right font-medium text-foreground">
                        {order.customer.name}
                      </dd>
                    </div>
                  ) : null}
                  {order.note ? (
                    <div className="flex justify-between gap-4 px-4 py-2.5">
                      <dt className="text-muted-foreground">{dict.track.note}</dt>
                      <dd className="max-w-[60%] text-right font-medium break-words text-foreground">
                        {order.note}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {order.items.length > 0 ? (
                  <div>
                    <h2 className="text-h4 text-foreground">{dict.order.items}</h2>
                    <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border">
                      {order.items.map((item, index) => (
                        <li
                          key={`${item.productId}-${index}`}
                          className="flex items-start justify-between gap-3 px-4 py-2.5 text-small"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-foreground">
                              {item.productName}
                            </span>
                            <span className="text-caption text-muted-foreground tabular-nums">
                              {formatPrice(item.unitPrice, locale, currencyCode)} × {item.quantity}
                            </span>
                          </span>
                          <span className="shrink-0 font-medium tabular-nums text-foreground">
                            {formatPrice(item.total, locale, currencyCode)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="text-body-lg font-semibold text-foreground">
                    {dict.order.total}
                  </span>
                  <span className="text-h3 font-bold text-foreground tabular-nums">
                    {formatPrice(order.grandTotal, locale, currencyCode)}
                  </span>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href={href("/shop")} className={buttonVariants({ size: "lg" })}>
            {dict.common.continueShopping}
          </Link>
          <Link
            href={`${href("/track-order")}?ref=${encodeURIComponent(reference)}`}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <Clock aria-hidden="true" className="size-4" />
            {dict.order.trackOrder}
          </Link>
        </div>
      </div>
    </div>
  );
}
