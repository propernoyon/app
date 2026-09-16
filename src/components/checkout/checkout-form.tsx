"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Store, Truck } from "lucide-react";

import { submitOrderAction } from "@/app/actions/checkout";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectField, TextField, TextareaField } from "@/components/ui/field";
import { Price } from "@/components/ui/price";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/lib/cart/hooks";
import { cartLineKey, cartLineTotal, hasAgeRestrictedLines } from "@/lib/domain/cart";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/domain/order";
import { formatPrice, interpolate } from "@/lib/i18n/formats";
import type { Locale } from "@/lib/i18n/config";
import { CHECKOUT_MESSAGE_KEYS, INITIAL_CHECKOUT_STATE } from "@/lib/validation/checkout";
import { cn } from "@/lib/utils/cn";

export interface CheckoutLabels {
  title: string;
  stepCustomer: string;
  stepFulfilment: string;
  stepReview: string;
  customerTitle: string;
  customerSubtitle: string;
  fullName: string;
  fullNamePlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  emailHint: string;
  optional: string;
  fulfilmentTitle: string;
  fulfilmentSubtitle: string;
  delivery: string;
  pickup: string;
  deliveryHint: string;
  pickupHint: string;
  deliveryAddress: string;
  deliveryAddressPlaceholder: string;
  note: string;
  noteHint: string;
  paymentMethod: string;
  paymentNote: string;
  paymentCash: string;
  paymentBank: string;
  paymentMobile: string;
  paymentCredit: string;
  reviewTitle: string;
  reviewSubtitle: string;
  orderSummary: string;
  placeOrder: string;
  placing: string;
  backToCart: string;
  back: string;
  next: string;
  edit: string;
  required: string;
  invalidEmail: string;
  invalidPhone: string;
  agreeAge: string;
  agreeAgeRequired: string;
  stockWarning: string;
  stockWarningHint: string;
  fixCart: string;
  errorTitle: string;
  errorBody: string;
  emptyRedirect: string;
  continueShopping: string;
  subtotal: string;
  total: string;
  onlyAvailable: string;
}

const STEPS = [1, 2, 3] as const;
type Step = (typeof STEPS)[number];

/** i18n key → sentence, for messages the server sends back. */
function resolveMessage(labels: CheckoutLabels, key: string | undefined): string | undefined {
  if (!key) return undefined;
  switch (key) {
    case CHECKOUT_MESSAGE_KEYS.required:
      return labels.required;
    case CHECKOUT_MESSAGE_KEYS.invalidEmail:
      return labels.invalidEmail;
    case CHECKOUT_MESSAGE_KEYS.invalidPhone:
      return labels.invalidPhone;
    case CHECKOUT_MESSAGE_KEYS.agreeAge:
      return labels.agreeAgeRequired;
    default:
      return labels.errorBody;
  }
}

/**
 * Multi-step checkout.
 *
 * All three steps live in one real `<form>`, so it still submits without
 * JavaScript. Client-side checks only decide whether the customer may advance;
 * the Server Action re-validates everything and is the authority. A failed
 * submission keeps every value the customer typed.
 */
