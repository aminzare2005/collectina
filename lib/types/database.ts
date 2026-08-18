export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  payment_reference: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
  telegram: string | null;
  receiver_name: string;
  track_id: number;
  track_post_id: string | null;
  discount_id: string | null;
  discount_amount: number;
  free_shipping: boolean;
}

export interface Profile {
  id: string;
  display_name: string | null;
  phone_number: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  telegram: string | null;
  created_at: string;
  updated_at: string;
}

export interface Discount {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_per_user: number | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  image_url: string;
  type: "phonecase" | "poster";
  created_at: string;
  updated_at: string;
}

export interface PhoneCase {
  id: string;
  product_id: string;
  brand: string;
  model: string;
  price: number;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Poster {
  id: string;
  attribute: string;
  price: number;
  available: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  phone_case_id: string | null;
  poster_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  phone_case_id: string | null;
  phone_brand: string | null;
  phone_model: string | null;
  poster_id: string | null;
  created_at: string;
}

export interface Settings {
  id: string;
  post_price: number;
  created_at: string;
  updated_at: string;
}