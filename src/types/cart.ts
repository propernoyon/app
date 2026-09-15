export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  sku?: string | null;
  category?: string | null;
}

export interface CartState {
  items: CartItem[];
  version: number;
}