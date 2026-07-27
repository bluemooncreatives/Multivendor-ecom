import type { Role } from "@/lib/types";

export interface WorkspaceItem {
  slug: string;
  label: string;
  icon: string;
  entity?: EntityName;
}

export interface WorkspaceGroup {
  label: string;
  items: WorkspaceItem[];
}

export const customerNavigation: WorkspaceGroup[] = [
  { label: "Account", items: [
    { slug: "dashboard", label: "Overview", icon: "home" },
    { slug: "purchase_history", label: "Purchase history", icon: "bag", entity: "orders" },
    { slug: "digital_purchase_history", label: "Digital downloads", icon: "download" },
    { slug: "wishlists", label: "Wishlist", icon: "heart", entity: "wishlists" },
    { slug: "wallet", label: "Wallet", icon: "wallet", entity: "wallets" },
    { slug: "conversations", label: "Conversations", icon: "chat", entity: "conversations" },
    { slug: "support_ticket", label: "Support tickets", icon: "support", entity: "tickets" },
    { slug: "profile", label: "Profile & addresses", icon: "user", entity: "addresses" },
  ] },
  { label: "Selling", items: [
    { slug: "customer_products", label: "Classified products", icon: "box", entity: "customer_products" },
    { slug: "affiliate", label: "Affiliate center", icon: "users", entity: "affiliate_users" },
  ] },
];

export const sellerNavigation: WorkspaceGroup[] = [
  { label: "Seller workspace", items: [
    { slug: "dashboard", label: "Overview", icon: "home" },
    { slug: "products", label: "Products", icon: "box", entity: "products" },
    { slug: "digitalproducts", label: "Digital products", icon: "download", entity: "products" },
    { slug: "orders", label: "Orders", icon: "bag", entity: "orders" },
    { slug: "reviews", label: "Reviews", icon: "star", entity: "reviews" },
    { slug: "payments", label: "Payment history", icon: "card", entity: "payments" },
    { slug: "withdraw_requests", label: "Withdrawals", icon: "wallet", entity: "seller_withdraw_requests" },
    { slug: "conversations", label: "Conversations", icon: "chat", entity: "conversations" },
    { slug: "support_ticket", label: "Support tickets", icon: "support", entity: "tickets" },
    { slug: "shop", label: "Shop settings", icon: "store", entity: "shops" },
    { slug: "profile", label: "Profile", icon: "user" },
  ] },
];

