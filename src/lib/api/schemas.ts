import { z } from "zod";

/* ────────────────────────────────────────────────────────────────────────────
 * Schemas for the raw POS API payloads (v1).
 *
 * Source of truth: `C:\xampp\htdocs\pos\api\v1\*.php`. These describe the wire
 * format exactly (snake_case, nested `pricing`/`stock`), and `normalize.ts`
 * converts them into the camelCase domain models the app uses.
 *
 * The API returns `{ "success": true, ... }` on success. Numbers are coerced
 * because PHP's json_encode can emit `"12.50"` for DECIMAL columns.
 * ──────────────────────────────────────────────────────────────────────────── */

export const rawPricingSchema = z.object({
  sale_price: z.coerce.number(),
  sale_price_box: z.coerce.number().nullish(),
  tax_percent: z.coerce.number().nullish(),
});

export const rawStockSchema = z.object({
  qty: z.coerce.number(),
  boxes: z.coerce.number().nullish(),
  pieces: z.coerce.number().nullish(),
  low_alert: z.coerce.number().nullish(),
  status: z.string().nullish(),
});

export const rawProductSchema = z.object({
  id: z.coerce.number().int(),
  name: z.string().min(1),
  sku: z.string().nullish(),
  barcode: z.string().nullish(),
  description: z.string().nullish(),
  category: z
    .object({
      id: z.coerce.number().int(),
      name: z.string(),
      color: z.string().nullish(),
    })
    .nullish(),
  sell_type: z.string().nullish(),
  sale_unit: z.string().nullish(),
  purchase_unit: z.string().nullish(),
  pcs_per_box: z.coerce.number().nullish(),
  pricing: rawPricingSchema,
  stock: rawStockSchema,
  image_url: z.string().nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type RawProduct = z.infer<typeof rawProductSchema>;

export const rawCategorySchema = z.object({
  id: z.coerce.number().int(),
  name: z.string().min(1),
  description: z.string().nullish(),
  color: z.string().nullish(),
  icon: z.string().nullish(),
  // Slug is nullable here: when the POS leaves it empty we derive one, so the
  // category still gets a working /category/[slug] route.
  slug: z.string().nullish(),
  product_count: z.coerce.number().nullish(),
});

export type RawCategory = z.infer<typeof rawCategorySchema>;

export const rawLiveStockSchema = z.object({
  product_id: z.coerce.number().int(),
  product_name: z.string().nullish(),
  unit: z.string().nullish(),
  qty: z.coerce.number(),
  boxes: z.coerce.number().nullish(),
  pieces: z.coerce.number().nullish(),
  low_alert: z.coerce.number().nullish(),
  status: z.string().nullish(),
  last_updated: z.string().nullish(),
});

export type RawLiveStock = z.infer<typeof rawLiveStockSchema>;

export const rawPaginationSchema = z.object({
  total: z.coerce.number().int().nullish(),
  page: z.coerce.number().int().nullish(),
  per_page: z.coerce.number().int().nullish(),
  pages: z.coerce.number().int().nullish(),
});

export const rawOrderCustomerSchema = z.object({
  name: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  address: z.string().nullish(),
});

export const rawOrderLineSchema = z.object({
  product_id: z.coerce.number().int(),
  product_name: z.string().nullish(),
  sku: z.string().nullish(),
  qty: z.coerce.number(),
  sell_mode: z.string().nullish(),
  unit_price: z.coerce.number().nullish(),
  total: z.coerce.number().nullish(),
});

export const rawOrderSchema = z.object({
  ref_no: z.string().min(1),
  date: z.string().nullish(),
  status: z.string().nullish(),
  payment_status: z.string().nullish(),
  payment_method: z.string().nullish(),
  grand_total: z.coerce.number().nullish(),
  note: z.string().nullish(),
  source: z.string().nullish(),
  customer: rawOrderCustomerSchema.nullish(),
  items: z.array(rawOrderLineSchema).nullish(),
});

export type RawOrder = z.infer<typeof rawOrderSchema>;

/** `POST /orders` success payload. `order_id` is only present on the v2 shape. */
export const rawCreatedOrderSchema = z.object({
  ref_no: z.string().min(1),
  grand_total: z.coerce.number().nullish(),
  items_count: z.coerce.number().nullish(),
  order_id: z.coerce.number().nullish(),
});

export const rawSettingsSchema = z.object({
  app_name: z.string().nullish(),
  currency: z.string().nullish(),
});

export type RawSettings = z.infer<typeof rawSettingsSchema>;
