export type Role = "customer" | "seller" | "admin" | "staff";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  banner: string | null;
  icon: string | null;
  featured: boolean;
  top: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  top: boolean;
}

export interface Shop {
  id: string;
  userId: string;
  name: string;
  slug: string;
  logo: string | null;
  address: string | null;
  description: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brandId: string | null;
  sellerId: string;
  price: number;
  purchasePrice: number;
  discount: number;
  discountType: "amount" | "percent";
  salePrice: number;
  stock: number;
  minQuantity: number;
  variants: { name: string; sku?: string; price: number; stock: number }[];
  unit: string;
  rating: number;
  sales: number;
  thumbnail: string | null;
  photos: string[];
  featured: boolean;
  todaysDeal: boolean;
  published: boolean;
  digital: boolean;
}

export interface CartLine {
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  quantity: number;
  variation?: string;
}

export interface DashboardMetric {
  label: string;
  value: string | number;
  hint?: string;
}