export const adminNavigation: WorkspaceGroup[] = [
  { label: "Overview", items: [
    { slug: "dashboard", label: "Dashboard", icon: "home" },
    { slug: "orders", label: "Orders", icon: "bag", entity: "orders" },
    { slug: "sales", label: "Sales", icon: "chart", entity: "orders" },
  ] },
  { label: "Catalog", items: [
    { slug: "products/admin", label: "In-house products", icon: "box", entity: "products" },
    { slug: "products/seller", label: "Seller products", icon: "store", entity: "products" },
    { slug: "digitalproducts", label: "Digital products", icon: "download", entity: "products" },
    { slug: "categories", label: "Categories", icon: "grid", entity: "categories" },
    { slug: "subcategories", label: "Subcategories", icon: "grid", entity: "sub_categories" },
    { slug: "subsubcategories", label: "Sub-subcategories", icon: "grid", entity: "sub_sub_categories" },
    { slug: "brands", label: "Brands", icon: "tag", entity: "brands" },
    { slug: "attributes", label: "Attributes", icon: "sliders", entity: "attributes" },
    { slug: "product-bulk-upload/index", label: "Bulk import", icon: "upload" },
  ] },
  { label: "Marketplace", items: [
    { slug: "sellers", label: "Sellers", icon: "store", entity: "sellers" },
    { slug: "customers", label: "Customers", icon: "users", entity: "customers" },
    { slug: "reviews", label: "Reviews", icon: "star", entity: "reviews" },
    { slug: "commissions", label: "Commissions", icon: "card", entity: "payments" },
    { slug: "withdraw_requests_all", label: "Withdrawals", icon: "wallet", entity: "seller_withdraw_requests" },
    { slug: "classified_products", label: "Classified ads", icon: "box", entity: "customer_products" },
    { slug: "affiliate", label: "Affiliate", icon: "users", entity: "affiliate_users" },
  ] },
  { label: "Marketing", items: [
    { slug: "flash_deals", label: "Flash deals", icon: "bolt", entity: "flash_deals" },
    { slug: "coupon", label: "Coupons", icon: "ticket", entity: "coupons" },
    { slug: "newsletter", label: "Newsletter", icon: "mail", entity: "subscribers" },
    { slug: "frontend_settings/sliders", label: "Sliders", icon: "image", entity: "sliders" },
    { slug: "frontend_settings/home_banners", label: "Banners", icon: "image", entity: "banners" },
    { slug: "frontend_settings/home_categories", label: "Home categories", icon: "grid", entity: "home_categories" },
  ] },
  { label: "Support", items: [
    { slug: "support_ticket", label: "Support tickets", icon: "support", entity: "tickets" },
    { slug: "conversations", label: "Conversations", icon: "chat", entity: "conversations" },
    { slug: "pick_up_points", label: "Pickup points", icon: "pin", entity: "pickup_points" },
  ] },
  { label: "Reports", items: [
    { slug: "stock_report", label: "Stock report", icon: "chart", entity: "products" },
    { slug: "in_house_sale_report", label: "In-house sales", icon: "chart", entity: "orders" },
    { slug: "seller_report", label: "Seller report", icon: "chart", entity: "sellers" },
    { slug: "seller_sale_report", label: "Seller sales", icon: "chart", entity: "orders" },
    { slug: "wish_report", label: "Wishlist report", icon: "heart", entity: "wishlists" },
  ] },
  { label: "Configuration", items: [
    { slug: "generalsettings", label: "General settings", icon: "settings", entity: "general_settings" },
    { slug: "activation", label: "Feature activation", icon: "toggle", entity: "business_settings" },
    { slug: "payment-method", label: "Payment methods", icon: "card", entity: "business_settings" },
    { slug: "shipping_configuration", label: "Shipping", icon: "truck", entity: "business_settings" },
    { slug: "currency", label: "Currencies", icon: "money", entity: "currencies" },
    { slug: "languages", label: "Languages", icon: "globe", entity: "languages" },
    { slug: "roles", label: "Roles", icon: "shield", entity: "roles" },
    { slug: "staffs", label: "Staff", icon: "users", entity: "staff" },
    { slug: "pages", label: "Pages", icon: "file", entity: "pages" },
    { slug: "countries", label: "Countries", icon: "globe", entity: "countries" },
    { slug: "addons", label: "Add-ons", icon: "plus", entity: "addons" },
    { slug: "seosetting", label: "SEO", icon: "search", entity: "seo_settings" },
  ] },
];

export function findWorkspaceItem(groups: WorkspaceGroup[], path: string): WorkspaceItem | undefined {
  const clean = path.replace(/^\/+|\/+$/g, "") || "dashboard";
  return groups.flatMap((group) => group.items).find((item) => clean === item.slug || clean.startsWith(`${item.slug}/`));
}

export function canAccessWorkspace(role: Role, workspace: "customer" | "seller" | "admin"): boolean {
  if (workspace === "admin") return role === "admin" || role === "staff";
  if (workspace === "seller") return role === "seller" || role === "admin";
  return true;
}

export interface EntityDefinition {
  collection: string;
  fields: readonly string[];
  searchFields?: readonly string[];
  objectIdFields?: readonly string[];
  baseFilter?: Readonly<Record<string, unknown>>;
  requiredFields?: readonly string[];
  readOnly?: boolean;
  createDisabled?: boolean;
  deleteDisabled?: boolean;
}

