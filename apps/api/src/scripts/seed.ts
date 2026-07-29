import "dotenv/config";
import { connectDb, disconnectDb } from "../config/db.js";
import { logger } from "../config/logger.js";
import { hashPassword } from "../utils/password.js";
import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { Shop } from "../models/Shop.js";
import { Category, Brand } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Coupon } from "../models/Coupon.js";
import { GeneralSetting, SeoSetting, BusinessSetting, Addon, ManualPaymentMethod } from "../models/Settings.js";
import { Language, Currency, Country } from "../models/Localization.js";
import { StaffPermission } from "../models/Rbac.js";

const PERMISSIONS = [
  { key: "dashboard.view", label: "View dashboard", group: "General" },
  { key: "catalog.manage", label: "Manage catalog", group: "Catalog" },
  { key: "catalog.moderate", label: "Moderate products & classifieds", group: "Catalog" },
  { key: "users.manage", label: "Manage customers", group: "Users" },
  { key: "sellers.manage", label: "Manage sellers", group: "Users" },
  { key: "staff.manage", label: "Manage staff & roles", group: "Users" },
  { key: "orders.manage", label: "Manage orders & refunds", group: "Orders" },
  { key: "payments.manage", label: "Manage payments & withdrawals", group: "Orders" },
  { key: "marketing.manage", label: "Manage coupons & marketing", group: "Marketing" },
  { key: "reports.view", label: "View reports", group: "Reports" },
  { key: "settings.manage", label: "Manage settings & SMS", group: "Settings" },
  { key: "addons.manage", label: "Configure add-ons (affiliate, club points, packages)", group: "Settings" },
];

