"use client";

import { EMPTY_CART, type CartLine, type CartState } from "@/lib/domain/cart";
import type { SellMode } from "@/lib/domain/product";
import { cartReducer, type CartAction } from "./reducer";
import { readCartState, writeCartState } from "./storage";

/* ────────────────────────────────────────────────────────────────────────────
 * Cart store.
 *
 * Modelled as an external store and consumed through `useSyncExternalStore`.
 * That is what makes the cart correct across the server/client boundary:
 *  - the server always renders `EMPTY_CART`, so markup matches on hydration
 *  - localStorage is read in a subscription effect (never during render)
 *  - a `storage` event keeps multiple tabs in sync
 * ──────────────────────────────────────────────────────────────────────────── */

let state: CartState = EMPTY_CART;
let hydrated = false;
let storageListenerAttached = false;

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function persist(): void {
  writeCartState(state);
}

function dispatch(action: CartAction): void {
  const next = cartReducer(state, action);
  if (next === state) return;
  state = next;
  persist();
  emit();
}

/** Replaces the in-memory cart with what localStorage holds, once, on first use. */
function hydrateFromStorage(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = readCartState();
  emit();
}

function attachStorageListener(): void {
  if (storageListenerAttached || typeof window === "undefined") return;
  storageListenerAttached = true;

  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== undefined && !event.key.includes("mini-mercado:cart")) {
      return;
    }
    state = readCartState();
    hydrated = true;
    emit();
  });
}

export function subscribeCart(listener: () => void): () => void {
  listeners.add(listener);
  attachStorageListener();
  hydrateFromStorage();
  return () => {
    listeners.delete(listener);
  };
}

export function getCartSnapshot(): CartState {
  return state;
}

/** Server render must be deterministic — always the empty cart. */
export function getCartServerSnapshot(): CartState {
  return EMPTY_CART;
}

export function getCartHydratedSnapshot(): boolean {
  return hydrated;
}

export function getCartHydratedServerSnapshot(): boolean {
  return false;
}

/* ── Actions ──────────────────────────────────────────────────────────────── */

export const cartActions = {
  add(line: CartLine, quantity = 1): void {
    dispatch({ type: "add", line, quantity });
  },

  setQuantity(productId: number, sellMode: SellMode, quantity: number): void {
    dispatch({ type: "setQuantity", productId, sellMode, quantity });
  },

  increment(productId: number, sellMode: SellMode): void {
    dispatch({ type: "increment", productId, sellMode });
  },

  decrement(productId: number, sellMode: SellMode): void {
    dispatch({ type: "decrement", productId, sellMode });
  },

  remove(productId: number, sellMode: SellMode): void {
    dispatch({ type: "remove", productId, sellMode });
  },

  clear(): void {
    dispatch({ type: "clear" });
  },

  /** Applies freshly observed stock limits (see `checkStock`). */
  clamp(limits: Record<string, number>): void {
    dispatch({ type: "clamp", limits });
  },

  /** Test helper / logout reset. */
  reset(): void {
    state = EMPTY_CART;
    persist();
    emit();
  },
};
