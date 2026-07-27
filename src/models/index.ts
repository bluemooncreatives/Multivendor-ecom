import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const objectId = Schema.Types.ObjectId;
const timestamps = { timestamps: true, versionKey: false } as const;

const userSchema = new Schema({
  legacyId: { type: Number, index: true, sparse: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  passwordHash: { type: String, select: false },
  role: { type: String, enum: ["customer", "seller", "admin", "staff"], default: "customer", index: true },
  status: { type: String, enum: ["active", "pending", "banned", "deleted"], default: "active", index: true },
  emailVerifiedAt: Date,
  avatar: String,
  phone: String,
  provider: { type: String, enum: ["password", "google", "facebook", "imported"], default: "password" },
  providerId: String,
  balance: { type: Number, default: 0, min: 0 },
  lastLoginAt: Date,
}, timestamps);

const categorySchema = new Schema({
  legacyId: { type: Number, index: true, sparse: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  parent: { type: objectId, ref: "Category", default: null, index: true },
  banner: String,
  icon: String,
  commissionRate: { type: Number, default: 0, min: 0, max: 100 },
  featured: { type: Boolean, default: false, index: true },
  top: { type: Boolean, default: false },
  digital: { type: Boolean, default: false },
  active: { type: Boolean, default: true, index: true },
  metaTitle: String,
  metaDescription: String,
}, timestamps);

const brandSchema = new Schema({
  legacyId: { type: Number, index: true, sparse: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  logo: String,
  top: { type: Boolean, default: false },
  active: { type: Boolean, default: true, index: true },
  metaTitle: String,
  metaDescription: String,
}, timestamps);

const shopSchema = new Schema({
  legacyId: { type: Number, index: true, sparse: true },
  owner: { type: objectId, ref: "User", required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  logo: String,
  sliders: [String],
  address: String,
  social: { facebook: String, google: String, twitter: String, youtube: String, instagram: String },
  metaTitle: String,
  metaDescription: String,
  pickupPoints: [{ type: objectId }],
  shippingCost: { type: Number, default: 0, min: 0 },
  cashOnDelivery: { type: Boolean, default: true },
  verificationInfo: Schema.Types.Mixed,
  bank: { name: String, accountName: String, accountNumber: String, routingNumber: String },
  // Positive means the marketplace owes the seller; negative means a COD seller owes commission.
  adminToPay: { type: Number, default: 0 },
  verificationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  active: { type: Boolean, default: true, index: true },
}, timestamps);

const productSchema = new Schema({
  legacyId: { type: Number, index: true, sparse: true },
  name: { type: String, required: true, trim: true, maxlength: 240, index: "text" },
  slug: { type: String, required: true, trim: true, unique: true, index: true },
  seller: { type: objectId, ref: "User", required: true, index: true },
  addedBy: { type: String, enum: ["admin", "seller"], default: "seller" },
  category: { type: objectId, ref: "Category", required: true, index: true },
  subcategory: { type: objectId, ref: "Category", default: null },
  subsubcategory: { type: objectId, ref: "Category", default: null },
  brand: { type: objectId, ref: "Brand", default: null, index: true },
  photos: [String],
  thumbnail: String,
  video: { provider: String, url: String },
  tags: [{ type: String, trim: true }],
  description: { type: String, default: "" },
  unitPrice: { type: Number, required: true, min: 0 },
  purchasePrice: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  discountType: { type: String, enum: ["amount", "percent"], default: "amount" },
  tax: { type: Number, default: 0, min: 0 },
  taxType: { type: String, enum: ["amount", "percent"], default: "amount" },
  stock: { type: Number, default: 0, min: 0, index: true },
  unit: { type: String, default: "pc" },
  minQuantity: { type: Number, default: 1, min: 1 },
  shippingType: { type: String, enum: ["free", "flat_rate", "seller_wise", "product_wise"], default: "flat_rate" },
  shippingCost: { type: Number, default: 0, min: 0 },
  sales: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  published: { type: Boolean, default: true, index: true },
  featured: { type: Boolean, default: false, index: true },
  todaysDeal: { type: Boolean, default: false, index: true },
  digital: { type: Boolean, default: false, index: true },
  attributes: { type: Schema.Types.Mixed, default: [] },
  variants: { type: Schema.Types.Mixed, default: [] },
  metaTitle: String,
  metaDescription: String,
  metaImage: String,
  digitalFile: { name: String, path: String },
}, timestamps);
productSchema.index({ name: "text", tags: "text", description: "text" });
productSchema.index({ published: 1, featured: -1, sales: -1, createdAt: -1 });

const addressSchema = new Schema({
  user: { type: objectId, ref: "User", required: true, index: true },
  label: { type: String, default: "Home" },
  recipient: String,
  address: { type: String, required: true },
  country: { type: String, required: true },
  state: String,
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, timestamps);

const orderItemSchema = new Schema({
  // Orders keep an immutable item snapshot even when a catalog product is later removed.
  product: { type: objectId, ref: "Product", default: null },
  seller: { type: objectId, ref: "User", required: true, index: true },
  name: { type: String, required: true },
  slug: String,
  image: String,
  variation: String,
  unitPrice: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  shipping: { type: Number, default: 0, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true, min: 0 },
  commissionRate: { type: Number, default: 0, min: 0, max: 100 },
  commission: { type: Number, default: 0, min: 0 },
  sellerEarning: { type: Number, default: 0, min: 0 },
  paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded", "failed"], default: "unpaid" },
  deliveryStatus: { type: String, enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"], default: "pending" },
}, { _id: true, versionKey: false });

const orderSchema = new Schema({
  legacyId: { type: Number, index: true, sparse: true },
  code: { type: String, required: true, unique: true, index: true },
  idempotencyKey: { type: String, unique: true, sparse: true, index: true },
  customer: { type: objectId, ref: "User", default: null, index: true },
  guestEmail: { type: String, lowercase: true, index: true },
  shippingAddress: {
    name: String, email: String, address: String, country: String, state: String,
    city: String, postalCode: String, phone: String,
  },
  items: { type: [orderItemSchema], validate: [(items: unknown[]) => items.length > 0, "Order requires at least one item"] },
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  shipping: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  couponCode: String,
  payment: {
    method: { type: String, enum: ["cod", "wallet", "stripe", "paypal", "razorpay", "manual"], default: "cod" },
    status: { type: String, enum: ["unpaid", "pending", "paid", "failed", "refunded"], default: "unpaid", index: true },
    transactionId: String,
    paidAt: Date,
  },
  status: { type: String, enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"], default: "pending", index: true },
  statusHistory: [{ status: String, at: { type: Date, default: Date.now }, note: String }],
  commissionCalculated: { type: Boolean, default: false },
  notes: String,
}, timestamps);
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ "items.seller": 1, createdAt: -1 });

const reviewSchema = new Schema({
  product: { type: objectId, ref: "Product", required: true, index: true },
  user: { type: objectId, ref: "User", required: true, index: true },
  order: { type: objectId, ref: "Order" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 2000 },
  published: { type: Boolean, default: true, index: true },
}, timestamps);
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const wishlistSchema = new Schema({
  user: { type: objectId, ref: "User", required: true, index: true },
  product: { type: objectId, ref: "Product", required: true, index: true },
}, timestamps);
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

const cartSchema = new Schema({
  user: { type: objectId, ref: "User", required: true, unique: true, index: true },
  items: [{
    product: { type: objectId, ref: "Product", required: true },
    variation: String,
    quantity: { type: Number, required: true, min: 1, max: 100 },
  }],
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), index: { expires: 0 } },
}, timestamps);

const walletTransactionSchema = new Schema({
  user: { type: objectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["credit", "debit", "refund", "recharge"], required: true },
  amount: { type: Number, required: true, min: 0.01 },
  balanceAfter: { type: Number, required: true, min: 0 },
  paymentMethod: String,
  reference: String,
  status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
  metadata: Schema.Types.Mixed,
}, timestamps);

const couponSchema = new Schema({
  code: { type: String, required: true, uppercase: true, unique: true, index: true },
  type: { type: String, enum: ["cart", "product"], default: "cart" },
  product: { type: objectId, ref: "Product" },
  products: [{ type: objectId, ref: "Product" }],
  discount: { type: Number, required: true, min: 0 },
  discountType: { type: String, enum: ["amount", "percent"], default: "amount" },
  minimumSpend: { type: Number, default: 0, min: 0 },
  maximumDiscount: { type: Number, default: null, min: 0 },
  startsAt: Date,
  endsAt: Date,
  usageLimit: { type: Number, default: null, min: 1 },
  used: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true },
}, timestamps);

const couponUsageSchema = new Schema({
  coupon: { type: objectId, ref: "Coupon", required: true, index: true },
  user: { type: objectId, ref: "User", default: null, index: true },
  guestEmail: { type: String, lowercase: true, trim: true },
  order: { type: objectId, ref: "Order", required: true, index: true },
}, timestamps);
couponUsageSchema.index({ coupon: 1, user: 1 }, { unique: true, partialFilterExpression: { user: { $type: "objectId" } } });

const sellerLedgerSchema = new Schema({
  seller: { type: objectId, ref: "User", required: true, index: true },
  shop: { type: objectId, ref: "Shop", required: true, index: true },
  order: { type: objectId, ref: "Order", required: true, index: true },
  orderItem: { type: objectId, required: true },
  type: { type: String, enum: ["sale", "commission", "refund", "withdrawal", "adjustment"], default: "sale" },
  paymentMethod: String,
  gross: { type: Number, required: true, min: 0 },
  commission: { type: Number, required: true, min: 0 },
  net: { type: Number, required: true },
  balanceDelta: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  reference: String,
  status: { type: String, enum: ["pending", "completed", "reversed"], default: "completed", index: true },
}, timestamps);
sellerLedgerSchema.index({ order: 1, orderItem: 1, type: 1 }, { unique: true });

const withdrawRequestSchema = new Schema({
  seller: { type: objectId, ref: "User", required: true, index: true },
  shop: { type: objectId, ref: "Shop", required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  message: { type: String, maxlength: 2000 },
  status: { type: String, enum: ["pending", "approved", "rejected", "paid"], default: "pending", index: true },
  processedBy: { type: objectId, ref: "User" },
  processedAt: Date,
}, timestamps);

const ticketSchema = new Schema({
  code: { type: String, required: true, unique: true, index: true },
  user: { type: objectId, ref: "User", required: true, index: true },
  subject: { type: String, required: true, maxlength: 240 },
  status: { type: String, enum: ["open", "pending", "answered", "closed"], default: "open", index: true },
  messages: [{ author: { type: objectId, ref: "User" }, message: String, attachment: String, createdAt: { type: Date, default: Date.now } }],
}, timestamps);

const conversationSchema = new Schema({
  participants: [{ type: objectId, ref: "User", index: true }],
  title: { type: String, required: true },
  messages: [{ sender: { type: objectId, ref: "User" }, body: String, readBy: [{ type: objectId, ref: "User" }], createdAt: { type: Date, default: Date.now } }],
}, timestamps);

const settingSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  group: { type: String, default: "general", index: true },
  value: Schema.Types.Mixed,
  public: { type: Boolean, default: false },
}, timestamps);

const currencySchema = new Schema({
  legacyId: { type: Number, index: true, sparse: true },
  name: { type: String, required: true, trim: true },
  symbol: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, unique: true, index: true },
  exchangeRate: { type: Number, required: true, min: 0.000001 },
  active: { type: Boolean, default: true, index: true },
}, timestamps);

