import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ApiErrorState } from "@/components/layout/api-error-state";
import { RefreshButton } from "@/components/layout/refresh-button";
import { OrderStatusTimeline } from "@/components/order/order-status-timeline";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { tryLoad } from "@/lib/api/load";
import { getOrderByReference, isValidOrderReference } from "@/lib/api/orders";
import { ORDER_STATUS_TONE, type StatusTone } from "@/lib/domain/status";
import { formatDateTime, formatPrice } from "@/lib/i18n/formats";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/i18n/status-labels";
import { buildAlternates } from "@/lib/seo/metadata";
import { getStoreContext } from "@/lib/store/context";
import { firstParam } from "@/lib/utils/params";

const TONE_TO_BADGE: Record<StatusTone, BadgeVariant> = {
  neutral: "neutral",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

export async function generateMetadata(): Promise<Metadata> {
  const { dict, locale } = await getStoreContext();
  return {
    title: dict.track.title,
    description: dict.track.subtitle,
    robots: { index: false, follow: true },
    alternates: buildAlternates(locale, "/track-order"),
  };
}

/**
 * Order tracking.
 *
 * The reference travels in the query string and the lookup happens on the
 * server, so the result is shareable, bookmarkable and works without JavaScript.
 */
export default async function TrackOrderPage(props: PageProps<"/[locale]/track-order">) {
  const searchParams = await props.searchParams;
  const { dict, href, locale, currencyCode } = await getStoreContext();

  const reference = firstParam(searchParams.ref).trim();
  const hasReference = reference.length > 0;
  const validReference = hasReference && isValidOrderReference(reference);

  const result = validReference ? await tryLoad(() => getOrderByReference(reference)) : null;
  const order = result?.ok ? result.data : null;

  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[{ label: dict.nav.home, href: href("/") }, { label: dict.track.title }]}
      />

      <div className="mx-auto mt-6 max-w-2xl">
        <h1 className="text-h1 text-foreground">{dict.track.title}</h1>
        <p className="mt-1.5 text-body text-muted-foreground">{dict.track.subtitle}</p>

        <Card className="mt-6">
          <CardBody>
            <form
              action={href("/track-order")}
              method="get"
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1 space-y-1.5">
                <label
                  htmlFor="reference"
                  className="block text-small font-semibold text-foreground"
                >
                  {dict.track.referenceLabel}
                </label>
                <input
                  id="reference"
                  name="ref"
                  defaultValue={reference}
                  placeholder={dict.track.referencePlaceholder}
                  autoComplete="off"
                  spellCheck={false}
                  className="h-11 w-full rounded-lg border border-input bg-surface px-3 font-mono text-foreground uppercase placeholder:font-sans placeholder:text-muted-foreground hover:border-border-strong focus:border-primary"
                />
                <p className="text-caption text-muted-foreground">{dict.track.helper}</p>
              </div>
              <Button type="submit" size="lg">
                {dict.track.submit}
              </Button>
            </form>
          </CardBody>
        </Card>

        <div className="mt-6">
          {!hasReference ? null : !validReference ? (
            <Alert variant="warning" title={dict.track.invalidReference} />
          ) : result === null ? null : !result.ok ? (
            <ApiErrorState
              error={result.error}
              dict={dict}
              title={dict.track.errorTitle}
              retrySlot={<RefreshButton label={dict.common.retry} />}
            />
          ) : !order ? (
            <EmptyState
              icon={<PackageSearch className="size-6" />}
              title={dict.track.notFound}
              description={dict.track.notFoundHint}
            />
          ) : (
            <Card>
              <CardBody className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-micro text-muted-foreground">{dict.order.reference}</p>
                    <p className="mt-0.5 font-mono text-h4 font-bold break-all text-foreground">
                      {order.reference}
                    </p>
                  </div>
                  <Badge variant={TONE_TO_BADGE[ORDER_STATUS_TONE[order.status]]} size="md" dot>
                    {orderStatusLabel(dict, order.status)}
                  </Badge>
                </div>

                <OrderStatusTimeline
                  status={order.status}
                  rawStatus={order.rawStatus}
                  dict={dict}
                />

                <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border text-small">
                  <div className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-muted-foreground">{dict.track.placedOn}</dt>
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
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
