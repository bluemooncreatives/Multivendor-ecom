import "server-only";
import mongoose from "mongoose";
import { connectMongo, objectId } from "@/lib/mongodb";
import { demoProducts } from "@/lib/demo-data";
import type { DashboardMetric, SessionUser } from "@/lib/types";
import { entityDefinitions, type EntityDefinition, type EntityName } from "@/lib/workspace";
import { AddressModel, OrderModel, ProductModel, ReviewModel, SettingModel, ShopModel, TicketModel, User, WishlistModel } from "@/models";

function serialize(value: unknown): unknown {
  if (value instanceof mongoose.Types.ObjectId) return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, serialize(nested)]));
  return value;
}

export async function getEntityRows(entity: EntityName, user: SessionUser, workspace: "customer" | "seller" | "admin", search = ""): Promise<Record<string, unknown>[]> {
  const definition: EntityDefinition = entityDefinitions[entity];
  try {
    await connectMongo();
    const collection = mongoose.connection.db!.collection(definition.collection);
    const userId = objectId(user.id);
    if (!userId) return [];
    const filters: Record<string, unknown>[] = [definition.baseFilter ? { ...definition.baseFilter } : {}];
    if (workspace === "customer") {
      if (entity === "orders") filters.push({ customer: userId });
      else if (["wishlists", "wallets", "addresses", "tickets", "customer_products", "affiliate_users"].includes(entity)) filters.push({ user: userId });
      else if (entity === "conversations") filters.push({ participants: userId });
    }
    if (workspace === "seller") {
      if (entity === "products") filters.push({ seller: userId });
      else if (entity === "orders" || entity === "order_details") filters.push({ "items.seller": userId });
      else if (entity === "payments") filters.push({ seller: userId });
      else if (entity === "seller_withdraw_requests") filters.push({ seller: userId });
      else if (entity === "tickets") filters.push({ user: userId });
      else if (entity === "shops") filters.push({ owner: userId });
      else if (entity === "conversations") filters.push({ participants: userId });
      else if (entity === "reviews") {
        const productIds = await ProductModel.find({ seller: userId }).distinct("_id");
        filters.push({ product: { $in: productIds } });
      }
    }
    if (search.trim() && definition.searchFields?.length) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(escaped, "i");
      filters.push({ $or: definition.searchFields.map((field) => ({ [field]: pattern })) });
    }
    const filter = filters.length === 1 ? filters[0] : { $and: filters };
    const projection = Object.fromEntries(definition.fields.map((field) => [field, 1]));
    const rows = await collection.find(filter, { projection }).sort({ createdAt: -1, _id: -1 }).limit(100).toArray();
    return rows.map((row) => serialize(row) as Record<string, unknown>);
  } catch (error) {
    if (entity === "products" && (process.env.ALLOW_DEMO_DATA === "true" || process.env.NODE_ENV !== "production")) {
      return demoProducts.map((product) => ({ _id: product.id, name: product.name, addedBy: "seller", unitPrice: product.price, stock: product.stock, published: product.published, featured: product.featured, createdAt: "Demo data" }));
    }
    return [];
  }
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

export async function getDashboardMetrics(user: SessionUser, workspace: "customer" | "seller" | "admin"): Promise<DashboardMetric[]> {
  try {
    await connectMongo();
    const userId = objectId(user.id);
    if (!userId) return [];
    if (workspace === "admin") {
      const [products, orders, sellers, revenueResult] = await Promise.all([
        ProductModel.countDocuments(),
        OrderModel.countDocuments(),
        User.countDocuments({ role: "seller", status: { $ne: "deleted" } }),
        OrderModel.aggregate<{ total: number }>([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
      ]);
      return [
        { label: "Products", value: products, hint: "Marketplace catalog" },
        { label: "Orders", value: orders, hint: "All-time orders" },
        { label: "Sellers", value: sellers, hint: "Registered vendors" },
        { label: "Gross sales", value: currency(revenueResult[0]?.total || 0), hint: "Non-cancelled order value" },
      ];
    }
    if (workspace === "seller") {
      const productIdsPromise = ProductModel.find({ seller: userId }).distinct("_id");
      const [products, orders, productIds, shop] = await Promise.all([
        ProductModel.countDocuments({ seller: userId }),
        OrderModel.countDocuments({ "items.seller": userId }),
        productIdsPromise,
        ShopModel.findOne({ owner: userId }).select("adminToPay").lean(),
      ]);
      const reviews = await ReviewModel.countDocuments({ product: { $in: productIds } });
      return [
        { label: "Products", value: products, hint: "Your catalog" },
        { label: "Orders", value: orders, hint: "Orders containing your items" },
        { label: "Reviews", value: reviews, hint: "Customer feedback" },
        { label: "Settlement balance", value: currency(shop?.adminToPay || 0), hint: (shop?.adminToPay || 0) < 0 ? "Commission owed to marketplace" : "Marketplace owes you" },
      ];
    }
    const [orders, wishlist, tickets, account, walletSetting, addresses] = await Promise.all([
      OrderModel.countDocuments({ customer: userId }),
      WishlistModel.countDocuments({ user: userId }),
      TicketModel.countDocuments({ user: userId, status: { $ne: "closed" } }),
      User.findById(userId).select("balance").lean(),
      SettingModel.findOne({ key: "business.wallet_system" }).select("value").lean(),
      AddressModel.countDocuments({ user: userId }),
    ]);
    const walletEnabled = walletSetting?.value === true || String(walletSetting?.value) === "1";
    return [
      { label: "Orders", value: orders, hint: "Purchase history" },
      { label: "Wishlist", value: wishlist, hint: "Saved products" },
      { label: "Open tickets", value: tickets, hint: "Support requests" },
      walletEnabled ? { label: "Wallet balance", value: currency(account?.balance || 0), hint: "Available credit" } : { label: "Saved addresses", value: addresses, hint: "Delivery locations" },
    ];
  } catch {
    return [
      { label: "Database", value: "Offline", hint: "Connect MongoDB to load live metrics" },
      { label: "Orders", value: 0 },
      { label: "Products", value: workspace === "admin" ? demoProducts.length : 0 },
      { label: "Status", value: "Demo", hint: "Development catalog fallback" },
    ];
  }
}
