/**
 * Money helpers.
 *
 * The POS rounds each line to 2 decimals (`round($unitPrice * $qty, 2)`), so the
 * cart mirrors that: round per line, then sum. This keeps the storefront's totals
 * identical to the ones the POS recalculates and stores on order creation.
 */

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineTotal(unitPrice: number, quantity: number): number {
  return round2(unitPrice * quantity);
}

export function sumMoney(values: readonly number[]): number {
  return round2(values.reduce((total, value) => total + value, 0));
}
