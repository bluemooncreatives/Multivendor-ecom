// Shared TypeScript contracts between apps/api and apps/web.
// Mirrors Mongoose schema shapes but stays framework-agnostic (no Document/ObjectId).

export type ID = string;

export type UserRole = "admin" | "staff" | "seller" | "customer";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

export type PaymentMethod =
  | "stripe"
  | "razorpay"
  | "paypal"
  | "cod"
  | "wallet"
  | "manual"
  | "sslcommerz"
  | "instamojo"
  | "paystack"
  | "voguepay"
  | "payhere"
  | "ngenius";

export type StockReservationStatus = "reserved" | "confirmed" | "released";

export interface User {
  id: ID;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  banned: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shop {
  id: ID;
  sellerId: ID;
  name: string;
  slug: string;
  logoUrl?: string;
  bannerUrl?: string;
  verified: boolean;
  socialLinks?: Record<string, string>;
}

export interface Category {
  id: ID;
  name: string;
  slug: string;
  parentId?: ID | null;
  iconUrl?: string;
  level: 0 | 1 | 2;
}

export interface Brand {
  id: ID;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface ProductVariant {
  sku: string;
  attributes: Record<string, string>; // e.g. { color: "red", size: "M" }
  price: number;
  comparePrice?: number;
  stock: number;
  imageUrl?: string;
}

export interface Product {
  id: ID;
  sellerId: ID;
  name: string;
  slug: string;
  categoryId: ID;
  brandId?: ID;
  description: string;
  images: string[];
  basePrice: number;
  variants: ProductVariant[];
  isDigital: boolean;
  digitalFileUrl?: string;
  published: boolean;
  tags: string[];
  currency: string;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
}

export interface CartItem {
  productId: ID;
  variantSku: string;
  quantity: number;
}

export interface Cart {
  id: ID;
  userId?: ID;
  guestId?: string;
  items: CartItem[];
  updatedAt: string;
}

export interface Address {
  id: ID;
  userId: ID;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
}

export interface OrderItem {
  productId: ID;
  sellerId: ID;
  variantSku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface OrderDetail {
  sellerId: ID;
  items: OrderItem[];
  subtotal: number;
  commission: number;
  shippingCost: number;
  status: OrderStatus;
}

export interface Order {
  id: ID;
  code: string;
  userId?: ID;
  guestId?: string;
  addressId: ID;
  details: OrderDetail[];
  couponCode?: string;
  discount: number;
  tax: number;
  shippingTotal: number;
  grandTotal: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  idempotencyKey: string;
  createdAt: string;
}

export interface Payment {
  id: ID;
  orderId: ID;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  providerRef?: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: ID;
  userId: ID;
  amount: number; // positive = credit, negative = debit
  balanceAfter: number;
  reason: string;
  refType?: string;
  refId?: ID;
  createdAt: string;
}

export interface Ticket {
  id: ID;
  userId: ID;
  subject: string;
  status: "open" | "answered" | "closed";
  createdAt: string;
}

export interface Coupon {
  id: ID;
  code: string;
  type: "flat" | "percent";
  value: number;
  minOrderValue?: number;
  expiresAt?: string;
  active: boolean;
}

export interface ApiErrorBody {
  message: string;
  code?: string;
  fields?: Record<string, string>;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
