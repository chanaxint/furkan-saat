/** Rows as stored in the database (supabase/migrations). */

export type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type AddressRow = {
  id: string;
  user_id: string;
  title: string;
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  city: string;
  district: string;
  postal_code: string;
  address_line: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type AddressInput = Omit<AddressRow, "id" | "user_id" | "created_at" | "updated_at">;

export type OrderStatus = "pending_payment" | "paid" | "preparing" | "shipped" | "delivered" | "cancelled" | "refunded";

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
};

export type OrderRow = {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  total: number;
  currency: "TRY" | "EUR" | "USD";
  shipping_address: Partial<AddressInput> | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRow[];
};
