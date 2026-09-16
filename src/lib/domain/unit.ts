import type { Product } from "@/lib/domain/product";

/**
 * The unit shown next to a price, e.g. `/ kg`.
 *
 * The POS stores a unit short name (`kg`, `l`, `un`, …). Per-unit items are the
 * default in a grocery basket, so generic unit names are suppressed to avoid
 * noise like “€1,49 / un” on every row.
 */
const GENERIC_UNITS = new Set([
  "un",
  "und",
  "unit",
  "units",
  "pc",
  "pcs",
  "piece",
  "pieces",
  "ud",
  "unidade",
  "unidades",
]);

export function displayUnit(product: Product): string | null {
  const unit = product.saleUnit?.trim();
  if (!unit) return null;
  if (GENERIC_UNITS.has(unit.toLowerCase())) return null;
  return unit;
}