const languageSchema = new Schema({
  legacyId: { type: Number, index: true, sparse: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, unique: true, index: true },
  rtl: { type: Boolean, default: false },
  active: { type: Boolean, default: true, index: true },
  translations: { type: Schema.Types.Mixed, default: {} },
}, timestamps);

const auditLogSchema = new Schema({
  actor: { type: objectId, ref: "User", index: true },
  action: { type: String, required: true, index: true },
  entity: { type: String, required: true, index: true },
  entityId: String,
  changes: Schema.Types.Mixed,
  ip: String,
  userAgent: String,
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });

const apiTokenSchema = new Schema({
  user: { type: objectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  name: { type: String, default: "API client", maxlength: 120 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  lastUsedAt: Date,
  userAgent: String,
  ip: String,
}, timestamps);

const externalAccountSchema = new Schema({
  user: { type: objectId, ref: "User", required: true, index: true },
  provider: { type: String, enum: ["google", "facebook"], required: true },
  providerAccountId: { type: String, required: true },
}, timestamps);
externalAccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });
externalAccountSchema.index({ user: 1, provider: 1 }, { unique: true });

const accountTokenSchema = new Schema({
  user: { type: objectId, ref: "User", default: null, index: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  purpose: { type: String, enum: ["password-reset", "email-verification"], required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  usedAt: Date,
}, timestamps);
accountTokenSchema.index({ email: 1, purpose: 1, createdAt: -1 });

function model<T>(name: string, schema: Schema<T>, collection?: string): Model<T> {
  return (mongoose.models[name] as Model<T> | undefined) || mongoose.model<T>(name, schema, collection);
}

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
export const CategoryModel = model("Category", categorySchema);
export const BrandModel = model("Brand", brandSchema);
export const ShopModel = model("Shop", shopSchema);
export const ProductModel = model("Product", productSchema);
export const AddressModel = model("Address", addressSchema);
export const OrderModel = model("Order", orderSchema);
export const ReviewModel = model("Review", reviewSchema);
export const WishlistModel = model("Wishlist", wishlistSchema);
export const CartModel = model("Cart", cartSchema);
export const WalletTransactionModel = model("WalletTransaction", walletTransactionSchema);
export const CouponModel = model("Coupon", couponSchema);
export const CouponUsageModel = model("CouponUsage", couponUsageSchema);
export const SellerLedgerModel = model("SellerLedger", sellerLedgerSchema);
export const WithdrawRequestModel = model("WithdrawRequest", withdrawRequestSchema);
export const TicketModel = model("Ticket", ticketSchema);
export const ConversationModel = model("Conversation", conversationSchema);
export const SettingModel = model("Setting", settingSchema);
export const CurrencyModel = model("Currency", currencySchema);
export const LanguageModel = model("Language", languageSchema);
export const AuditLogModel = model("AuditLog", auditLogSchema);
export const ApiTokenModel = model("ApiToken", apiTokenSchema);
export const ExternalAccountModel = model("ExternalAccount", externalAccountSchema);
export const AccountTokenModel = model("AccountToken", accountTokenSchema);
