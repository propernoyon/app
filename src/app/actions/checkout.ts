"use server";

import { redirect } from "next/navigation";

import { toPosApiError } from "@/lib/api/errors";
import { createOrder } from "@/lib/api/orders";
import { checkStock } from "@/lib/api/stock";
import type { CreateOrderInput, PaymentMethod } from "@/lib/domain/order";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/routes";
import {
  CHECKOUT_MESSAGE_KEYS,
  checkoutFieldErrors,
  checkoutSchema,
  composeOrderNote,
  parseCheckoutLines,
  type CheckoutState,
  type CheckoutStockIssue,
  type FulfilmentMethod,
} from "@/lib/validation/checkout";

/* ────────────────────────────────────────────────────────────────────────────
 * Checkout Server Actions.
 *
 * These run on the server, so the POS API key never reaches the browser and the
 * order is submitted from a trusted context. Flow:
 *
 *   validate → re-check stock → age gate → POST /orders → redirect
 *
 * Every failure is returned as a state; nothing is thrown at the customer.
 * ──────────────────────────────────────────────────────────────────────────── */

export async function submitOrderAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const localeValue = String(formData.get("locale") ?? "");
  const locale = isLocale(localeValue) ? localeValue : defaultLocale;

  const parsed = checkoutSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    fulfilment: formData.get("fulfilment"),
    address: formData.get("address") ?? "",
    note: formData.get("note") ?? "",
    paymentMethod: formData.get("paymentMethod"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { status: "invalid", fieldErrors };
  }

  const crossFieldErrors = checkoutFieldErrors(parsed.data);
  if (Object.keys(crossFieldErrors).length > 0) {
    return { status: "invalid", fieldErrors: crossFieldErrors };
  }

  const fields = parsed.data;
  const lines = parseCheckoutLines(formData.get("lines"));

  if (lines.length === 0) {
    return { status: "empty" };
  }

  // The age gate is enforced here too — a disabled button is a convenience, not
  // a control.
  if (formData.get("ageRequired") === "1" && formData.get("ageConfirmed") !== "1") {
    return {
      status: "invalid",
      fieldErrors: { ageConfirmed: CHECKOUT_MESSAGE_KEYS.agreeAge },
    };
  }

  // ── Re-check stock ───────────────────────────────────────────────────────
  // The POS v1 orders endpoint does NOT validate stock, so this is the only
  // place an oversell is caught before it reaches the shop floor.
  //
  // Quantities are summed per product: the same product can legitimately appear
  // twice (once by the piece, once by the box), and checking each line against
  // the full available stock independently would approve a basket that oversells.
  const requestedByProduct = new Map<number, number>();
  for (const line of lines) {
    requestedByProduct.set(
      line.productId,
      (requestedByProduct.get(line.productId) ?? 0) + line.quantity,
    );
  }

  let issues: CheckoutStockIssue[];
  try {
    const checks = await checkStock(
      [...requestedByProduct].map(([productId, quantity]) => ({ productId, quantity })),
    );
    issues = checks
      .filter((check) => !check.ok)
      .map((check) => ({
        productId: check.productId,
        sellMode: lines.find((line) => line.productId === check.productId)?.sellMode ?? "piece",
        requested: check.requested,
        available: check.available,
      }));
  } catch (error) {
    return { status: "error", errorKind: toPosApiError(error).kind };
  }

  if (issues.length > 0) {
    return { status: "stock", issues };
  }

  const input: CreateOrderInput = {
    customer: {
      name: fields.fullName,
      phone: fields.phone,
      email: fields.email,
      address: fields.fulfilment === "delivery" ? fields.address : "",
    },
    items: lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      sellMode: line.sellMode,
    })),
    paymentMethod: fields.paymentMethod as PaymentMethod,
    note: composeOrderNote({
      fulfilment: fields.fulfilment as FulfilmentMethod,
      address: fields.address,
      note: fields.note,
    }),
  };

  let reference: string;
  try {
    const created = await createOrder(input);
    reference = created.reference;
  } catch (error) {
    const posError = toPosApiError(error);
    // Field-level rejections from the POS (HTTP 422) are surfaced verbatim.
    return { status: "error", errorKind: posError.kind, fieldMessages: posError.fields };
  }

  // `redirect` throws a control-flow signal, so it must run outside try/catch.
  redirect(localePath(locale, `/order-success/${encodeURIComponent(reference)}`));
}

/** Result of a manual availability check, used by the cart page. */
export interface AvailabilityResult {
  status: "ok" | "changed" | "error";
  issues: CheckoutStockIssue[];
}

/**
 * Re-checks the basket against live stock and reports any line that no longer
 * fits. Triggered explicitly from the cart — never on page load — so browsing
 * does not spend API requests.
 */
export async function checkAvailabilityAction(
  items: readonly { productId: number; quantity: number; sellMode: "piece" | "box" }[],
): Promise<AvailabilityResult> {
  if (items.length === 0) return { status: "ok", issues: [] };

  try {
    const checks = await checkStock(
      items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    );

    const issues: CheckoutStockIssue[] = checks
      .filter((check) => !check.ok)
      .map((check) => ({
        productId: check.productId,
        sellMode: items.find((item) => item.productId === check.productId)?.sellMode ?? "piece",
        requested: check.requested,
        available: check.available,
      }));

    return issues.length > 0 ? { status: "changed", issues } : { status: "ok", issues: [] };
  } catch {
    return { status: "error", issues: [] };
  }
}