async function seed() {
  await connectDb();
  logger.info("Seeding demo data...");

  // --- Permissions catalog ---
  await StaffPermission.deleteMany({});
  await StaffPermission.insertMany(PERMISSIONS);

  // --- Localization ---
  await Language.deleteMany({});
  await Language.insertMany([
    { code: "en", name: "English", rtl: false },
    { code: "hi", name: "Hindi", rtl: false },
    { code: "ar", name: "Arabic", rtl: true },
  ]);

  await Currency.deleteMany({});
  await Currency.insertMany([
    { code: "INR", symbol: "₹", rateToBase: 1 },
    { code: "USD", symbol: "$", rateToBase: 83 },
    { code: "AED", symbol: "د.إ", rateToBase: 22.6 },
  ]);

  await Country.deleteMany({});
  await Country.insertMany([
    { code: "IN", name: "India", defaultCurrency: "INR" },
    { code: "US", name: "United States", defaultCurrency: "USD" },
  ]);

  // --- Settings ---
  await GeneralSetting.findOneAndUpdate(
    { key: "general" },
    { key: "general", appName: "PHPStore - Be Vocal for Local - Digital India", supportEmail: "support@v4local.in" },
    { upsert: true },
  );
  await SeoSetting.findOneAndUpdate(
    { key: "seo" },
    { key: "seo", metaTitle: "PHPStore — Be Vocal for Local", googleAnalyticsId: "G-T7899BYWWM" },
    { upsert: true },
  );
  await BusinessSetting.findOneAndUpdate(
    { key: "business" },
    { key: "business", taxPercent: 5, commissionPercent: 10, shippingMode: "flat", flatShippingCost: 49 },
    { upsert: true },
  );

  const addonKeys = ["affiliate", "pos", "seller_subscription", "club_points", "classified_products", "manual_payment", "otp", "refunds"];
  for (const key of addonKeys) {
    await Addon.findOneAndUpdate({ key }, { key, enabled: true }, { upsert: true });
  }

  await ManualPaymentMethod.deleteMany({});
  await ManualPaymentMethod.create({
    name: "Bank transfer",
    instructions: "Transfer to the account below and upload your receipt.",
    accountDetails: { bank: "State Bank of India", accountNumber: "0000000000", ifsc: "SBIN0000000" },
  });

  // --- Users ---
  const passwordHash = await hashPassword("Password123!");

  const admin = await User.findOneAndUpdate(
    { email: "admin@example.com" },
    { name: "Admin", email: "admin@example.com", passwordHash, role: "admin", emailVerifiedAt: new Date() },
    { upsert: true, new: true },
  );

  const staff = await User.findOneAndUpdate(
    { email: "staff@example.com" },
    {
      name: "Staff Member",
      email: "staff@example.com",
      passwordHash,
      role: "staff",
      permissions: ["dashboard.view", "orders.manage", "catalog.moderate"],
      emailVerifiedAt: new Date(),
    },
    { upsert: true, new: true },
  );

  const seller = await User.findOneAndUpdate(
    { email: "seller@example.com" },
    { name: "Demo Seller", email: "seller@example.com", passwordHash, role: "seller", emailVerifiedAt: new Date() },
    { upsert: true, new: true },
  );

  const customer = await User.findOneAndUpdate(
    { email: "customer@example.com" },
    { name: "Demo Customer", email: "customer@example.com", passwordHash, role: "customer", emailVerifiedAt: new Date() },
    { upsert: true, new: true },
  );

  for (const user of [admin, staff, seller, customer]) {
    await Wallet.findOneAndUpdate({ userId: user._id }, { userId: user._id, balance: 5000 }, { upsert: true });
  }

  await Shop.findOneAndUpdate(
    { sellerId: seller._id },
    {
      sellerId: seller._id,
      name: "Demo Seller Shop",
      slug: "demo-seller-shop",
      description: "A demo storefront for the migrated marketplace.",
      verified: true,
      verificationStatus: "approved",
    },
    { upsert: true },
  );

  // --- Catalog ---
  await Product.deleteMany({});
  await Category.deleteMany({});
  await Brand.deleteMany({});

  const electronics = await Category.create({ name: "Electronics", slug: "electronics", level: 0 });
  const mobiles = await Category.create({ name: "Mobiles", slug: "mobiles", level: 1, parentId: electronics._id });
  const fashion = await Category.create({ name: "Fashion", slug: "fashion", level: 0 });
  const menClothing = await Category.create({ name: "Men's Clothing", slug: "mens-clothing", level: 1, parentId: fashion._id });

  const genericBrand = await Brand.create({ name: "Generic", slug: "generic" });

  await Product.create([
    {
      sellerId: seller._id,
      name: "Aurora Wireless Earbuds",
      slug: "aurora-wireless-earbuds",
      categoryId: mobiles._id,
      brandId: genericBrand._id,
      description: "True wireless earbuds with active noise cancellation and 30-hour battery life.",
      images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800"],
      basePrice: 2499,
      currency: "INR",
      variants: [
        { sku: "AURORA-BLK", attributes: { color: "Black" }, price: 2499, stock: 50 },
        { sku: "AURORA-WHT", attributes: { color: "White" }, price: 2599, stock: 30 },
      ],
      published: true,
      approvalStatus: "approved",
      tags: ["electronics", "audio", "wireless"],
    },
    {
      sellerId: seller._id,
      name: "Classic Cotton T-Shirt",
      slug: "classic-cotton-t-shirt",
      categoryId: menClothing._id,
      brandId: genericBrand._id,
      description: "100% cotton crew-neck t-shirt, available in multiple sizes.",
      images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"],
      basePrice: 499,
      currency: "INR",
      variants: [
        { sku: "TSHIRT-S", attributes: { size: "S" }, price: 499, stock: 100 },
        { sku: "TSHIRT-M", attributes: { size: "M" }, price: 499, stock: 100 },
        { sku: "TSHIRT-L", attributes: { size: "L" }, price: 499, stock: 80 },
      ],
      published: true,
      approvalStatus: "approved",
      tags: ["fashion", "clothing"],
    },
    {
      sellerId: seller._id,
      name: "Everyday Backpack",
      slug: "everyday-backpack",
      categoryId: electronics._id,
      brandId: genericBrand._id,
      description: "Water-resistant 20L backpack with a padded laptop sleeve.",
      images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"],
      basePrice: 1299,
      currency: "INR",
      variants: [{ sku: "BACKPACK-GRY", attributes: { color: "Grey" }, price: 1299, stock: 40 }],
      published: true,
      approvalStatus: "approved",
      tags: ["accessories", "bags"],
    },
  ]);

  // --- Marketing ---
  await Coupon.findOneAndUpdate(
    { code: "WELCOME10" },
    { code: "WELCOME10", type: "percent", value: 10, minOrderValue: 500, maxDiscount: 300, usageLimitPerUser: 1, active: true },
    { upsert: true },
  );

  logger.info("Seed complete.");
  logger.info("Login with: admin@example.com / staff@example.com / seller@example.com / customer@example.com — password: Password123!");

  await disconnectDb();
}

seed().catch((err) => {
  logger.error("Seed failed", err);
  process.exit(1);
});