export function CheckoutForm({
  labels,
  locale,
  currencyCode,
  cartHref,
  shopHref,
}: {
  labels: CheckoutLabels;
  locale: Locale;
  currencyCode: string;
  cartHref: string;
  shopHref: string;
}) {
  const { lines, subtotal, hydrated, actions } = useCart();
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(submitOrderAction, INITIAL_CHECKOUT_STATE);
  const [step, setStep] = useState<Step>(1);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const ageRequired = hasAgeRestrictedLines(lines);

  if (!hydrated) {
    return <div className="h-64 rounded-card border border-border bg-surface" aria-busy="true" />;
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        title={labels.emptyRedirect}
        action={
          <Link href={shopHref} className={buttonVariants({ size: "lg" })}>
            {labels.continueShopping}
          </Link>
        }
      />
    );
  }

  // Server field errors arrive as i18n keys, so they are resolved to sentences
  // here; client-side checks already produce sentences.
  const serverErrors: Record<string, string> =
    state.status === "invalid"
      ? Object.fromEntries(
          Object.entries(state.fieldErrors).map(([field, key]) => [
            field,
            resolveMessage(labels, key) ?? labels.required,
          ]),
        )
      : {};
  const errors = { ...clientErrors, ...serverErrors };

  function validateStep(current: Step): boolean {
    const next: Record<string, string> = {};

    if (current === 1) {
      if (fullName.trim().length < 2) next.fullName = labels.required;
      const digits = phone.replace(/[\s\-().]/g, "");
      if (!/^\+?\d{6,15}$/.test(digits)) next.phone = labels.invalidPhone;
      if (email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
        next.email = labels.invalidEmail;
      }
    }

    if (current === 2 && fulfilment === "delivery" && address.trim().length < 5) {
      next.address = labels.required;
    }

    setClientErrors(next);
    return Object.keys(next).length === 0;
  }

  function goToStep(next: Step) {
    if (next > step && !validateStep(step)) return;
    setStep(next);
  }

  const linesPayload = JSON.stringify(
    lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      sellMode: line.sellMode,
    })),
  );

  const stepIndex = STEPS.indexOf(step);
  const stepTitles = [labels.stepCustomer, labels.stepFulfilment, labels.stepReview];

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      {/* Hidden, authoritative payload */}
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="lines" value={linesPayload} />
      <input type="hidden" name="fulfilment" value={fulfilment} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      <input type="hidden" name="ageRequired" value={ageRequired ? "1" : "0"} />

      <div className="min-w-0">
        <ol className="flex flex-wrap items-center gap-2" aria-label={labels.title}>
          {STEPS.map((item, index) => {
            const isCurrent = item === step;
            const isDone = index < stepIndex;
            return (
              <li key={item} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToStep(item)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-full border px-3 text-caption font-semibold transition-colors",
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground"
                      : isDone
                        ? "border-success-border bg-success-muted text-success-foreground"
                        : "border-border bg-surface text-muted-foreground hover:bg-muted",
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 aria-hidden="true" className="size-3.5" />
                  ) : (
                    <span aria-hidden="true">{index + 1}</span>
                  )}
                  {stepTitles[index]}
                </button>
                {index < STEPS.length - 1 ? (
                  <span aria-hidden="true" className="h-px w-4 bg-border" />
                ) : null}
              </li>
            );
          })}
        </ol>

        <Card className="mt-5">
          <CardBody className="space-y-5">
            <div className={step === 1 ? "space-y-5" : "hidden"}>
              <header>
                <h2 className="text-h3 text-foreground">{labels.customerTitle}</h2>
                <p className="mt-1 text-small text-muted-foreground">{labels.customerSubtitle}</p>
              </header>

              <TextField
                id="fullName"
                name="fullName"
                label={labels.fullName}
                placeholder={labels.fullNamePlaceholder}
                autoComplete="name"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                error={errors.fullName}
              />
              <TextField
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                label={labels.phone}
                placeholder={labels.phonePlaceholder}
                autoComplete="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                error={errors.phone}
              />
              <TextField
                id="email"
                name="email"
                type="email"
                inputMode="email"
                label={labels.email}
                placeholder={labels.emailPlaceholder}
                hint={labels.emailHint}
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={errors.email}
              />
            </div>

            <div className={step === 2 ? "space-y-5" : "hidden"}>
              <header>
                <h2 className="text-h3 text-foreground">{labels.fulfilmentTitle}</h2>
                <p className="mt-1 text-small text-muted-foreground">{labels.fulfilmentSubtitle}</p>
              </header>

              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="sr-only">{labels.fulfilmentTitle}</legend>
                {(["delivery", "pickup"] as const).map((option) => {
                  const Icon = option === "delivery" ? Truck : Store;
                  const isActive = fulfilment === option;
                  return (
                    <label
                      key={option}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                        isActive
                          ? "border-primary bg-primary-muted"
                          : "border-border bg-surface hover:bg-muted",
                      )}
                    >
                      <input
                        type="radio"
                        name="fulfilmentChoice"
                        value={option}
                        checked={isActive}
                        onChange={() => setFulfilment(option)}
                        className="mt-0.5 size-4 text-primary focus:ring-primary"
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-body-lg font-semibold text-foreground">
                          <Icon aria-hidden="true" className="size-4" />
                          {option === "delivery" ? labels.delivery : labels.pickup}
                        </span>
                        <span className="mt-0.5 block text-small text-muted-foreground">
                          {option === "delivery" ? labels.deliveryHint : labels.pickupHint}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>

              <div className={fulfilment === "delivery" ? "block" : "hidden"}>
                <TextareaField
                  id="address"
                  name="address"
                  label={labels.deliveryAddress}
                  placeholder={labels.deliveryAddressPlaceholder}
                  autoComplete="street-address"
                  rows={3}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  error={errors.address}
                />
              </div>

              <TextareaField
                id="note"
                name="note"
                label={`${labels.note} (${labels.optional})`}
                hint={labels.noteHint}
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />

              <SelectField
                id="payment"
                label={labels.paymentMethod}
                hint={labels.paymentNote}
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method === "cash"
                      ? labels.paymentCash
                      : method === "bank"
                        ? labels.paymentBank
                        : method === "mobile"
                          ? labels.paymentMobile
                          : labels.paymentCredit}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className={step === 3 ? "space-y-5" : "hidden"}>
              <header>
                <h2 className="text-h3 text-foreground">{labels.reviewTitle}</h2>
                <p className="mt-1 text-small text-muted-foreground">{labels.reviewSubtitle}</p>
              </header>

              <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border text-small">
                <div className="flex justify-between gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">{labels.fullName}</dt>
                  <dd className="text-right font-medium text-foreground">{fullName}</dd>
                </div>
                <div className="flex justify-between gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">{labels.phone}</dt>
                  <dd className="text-right font-medium text-foreground">{phone}</dd>
                </div>
                {email ? (
                  <div className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-muted-foreground">{labels.email}</dt>
                    <dd className="text-right font-medium text-foreground">{email}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">{labels.fulfilmentTitle}</dt>
                  <dd className="text-right font-medium text-foreground">
                    {fulfilment === "delivery" ? labels.delivery : labels.pickup}
                  </dd>
                </div>
                {fulfilment === "delivery" ? (
                  <div className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-muted-foreground">{labels.deliveryAddress}</dt>
                    <dd className="max-w-[60%] text-right font-medium break-words text-foreground">
                      {address}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">{labels.paymentMethod}</dt>
                  <dd className="text-right font-medium text-foreground">
                    <CreditCard aria-hidden="true" className="mr-1 inline size-3.5" />
                    {paymentMethod === "cash"
                      ? labels.paymentCash
                      : paymentMethod === "bank"
                        ? labels.paymentBank
                        : paymentMethod === "mobile"
                          ? labels.paymentMobile
                          : labels.paymentCredit}
                  </dd>
                </div>
              </dl>

              {state.status === "stock" ? (
                <Alert variant="warning" title={labels.stockWarning}>
                  <ul className="mt-2 space-y-1">
                    {state.issues.map((issue) => {
                      const line = lines.find(
                        (item) =>
                          item.productId === issue.productId && item.sellMode === issue.sellMode,
                      );
                      return (
                        <li key={`${issue.productId}:${issue.sellMode}`} className="text-small">
                          {line?.name ?? `#${issue.productId}`} —{" "}
                          {interpolate(labels.onlyAvailable, { count: issue.available })}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const limits: Record<string, number> = {};
                        for (const issue of state.issues) {
                          limits[cartLineKey(issue.productId, issue.sellMode)] = issue.available;
                        }
                        actions.clamp(limits);
                        toast({ title: labels.stockWarning, variant: "warning" });
                      }}
                    >
                      {labels.fixCart}
                    </Button>
                  </div>
                </Alert>
              ) : null}

              {state.status === "error" ? (
                <Alert variant="danger" title={labels.errorTitle}>
                  <p>{labels.errorBody}</p>
                  {state.fieldMessages?.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-small">
                      {state.fieldMessages.slice(0, 5).map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  ) : null}
                </Alert>
              ) : null}

              {ageRequired ? (
                <label className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4">
                  <input
                    type="checkbox"
                    name="ageConfirmed"
                    value="1"
                    required
                    className="mt-0.5 size-4 rounded border-border-strong text-primary focus:ring-primary"
                  />
                  <span className="text-small text-foreground">{labels.agreeAge}</span>
                </label>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              {step > 1 ? (
                <Button variant="ghost" onClick={() => goToStep((step - 1) as Step)}>
                  {labels.back}
                </Button>
              ) : (
                <Link href={cartHref} className={buttonVariants({ variant: "ghost" })}>
                  {labels.backToCart}
                </Link>
              )}

              {step < 3 ? (
                <Button onClick={() => goToStep((step + 1) as Step)} size="lg">
                  {labels.next}
                </Button>
              ) : (
                <Button type="submit" size="lg" loading={isPending}>
                  {isPending ? labels.placing : labels.placeOrder}
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="lg:sticky lg:top-24">
        <CardBody className="space-y-4">
          <h2 className="text-h4 text-foreground">{labels.orderSummary}</h2>

          <ul className="space-y-2.5">
            {lines.map((line) => (
              <li
                key={cartLineKey(line.productId, line.sellMode)}
                className="flex items-start justify-between gap-3 text-small"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{line.name}</span>
                  <span className="text-caption text-muted-foreground tabular-nums">
                    ×{line.quantity}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-foreground">
                  {formatPrice(cartLineTotal(line), locale, currencyCode)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-small text-muted-foreground">{labels.subtotal}</dt>
              <dd className="text-small font-medium text-foreground tabular-nums">
                {formatPrice(subtotal, locale, currencyCode)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
              <dt className="text-body-lg font-semibold text-foreground">{labels.total}</dt>
              <dd>
                <Price value={formatPrice(subtotal, locale, currencyCode)} size="lg" />
              </dd>
            </div>
          </dl>

          <p className="text-caption text-muted-foreground">{labels.paymentNote}</p>
        </CardBody>
      </Card>
    </form>
  );
}
