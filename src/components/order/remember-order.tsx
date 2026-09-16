"use client";

import { useEffect, useRef } from "react";

import { useCart } from "@/lib/cart/hooks";
import { rememberRecentLines } from "@/lib/cart/history";

/**
 * Runs once on the confirmation page: remembers the basket for the "Buy it
 * again" rail, then empties the cart.
 *
 * Done here rather than in the Server Action because the cart lives in this
 * browser. There is no state to manage — this only synchronises with
 * localStorage — so it runs in a single guarded effect.
 */
export function RememberOrder() {
  const { lines, hydrated, actions } = useCart();
  const handled = useRef(false);

  useEffect(() => {
    if (!hydrated || handled.current) return;
    handled.current = true;

    if (lines.length > 0) {
      rememberRecentLines(lines);
      actions.clear();
    }
  }, [hydrated, lines, actions]);

  return null;
}
