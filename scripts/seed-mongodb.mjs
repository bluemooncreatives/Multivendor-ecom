import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const sellerPassword = process.env.SEED_SELLER_PASSWORD;
if (!adminPassword || adminPassword.length < 12 || !sellerPassword || sellerPassword.length < 12) throw new Error("SEED_ADMIN_PASSWORD and SEED_SELLER_PASSWORD must each contain at least 12 characters");
function id(value) { return new mongoose.Types.ObjectId(crypto.createHash("sha256").update(`demo:${value}`).digest("hex").slice(0, 24)); }

const now = new Date();
const adminId = id("admin");
const sellerId = id("seller");
const categoryIds = { women: id("category-women"), men: id("category-men"), home: id("category-home") };
const products = [
  { _id: id("product-jeans"), name: "Slim Fit Jeans", slug: "slim-fit-jeans", seller: sellerId, category: categoryIds.men, unitPrice: 3100, purchasePrice: 1900, discount: 10, discountType: "percent", tax: 0, taxType: "amount", stock: 24, unit: "pc", minQuantity: 1, shippingType: "free", shippingCost: 0, sales: 42, rating: 4.6, published: true, featured: true, todaysDeal: true, digital: false, photos: ["uploads/products/thumbnail/0aCOHUtWNCEg5MdV0CYf3SwBCjK4Wj7zoyQoAZcv.jpeg"], thumbnail: "uploads/products/thumbnail/0aCOHUtWNCEg5MdV0CYf3SwBCjK4Wj7zoyQoAZcv.jpeg", description: "Classic slim-fit denim from an independent local seller.", createdAt: now, updatedAt: now },
  { _id: id("product-rayon"), name: "Rayon Handwork Pant Set", slug: "rayon-handwork-pant-set", seller: sellerId, category: categoryIds.women, unitPrice: 835, purchasePrice: 600, discount: 50, discountType: "amount", tax: 0, taxType: "amount", stock: 18, unit: "pc", minQuantity: 1, shippingType: "free", shippingCost: 0, sales: 31, rating: 4.8, published: true, featured: true, todaysDeal: false, digital: false, photos: ["uploads/products/thumbnail/1weRoSK03veLJ4BFOaP7yMomK0AEjYWPJXdAdmQv.jpeg"], thumbnail: "uploads/products/thumbnail/1weRoSK03veLJ4BFOaP7yMomK0AEjYWPJXdAdmQv.jpeg", description: "Rayon pant set finished with handcrafted details.", createdAt: now, updatedAt: now },
];

await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined, serverSelectionTimeoutMS: 10_000 });
try {
  const db = mongoose.connection.db;
  const [adminHash, sellerHash] = await Promise.all([bcrypt.hash(adminPassword, 12), bcrypt.hash(sellerPassword, 12)]);
  await db.collection("users").updateOne({ _id: adminId }, { $set: { name: "Marketplace Admin", email: process.env.SEED_ADMIN_EMAIL || "admin@example.com", passwordHash: adminHash, role: "admin", status: "active", provider: "password", balance: 0, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true });
  await db.collection("users").updateOne({ _id: sellerId }, { $set: { name: "Demo Seller", email: process.env.SEED_SELLER_EMAIL || "seller@example.com", passwordHash: sellerHash, role: "seller", status: "active", provider: "password", balance: 0, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true });
  const categories = [{ _id: categoryIds.women, name: "Women's Fashion", slug: "women-fashion" }, { _id: categoryIds.men, name: "Men's Fashion", slug: "men-fashion" }, { _id: categoryIds.home, name: "Home & Kitchen", slug: "home-kitchen" }];
  for (const category of categories) await db.collection("categories").updateOne({ _id: category._id }, { $set: { ...category, parent: null, featured: true, top: true, active: true, createdAt: now, updatedAt: now } }, { upsert: true });
  await db.collection("shops").updateOne({ owner: sellerId }, { $set: { owner: sellerId, name: "Local Finds", slug: "local-finds", verificationStatus: "approved", active: true, createdAt: now, updatedAt: now } }, { upsert: true });
  for (const product of products) await db.collection("products").updateOne({ _id: product._id }, { $set: product }, { upsert: true });
  console.log("MongoDB demo seed completed with the configured admin and seller credentials.");
} finally {
  await mongoose.disconnect();
}
