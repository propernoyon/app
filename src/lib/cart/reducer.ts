import {
  CART_VERSION,
  EMPTY_CART,
  cartLineKey,
  type CartLine,
  type CartState,
} from "@/lib/domain/cart";
import type { SellMode } from "@/lib/domain/product";

export type CartAction =
  | { type: "hydrate"; state: CartState }
  | { type: "add"; line: CartLine; quantity?: number }
  | { type: "setQuantity"; productId: number; sellMode: SellMode; quantity: number }
  | { type: "increment"; productId: number; sellMode: SellMode }
  | { type: "decrement"; productId: number; sellMode: SellMode }
  | { type: "remove"; productId: number; sellMode: SellMode }
  | { type: "clear" }
  /** Applies freshly observed stock limits, reducing quantities where needed. */
  | { type: "clamp"; limits: Record<string, number> };

/**
 * Upper bound for a line.
 *
 * `null` means "unknown, do not restrict"; an explicit `0` means "we know there
 * are none", which must block the line rather than leave it unbounded.
 */
export function lineMaxQuantity(line: CartLine): number | null {
  const max = line.maxQuantity;
  if (typeof max !== "number" || !Number.isFinite(max) || max < 0) return null;
  return Math.floor(max);
}

function capQuantity(line: CartLine, quantity: number): number {
  const max = lineMaxQuantity(line);
  const capped = max === null ? quantity : Math.min(quantity, max);
  return Math.max(0, Math.floor(capped));
}

function mapLines(state: CartState, map: (line: CartLine) => CartLine | null): CartState {
  const next: CartLine[] = [];
  for (const line of state.lines) {
    const mapped = map(line);
    if (mapped && mapped.quantity > 0) next.push(mapped);
  }
  return { ...state, lines: next };
}

/**
 * Pure cart reducer.
 *
 * Quantities are always integers (the POS accepts fractional quantities, but a
 * grocery basket of whole units keeps the UI and the maths unambiguous). Lines
 * whose quantity drops to zero are removed, which keeps `lines` free of dead
 * entries for every mutation path.
 */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "add": {
      const { line } = action;
      const requested = action.quantity ?? line.quantity;
      const key = cartLineKey(line.productId, line.sellMode);

      const existing = state.lines.find(
        (item) => cartLineKey(item.productId, item.sellMode) === key,
      );

      if (!existing) {
        const quantity = capQuantity(line, requested);
        if (quantity <= 0) return state;
        return { ...state, lines: [...state.lines, { ...line, quantity }] };
      }

      return mapLines(state, (item) =>
        cartLineKey(item.productId, item.sellMode) === key
          ? { ...item, quantity: capQuantity({ ...item, ...line }, item.quantity + requested) }
          : item,
      );
    }

    case "setQuantity": {
      const key = cartLineKey(action.productId, action.sellMode);
      return mapLines(state, (line) =>
        cartLineKey(line.productId, line.sellMode) === key
          ? { ...line, quantity: capQuantity(line, action.quantity) }
          : line,
      );
    }

    case "increment": {
      const key = cartLineKey(action.productId, action.sellMode);
      return mapLines(state, (line) =>
        cartLineKey(line.productId, line.sellMode) === key
          ? { ...line, quantity: capQuantity(line, line.quantity + 1) }
          : line,
      );
    }

    case "decrement": {
      const key = cartLineKey(action.productId, action.sellMode);
      return mapLines(state, (line) =>
        cartLineKey(line.productId, line.sellMode) === key
          ? { ...line, quantity: capQuantity(line, line.quantity - 1) }
          : line,
      );
    }

    case "remove": {
      const key = cartLineKey(action.productId, action.sellMode);
      return {
        ...state,
        lines: state.lines.filter((line) => cartLineKey(line.productId, line.sellMode) !== key),
      };
    }

    case "clear":
      return { ...EMPTY_CART };

    case "clamp":
      return mapLines(state, (line) => {
        const limit = action.limits[cartLineKey(line.productId, line.sellMode)];
        // A reported limit replaces what we previously knew. Zero drops the line,
        // because an explicit 0 is a real answer (see `lineMaxQuantity`).
        const withLimit: CartLine =
          typeof limit === "number" && Number.isFinite(limit)
            ? { ...line, maxQuantity: Math.max(0, Math.floor(limit)) }
            : line;
        return { ...withLimit, quantity: capQuantity(withLimit, withLimit.quantity) };
      });

    default:
      return state;
  }
}

export { CART_VERSION };
