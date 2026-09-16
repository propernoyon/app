import type { OrderStatus, PaymentStatus } from "./status";
import type { SellMode } from "./product";

export interface OrderCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface OrderLine {
  productId: number;
  productName: string;
  sku: string | null;
  quantity: number;
  sellMode: SellMode;
  unitPrice: number;
  total: number;
}

export interface Order {
  reference: string;
  date: string | null;
  status: OrderStatus;
  /** Raw status string, kept so an unmapped value can still be shown. */
  rawStatus: string;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  grandTotal: number;
  note: string | null;
  source: string | null;
  customer: OrderCustomer;
  items: OrderLine[];
}

export interface CreateOrderLine {
  productId: number;
  quantity: number;
  sellMode: SellMode;
}

export interface CreateOrderInput {
  customer: OrderCustomer;
  items: CreateOrderLine[];
  paymentMethod: PaymentMethod;
  note?: string;
}

/** POS `payment_method` enum, per `api/v1/orders.php`. */
export type PaymentMethod = "cash" | "bank" | "mobile" | "credit";

export const PAYMENT_METHODS: readonly PaymentMethod[] = ["cash", "bank", "mobile", "credit"];

export interface CreatedOrder {
  reference: string;
  grandTotal: number;
  itemsCount: number;
}