export const entityDefinitions = {
  products: { collection: "products", fields: ["_id", "name", "slug", "seller", "addedBy", "category", "subcategory", "subsubcategory", "brand", "thumbnail", "photos", "description", "unitPrice", "discount", "discountType", "tax", "taxType", "stock", "variants", "unit", "minQuantity", "shippingType", "shippingCost", "published", "featured", "digital", "createdAt"], searchFields: ["name", "slug", "tags"], objectIdFields: ["seller", "category", "subcategory", "subsubcategory", "brand"], requiredFields: ["name", "slug", "seller", "category", "unitPrice"] },
  categories: { collection: "categories", fields: ["_id", "name", "slug", "parent", "commissionRate", "featured", "top", "digital", "active", "createdAt"], searchFields: ["name", "slug"], objectIdFields: ["parent"], requiredFields: ["name", "slug"] },
  sub_categories: { collection: "categories", fields: ["_id", "name", "slug", "parent", "active", "createdAt"], searchFields: ["name", "slug"], objectIdFields: ["parent"], baseFilter: { parent: { $ne: null } }, requiredFields: ["name", "slug", "parent"] },
  sub_sub_categories: { collection: "categories", fields: ["_id", "name", "slug", "parent", "active", "createdAt"], searchFields: ["name", "slug"], objectIdFields: ["parent"], baseFilter: { parent: { $ne: null } }, requiredFields: ["name", "slug", "parent"] },
  brands: { collection: "brands", fields: ["_id", "name", "slug", "logo", "top", "active", "metaTitle", "metaDescription", "createdAt"], searchFields: ["name", "slug"], requiredFields: ["name", "slug"] },
  attributes: { collection: "attributes", fields: ["_id", "name", "values", "active", "createdAt"], searchFields: ["name"] },
  orders: { collection: "orders", fields: ["_id", "code", "customer", "total", "payment.status", "status", "createdAt"], searchFields: ["code", "guestEmail", "shippingAddress.name"], objectIdFields: ["customer"], readOnly: true },
  order_details: { collection: "orders", fields: ["_id", "code", "items", "total", "payment.status", "status", "createdAt"], searchFields: ["code"], readOnly: true },
  sellers: { collection: "users", fields: ["_id", "name", "email", "status", "balance", "createdAt"], searchFields: ["name", "email"], baseFilter: { role: "seller" }, requiredFields: ["name", "email"], createDisabled: true },
  customers: { collection: "users", fields: ["_id", "name", "email", "status", "balance", "createdAt"], searchFields: ["name", "email"], baseFilter: { role: "customer" }, requiredFields: ["name", "email"], createDisabled: true },
  reviews: { collection: "reviews", fields: ["_id", "product", "user", "rating", "comment", "published", "createdAt"], searchFields: ["comment"], objectIdFields: ["product", "user"] },
  payments: { collection: "sellerledgers", fields: ["_id", "seller", "order", "type", "paymentMethod", "gross", "commission", "net", "balanceDelta", "balanceAfter", "status", "reference", "createdAt"], searchFields: ["reference", "paymentMethod"], objectIdFields: ["seller", "order"], readOnly: true },
  seller_withdraw_requests: { collection: "withdrawrequests", fields: ["_id", "seller", "shop", "amount", "status", "message", "processedAt", "createdAt"], searchFields: ["message"], objectIdFields: ["seller", "shop"], readOnly: true },
  customer_products: { collection: "classifiedproducts", fields: ["_id", "name", "user", "unitPrice", "published", "status", "createdAt"], searchFields: ["name"], objectIdFields: ["user"] },
  affiliate_users: { collection: "affiliateusers", fields: ["_id", "user", "status", "balance", "createdAt"], objectIdFields: ["user"] },
  flash_deals: { collection: "flashdeals", fields: ["_id", "title", "startsAt", "endsAt", "active", "featured", "createdAt"], searchFields: ["title"] },
  coupons: { collection: "coupons", fields: ["_id", "type", "code", "discount", "discountType", "startsAt", "endsAt", "active"], searchFields: ["code"] },
  subscribers: { collection: "subscribers", fields: ["_id", "email", "createdAt"], searchFields: ["email"] },
  sliders: { collection: "sliders", fields: ["_id", "photo", "link", "published", "createdAt"] },
  banners: { collection: "banners", fields: ["_id", "photo", "url", "position", "published", "createdAt"] },
  home_categories: { collection: "homecategories", fields: ["_id", "category", "children", "active", "createdAt"], objectIdFields: ["category"] },
  tickets: { collection: "tickets", fields: ["_id", "code", "user", "subject", "status", "createdAt"], searchFields: ["code", "subject"], objectIdFields: ["user"] },
  conversations: { collection: "conversations", fields: ["_id", "participants", "title", "updatedAt", "createdAt"], searchFields: ["title"], objectIdFields: ["participants"] },
  pickup_points: { collection: "pickuppoints", fields: ["_id", "name", "address", "phone", "active", "createdAt"], searchFields: ["name", "address"] },
  wishlists: { collection: "wishlists", fields: ["_id", "user", "product", "createdAt"], objectIdFields: ["user", "product"], readOnly: true },
  wallets: { collection: "wallettransactions", fields: ["_id", "user", "type", "amount", "balanceAfter", "status", "createdAt"], objectIdFields: ["user"], readOnly: true },
  shops: { collection: "shops", fields: ["_id", "owner", "name", "slug", "address", "shippingCost", "verificationStatus", "active", "createdAt"], searchFields: ["name", "slug", "address"], objectIdFields: ["owner"], requiredFields: ["owner", "name", "slug"], createDisabled: true, deleteDisabled: true },
  addresses: { collection: "addresses", fields: ["_id", "user", "address", "country", "city", "postalCode", "phone"], searchFields: ["address", "city", "phone"], objectIdFields: ["user"] },
  general_settings: { collection: "settings", fields: ["_id", "key", "group", "value", "public", "updatedAt"], searchFields: ["key", "group"], baseFilter: { group: "general" }, requiredFields: ["key"], deleteDisabled: true },
  business_settings: { collection: "settings", fields: ["_id", "key", "group", "value", "public", "updatedAt"], searchFields: ["key", "group"], requiredFields: ["key"], deleteDisabled: true },
  currencies: { collection: "currencies", fields: ["_id", "name", "symbol", "exchangeRate", "active", "createdAt"], searchFields: ["name", "symbol"] },
  languages: { collection: "languages", fields: ["_id", "name", "code", "rtl", "active", "createdAt"], searchFields: ["name", "code"] },
  roles: { collection: "roles", fields: ["_id", "name", "permissions", "createdAt"], searchFields: ["name"] },
  staff: { collection: "users", fields: ["_id", "name", "email", "status", "createdAt"], searchFields: ["name", "email"], baseFilter: { role: "staff" }, requiredFields: ["name", "email"], createDisabled: true },
  pages: { collection: "pages", fields: ["_id", "title", "slug", "metaTitle", "published", "createdAt"], searchFields: ["title", "slug"] },
  countries: { collection: "countries", fields: ["_id", "code", "name", "active"], searchFields: ["code", "name"] },
  addons: { collection: "addons", fields: ["_id", "name", "identifier", "version", "active", "image", "createdAt"], searchFields: ["name", "identifier"] },
  seo_settings: { collection: "seosettings", fields: ["_id", "keyword", "author", "revisit", "sitemapLink", "description", "updatedAt"], searchFields: ["keyword", "author", "description"], createDisabled: true, deleteDisabled: true },
} as const satisfies Record<string, EntityDefinition>;

export const entityTables = Object.fromEntries(Object.entries(entityDefinitions).map(([key, definition]) => [key, definition.fields])) as { [K in keyof typeof entityDefinitions]: typeof entityDefinitions[K]["fields"] };

export type EntityName = keyof typeof entityDefinitions;

export function isEntityName(value: string): value is EntityName {
  return Object.prototype.hasOwnProperty.call(entityDefinitions, value);
}
