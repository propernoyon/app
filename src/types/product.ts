export interface Product {
  id: number;
  user_id: number;
  category_id: number | null;
  location_id: number | null;
  unit_id: number | null;
  purchase_unit_id: number | null;
  sale_unit_id: number | null;

  name: string;
  sku: string | null;
  barcode: string | null;
  barcode_box: string | null;
  description: string | null;

  purchase_unit_qty: number;
  sell_type: string;

  cost_price: number;
  cost_price_per_piece: number;

  sale_price: number | null;
  sale_price_box: number;

  low_stock_alert: number | null;

  is_active: "active" | "inactive";

  image: string | null;

  tax_percent: number;

  created_at: string | null;
  updated_at: string | null;
}

export interface ProductWithCategory extends Product {
  category?: {
    id: number;
    name: string;
    slug: string;
    color: string | null;
    icon: string | null;
  } | null;
}