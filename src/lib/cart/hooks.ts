"use client";

import { useMemo, useSyncExternalStore } from "react";

import { cartItemCount, cartSubtotal, type CartLine } from "@/lib/domain/cart";
import {
  cartActions,
  getCartHydratedServerSnapshot,
  getCartHydratedSnapshot,
  getCartServerSnapshot,
  getCartSnapshot,
  subscribeCart,
} from "./store";

export interface UseCartResult {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  /** False during the first render / before localStorage has been read. */
  hydrated: boolean;
  actions: typeof cartActions;
}

/**
 * Reads the cart. Safe to call from any Client Component: the server render
 * always sees an empty cart, then the real contents appear after hydration.
 */
export function useCart(): UseCartResult {
  const state = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);
  const hydrated = useSyncExternalStore(
    subscribeCart,
    getCartHydratedSnapshot,
    getCartHydratedServerSnapshot,
  );

  return useMemo(
    () => ({
      lines: state.lines,
      itemCount: cartItemCount(state.lines),
      subtotal: cartSubtotal(state.lines),
      hydrated,
      actions: cartActions,
    }),
    [state.lines, hydrated],
  );
}
