import { MongoMemoryReplSet } from "mongodb-memory-server";

// Every credential and transport here is isolated from the application's .env.
Object.assign(process.env, {
  NODE_ENV: "test", API_PORT: "4000", API_PUBLIC_URL: "http://localhost:4000",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000", JWT_ACCESS_SECRET: "browser-access-secret-only",
  JWT_REFRESH_SECRET: "browser-refresh-secret-only", EMAIL_VERIFY_SECRET: "browser-email-secret-only",
  INTERNAL_API_SECRET: "browser-internal-secret-only", RUN_MAINTENANCE_JOBS: "false",
  SETTINGS_ENCRYPTION_KEY: "browser-settings-encryption-only-32bytes",
  API_RATE_LIMIT_PER_MINUTE: "10000", SMTP_HOST: "", SMTP_USER: "", SMTP_PASSWORD: "",
  TWILIO_ACCOUNT_SID: "", TWILIO_AUTH_TOKEN: "", TWILIO_VERIFY_SERVICE_SID: "", UPLOAD_DRIVER: "local",
});
// dotenv preserves defined values. Prevent provider credentials from the local
// application .env from becoming fallbacks in this disposable fixture.
for (const key of [
  "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET",
  "TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
  "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET", "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID",
  "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "S3_BUCKET", "S3_REGION", "S3_ENDPOINT",
  "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "AWS_BUCKET", "AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY",
]) process.env[key] = "";
const repl = await MongoMemoryReplSet.create({ binary: { version: "8.0.17" }, replSet: { count: 1 } });
process.env.MONGODB_URI = repl.getUri();
process.env.MONGODB_DB = "browser_acceptance_only";
const mongoose = (await import("mongoose")).default;
const { createApp } = await import("../dist/app.js");
const { User } = await import("../dist/models/User.js");
const { Shop } = await import("../dist/models/Shop.js");
const { Category, Brand } = await import("../dist/models/Category.js");
const { Product, FlashDeal } = await import("../dist/models/Product.js");
const { Order } = await import("../dist/models/Order.js");
const { Wallet } = await import("../dist/models/Wallet.js");
const { Page, Policy, Link } = await import("../dist/models/Content.js");
const { Language, Currency, Country, Translation } = await import("../dist/models/Localization.js");
const { Review } = await import("../dist/models/Address.js");
const { GeneralSetting, BusinessSetting, Addon } = await import("../dist/models/Settings.js");
const { CustomerProduct } = await import("../dist/models/CustomerProduct.js");
const { PickupPoint } = await import("../dist/models/Marketing.js");
const { hashPassword } = await import("../dist/utils/password.js");
await mongoose.connect(repl.getUri(), { dbName: "browser_acceptance_only" });
await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
const passwordHash = await hashPassword("Browser-password-123");
const [admin, seller, customer, staff] = await User.create(["admin", "seller", "customer", "staff"].map((role) => ({
  name: `Browser ${role}`, email: `${role}@browser.test`, passwordHash, role, emailVerifiedAt: new Date(),
  permissions: role === "staff" ? ["pickuppoints.manage", "pos.manage"] : [],
})));
await GeneralSetting.create({ appName: "Browser marketplace", defaultCurrency: "INR" });
await BusinessSetting.create({ shippingMode: "free", activation: { classifiedProduct: true, emailVerification: false } });
await Addon.create(["pos", "affiliate", "club_points", "refunds", "classified_products"].map((key) => ({ key, enabled: true })));
await Currency.create({ code: "INR", name: "Rupee", symbol: "₹", rateToBase: 1 });
await Country.create({ code: "IN", name: "India" });
await Language.create([{ code: "en", name: "English" }, { code: "hi", name: "Hindi" }, { code: "ar", name: "Arabic", rtl: true }]);
await Translation.create({ languageCode: "en", key: "nav.shop", value: "Browse test catalogue" });
const category = await Category.create({ name: "Browser category", slug: "browser-category", level: 0, featured: true });
const brand = await Brand.create({ name: "Browser brand", slug: "browser-brand", featured: true });
await Shop.create({ sellerId: seller!._id, name: "Browser shop", slug: "browser-shop", verified: true, verificationStatus: "approved" });
const product = await Product.create({ name: "Browser product", slug: "browser-product", sellerId: seller!._id,
  addedBy: "seller", categoryId: category._id, brandId: brand._id, published: true, approvalStatus: "approved", basePrice: 100,
  variants: [{ sku: "BROWSER-SKU", price: 100, stock: 100, reserved: 0 }], tax: 10, discount: 20, clubPoints: 5 });
await Wallet.create({ userId: customer!._id, currency: "INR", balance: 10000 });
await Page.create({ slug: "browser-page", title: "Browser page", body: "<h2>Browser CMS content</h2><script>window.cmsUnsafe=true</script><img src=x onerror='window.cmsUnsafe=true'>", published: true });
await Policy.create(["privacy", "terms", "return", "refund", "shipping", "support", "seller_agreement"].map((type) => ({ type, body: "Browser policy content" })));
await Link.create([{ label: "Browser header link", url: "/en/browser-page", placement: "header" }, { label: "Browser footer link", url: "/en/browser-page", placement: "footer" }]);
await CustomerProduct.create({ userId: customer!._id, title: "Browser classified", slug: "browser-classified", categoryId: category._id, price: 40, status: "approved", location: "Pune" });
await FlashDeal.create({ title: "Browser campaign", slug: "browser-campaign", active: true,
  startsAt: new Date(Date.now() - 86400000), endsAt: new Date(Date.now() + 86400000),
  products: [{ productId: product._id, variantSku: "BROWSER-SKU", discountType: "percent", discount: 25, dealStock: 50 }] });
const point = await PickupPoint.create({ name: "Browser pickup", city: "Pune", address: "Browser street", staffId: staff!._id });
const order = await Order.create({ code: "BROWSER-ORDER", userId: customer!._id,
  addressSnapshot: { line1: "Browser street", city: "Pune", state: "MH", postalCode: "411001", country: "IN", phone: "9000000000" },
  details: [{ sellerId: seller!._id, subtotal: 100, tax: 10, commissionRate: 10, commissionAmount: 10,
    pickupPointId: point._id, status: "delivered", deliveredAt: new Date(),
    items: [{ productId: product._id, variantSku: "BROWSER-SKU", name: product.name, unitPrice: 100, quantity: 1 }] }],
  grandTotal: 110, tax: 10, status: "delivered", inventoryStatus: "confirmed", paymentStatus: "paid", paymentMethod: "wallet", idempotencyKey: "browser-order-fixture" });
await Review.create(Array.from({ length: 25 }, (_, index) => ({ productId: product._id, orderId: new mongoose.Types.ObjectId(),
  userId: customer!._id, rating: index % 5 + 1, approved: true, comment: `Browser review ${index + 1}` })));
const app = createApp();
const server = app.listen(4000, () => console.log("Browser fixture listening on 4000; disposable database only"));
let closing = false;
async function stop() {
  if (closing) return;
  closing = true;
  server.close();
  await mongoose.disconnect();
  await repl.stop();
  process.exit(0);
}
process.on("SIGTERM", () => void stop());
process.on("SIGINT", () => void stop());
