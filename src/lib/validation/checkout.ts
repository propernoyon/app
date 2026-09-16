import { z } from "zod";

import type { PosErrorKind } from "@/lib/api/errors";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/domain/order";
import { normalizeSellMode, type SellMode } from "@/lib/domain/product";

/* ────────────────────────────────────────────────────────────────────────────
 * Checkout validation.
 *
 * Messages are i18n *keys* rather than sentences, so the server can validate
 * without knowing the visitor's language and the client can render the message
 * from its own dictionary.
 * ──────────────────────────────────────────────────────────────────────────── */

export const FULFILMENT_METHODS = ["delivery", "pickup"] as const;
export type FulfilmentMethod = (typeof FULFILMENT_METHODS)[number];

/** i18n keys the checkout form knows how to render. */
export const CHECKOUT_MESSAGE_KEYS = {
  required: "checkout.required",
  invalidEmail: "checkout.invalidEmail",
  invalidPhone: "checkout.invalidPhone",
  agreeAge: "checkout.agreeAgeRequired",
} as const;

export type CheckoutMessageKey = (typeof CHECKOUT_MESSAGE_KEYS)[keyof typeof CHECKOUT_MESSAGE_KEYS];

const delimiter = /[\s\-().]/g;

/** Input is normalised before validation so trailing spaces can't fail a form. */
export const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: CHECKOUT_MESSAGE_KEYS.required })
    .max(120, { message: CHECKOUT_MESSAGE_KEYS.required }),
  phone: z
    .string()
    .trim()
    .min(6, { message: CHECKOUT_MESSAGE_KEYS.invalidPhone })
    .max(32, { message: CHECKOUT_MESSAGE_KEYS.invalidPhone }),
  // Email is optional, but must be well-formed when supplied.
  email: z
    .string()
    .trim()
    .max(160, { message: CHECKOUT_MESSAGE_KEYS.invalidEmail })
    .refine((value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value), {
      message: CHECKOUT_MESSAGE_KEYS.invalidEmail,
    }),
  fulfilment: z.enum(FULFILMENT_METHODS, { message: CHECKOUT_MESSAGE_KEYS.required }),
  address: z.string().trim().max(300, { message: CHECKOUT_MESSAGE_KEYS.required }),
  note: z.string().trim().max(500, { message: CHECKOUT_MESSAGE_KEYS.required }),
  paymentMethod: z.enum(PAYMENT_METHODS as unknown as [PaymentMethod, ...PaymentMethod[]], {
    message: CHECKOUT_MESSAGE_KEYS.required,
  }),
});

export type CheckoutFields = z.infer<typeof checkoutSchema>;

/**
 * Cross-field rules that a single-field schema can't express: a delivery needs an
 * address, and a phone number needs enough digits to actually call.
 */
export function checkoutFieldErrors(fields: CheckoutFields): Record<string, string> {
  const errors: Record<string, string> = {};

  const digits = fields.phone.replace(delimiter, "");
  if (!/^\+?\d{6,15}$/.test(digits)) {
    errors.phone = CHECKOUT_MESSAGE_KEYS.invalidPhone;
  }

  if (fields.fulfilment === "delivery" && fields.address.trim().length < 5) {
    errors.address = CHECKOUT_MESSAGE_KEYS.required;
  }

  return errors;
}

export interface CheckoutLineInput {
  productId: number;
  quantity: number;
  sellMode: SellMode;
}

/**
 * Parses the cart lines submitted with the form.
 *
 * The payload comes from the browser, so it is treated as untrusted: ids must be
 * positive integers, quantities positive integers, and sell modes from the known
 * set. Prices are never accepted from the client — the POS recalculates them.
 */
export function parseCheckoutLines(raw: unknown): CheckoutLineInput[] {
  if (typeof raw !== "string" || raw.length === 0) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const lines: CheckoutLineInput[] = [];
  const seen = new Set<string>();

  for (const item of parsed) {
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;

    const productId = Number(record.productId);
    const quantity = Number(record.quantity);

    if (!Number.isInteger(productId) || productId <= 0) continue;
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 999) continue;

    const sellMode = normalizeSellMode(record.sellMode);
    const key = `${productId}:${sellMode}`;
    if (seen.has(key)) continue;
    seen.add(key);

    lines.push({ productId, quantity, sellMode });
  }

  return lines;
}

/**
 * Composes the POS `note` field.
 *
 * `api_orders` has no column for fulfilment, so delivery/pickup and the customer
 * note are combined into the one free-text field the API does accept. If the POS
 * later gains proper columns, only this function changes.
 */
export function composeOrderNote({
  fulfilment,
  address,
  note,
}: {
  fulfilment: FulfilmentMethod;
  address: string;
  note: string;
}): string {
  const parts: string[] = [];
  parts.push(fulfilment === "delivery" ? "Delivery" : "Pickup");
  if (fulfilment === "delivery" && address.trim()) parts.push(address.trim());
  if (note.trim()) parts.push(note.trim());
  return parts.join(" · ").slice(0, 1000);
}

/* ── Action result ────────────────────────────────────────────────────────── */

/** A line whose quantity is no longer available (stock changed since it was added). */
export interface CheckoutStockIssue {
  productId: number;
  sellMode: SellMode;
  requested: number;
  available: number;
}

/**
 * What the checkout Server Action returns to the form.
 *
 * A failure is always a *state*, never a thrown error, so the form can keep the
 * customer's input and explain exactly what to fix. Success is not represented
 * here: the action redirects to the confirmation page instead.
 */
export type CheckoutState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: Record<string, string> }
  | { status: "stock"; issues: CheckoutStockIssue[] }
  | { status: "empty" }
  | { status: "error"; errorKind: PosErrorKind; fieldMessages?: string[] };

export const INITIAL_CHECKOUT_STATE: CheckoutState = { status: "idle" };
