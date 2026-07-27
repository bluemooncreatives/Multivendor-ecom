import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getBrands, getCategories, getProduct, getProducts, getShops, getSliders } from "@/lib/catalog";
import { createAccountToken } from "@/lib/account-tokens";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { checkoutSchema, CheckoutError, placeOrder, quoteCart } from "@/lib/checkout";
import { connectMongo, isMongoDuplicate, objectId } from "@/lib/mongodb";
import { asset } from "@/lib/utils";
import { sendVerificationEmail } from "@/lib/mailer";
import { oauthProviderEnabled, profileFromAccessToken, resolveOAuthUser, type OAuthProvider } from "@/lib/oauth";
import type { SessionUser } from "@/lib/types";
import { AddressModel, ApiTokenModel, BrandModel, CartModel, CategoryModel, OrderModel, ProductModel, ReviewModel, SettingModel, ShopModel, User, WalletTransactionModel, WishlistModel } from "@/models";
import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";
import { POST as resetPassword } from "@/app/api/auth/reset-password/route";

export const runtime = "nodejs";

function success(data: unknown, message = "Success", status = 200) { return NextResponse.json({ data, success: true, status, message }, { status }); }
function failure(message: string, status = 400) { return NextResponse.json({ data: [], success: false, status, message }, { status }); }
function productResource(product: Awaited<ReturnType<typeof getProducts>>[number]) { return { ...product, thumbnail_image: asset(product.thumbnail), base_price: product.price, base_discounted_price: product.salePrice, links: { details: `/api/v1/products/${product.id}` } }; }
function identifier(value: string): Record<string, unknown> { const id = objectId(value); return id ? { _id: id } : /^\d+$/.test(value) ? { legacyId: Number(value) } : { slug: value.toLowerCase() }; }
const DUMMY_PASSWORD_HASH = "$2b$12$p2i1w43nvDntqyJp36gMHODR56vuNv0GQXb.QF4/tfRWza8ctACA.";
interface AuthenticatedUser { session: SessionUser; id: mongoose.Types.ObjectId; apiTokenId?: mongoose.Types.ObjectId }

function tokenHash(token: string): string { return crypto.createHash("sha256").update(token).digest("hex"); }
function requestContext(request: Request) { return { userAgent: request.headers.get("user-agent")?.slice(0, 500), ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() }; }
function apiUser(user: { _id: unknown; legacyId?: number | null; role?: string; name?: string; email?: string; avatar?: string; phone?: string }) { return { id: String(user._id), legacy_id: user.legacyId, type: user.role || "customer", name: user.name, email: user.email, avatar: user.avatar, phone: user.phone }; }

async function issueApiToken(user: { _id: unknown }, request: Request) {
  const token = crypto.randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + Math.max(1, Number(process.env.API_TOKEN_DAYS || 30)) * 24 * 60 * 60 * 1000);
  await ApiTokenModel.create({ user: user._id, tokenHash: tokenHash(token), expiresAt, name: "V4Local API", ...requestContext(request) });
  return { token, expiresAt };
}

async function apiLogin(request: Request) {
  const body = z.object({ email: z.email().max(254).transform((value) => value.trim().toLowerCase()), password: z.string().min(1).max(200) }).parse(await request.json());
  await connectMongo();
  const user = await User.findOne({ email: body.email }).select("+passwordHash legacyId role name email avatar phone status provider emailVerifiedAt");
  const hash = user?.passwordHash?.replace(/^\$2y\$/, "$2a$") || DUMMY_PASSWORD_HASH;
  const valid = await bcrypt.compare(body.password, hash).catch(() => false);
  if (!user || !valid || user.status !== "active") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.provider === "password" && !user.emailVerifiedAt) return NextResponse.json({ message: "Verify your email before signing in." }, { status: 403 });
  const { token, expiresAt } = await issueApiToken(user, request);
  return NextResponse.json({ access_token: token, token_type: "Bearer", expires_at: expiresAt.toISOString(), user: apiUser(user), message: "Login Successful" });
}

async function apiSignup(request: Request) {
  const body = z.object({ name: z.string().trim().min(2).max(120), email: z.email().max(254).transform((value) => value.trim().toLowerCase()), password: z.string().min(8).max(200) }).parse(await request.json());
  await connectMongo();
  const verificationSetting = await SettingModel.findOne({ key: "business.email_verification" }).select("value").lean();
  const requiresVerification = verificationSetting?.value === true || String(verificationSetting?.value) === "1";
  const user = await User.create({ name: body.name, email: body.email, passwordHash: await bcrypt.hash(body.password, 12), role: "customer", status: requiresVerification ? "pending" : "active", provider: "password", emailVerifiedAt: requiresVerification ? undefined : new Date() });
  if (requiresVerification) {
    try { const token = await createAccountToken(user._id, user.email, "email-verification", 24 * 60); await sendVerificationEmail(user.email, token); }
    catch (error) { await User.deleteOne({ _id: user._id }); throw error; }
  }
  return NextResponse.json({ message: requiresVerification ? "Registration successful. Verify your email before signing in." : "Registration successful. Please sign in to your account.", requires_verification: requiresVerification }, { status: 201 });
}

async function requireUser(request: Request): Promise<AuthenticatedUser | null> {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const hash = tokenHash(authorization.slice(7).trim());
    await connectMongo();
    const apiToken = await ApiTokenModel.findOne({ tokenHash: hash, expiresAt: { $gt: new Date() } }).lean();
    const account = apiToken ? await User.findOne({ _id: apiToken.user, status: "active" }).select("name email role").lean() : null;
    if (apiToken && account) {
      await ApiTokenModel.updateOne({ _id: apiToken._id }, { $set: { lastUsedAt: new Date() } });
      const session: SessionUser = { id: String(account._id), name: account.name, email: account.email, role: account.role as SessionUser["role"] };
      return { session, id: account._id, apiTokenId: apiToken._id };
    }
    return null;
  }
  const session = await getSession();
  const id = session ? objectId(session.id) : null;
  return session && id ? { session, id } : null;
}

function legacyShippingAddress(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  if (typeof value !== "string") return {};
  try { const parsed = JSON.parse(value); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {}; }
  catch { return {}; }
}

async function mobileOrder(request: Request, auth: AuthenticatedUser) {
  const raw = z.record(z.string(), z.unknown()).parse(await request.json());
  await connectMongo();
  const [cart, account] = await Promise.all([
    CartModel.findOne({ user: auth.id }).lean(),
    User.findById(auth.id).select("name email phone").lean(),
  ]);
  if (!cart?.items.length || !account) throw new CheckoutError("Your cart is empty.", 409);
  const shipping = legacyShippingAddress(raw.shipping_address);
  const paymentType = String(raw.payment_type || raw.payment || "cash_on_delivery");
  if (!["cash_on_delivery", "cod"].includes(paymentType)) throw new CheckoutError("This payment provider has not been configured.", 503);
  const headerKey = request.headers.get("idempotency-key");
  const requestedKey = typeof raw.idempotency_key === "string" ? raw.idempotency_key : undefined;
  const input = checkoutSchema.parse({
    name: shipping.name || account.name,
    email: shipping.email || account.email,
    address: shipping.address,
    city: shipping.city,
    state: shipping.state,
    postal_code: shipping.postal_code || shipping.postalCode,
    country: shipping.country || "India",
    phone: shipping.phone || account.phone,
    payment: "cod",
    couponCode: raw.coupon_code,
    idempotencyKey: headerKey || requestedKey || crypto.randomUUID(),
    lines: cart.items.map((item: { product: unknown; quantity: number; variation?: string }) => ({ productId: String(item.product), quantity: item.quantity, variation: item.variation })),
    notes: raw.notes,
  });
  if (headerKey && requestedKey && headerKey !== requestedKey) throw new CheckoutError("The checkout request key is inconsistent.");
  const order = await placeOrder(input, auth.id);
  return success({ code: order.code, repeated: Boolean(order.repeated) }, "Your order has been placed successfully", order.repeated ? 200 : 201);
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const route = path.join("/");
  const url = new URL(request.url);
  try {
    if (route === "auth/user") { const auth = await requireUser(request); if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 }); const user = await User.findById(auth.id).select("legacyId role name email avatar phone").lean(); return user ? NextResponse.json(apiUser(user)) : NextResponse.json({ message: "Unauthorized" }, { status: 401 }); }
    if (route === "auth/logout") { const auth = await requireUser(request); if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 }); if (auth.apiTokenId) await ApiTokenModel.deleteOne({ _id: auth.apiTokenId }); const response = NextResponse.json({ message: "Successfully logged out" }); response.cookies.delete(SESSION_COOKIE); return response; }
    if (route === "banners") { await connectMongo(); return success(await mongoose.connection.db!.collection("banners").find({ published: { $ne: false } }).sort({ position: 1 }).toArray()); }
    if (route === "categories" || route === "categories/featured" || route === "categories/home") return success((await getCategories()).filter((category) => route === "categories" || category.featured).map((category) => ({ ...category, banner: asset(category.banner), icon: asset(category.icon) })));
    if (route.startsWith("sub-categories/")) { await connectMongo(); const category = await CategoryModel.findOne(identifier(path[1])).select("_id").lean(); return success(category ? await CategoryModel.find({ parent: category._id, active: true }).sort({ name: 1 }).lean() : []); }
    if (route === "brands" || route === "brands/top") return success((await getBrands()).filter((brand) => route === "brands" || brand.top).map((brand) => ({ ...brand, logo: asset(brand.logo) })));
    if (route === "sliders") return success((await getSliders()).map((photo, index) => ({ id: index + 1, photo: asset(photo) })));
    if (route === "home-categories") { await connectMongo(); return success(await mongoose.connection.db!.collection("homecategories").find({ active: true }).toArray()); }
    if (route === "shops") return success(await getShops());
    if (route.startsWith("shop/user/")) { const auth = await requireUser(request); if (!auth) return failure("Unauthorized", 401); await connectMongo(); return success(await ShopModel.findOne({ owner: auth.id }).lean()); }
    if (route.startsWith("shops/details/")) { await connectMongo(); return success(await ShopModel.findOne(identifier(path[2])).lean()); }
    if (route.startsWith("shops/products/")) { await connectMongo(); const shop = await ShopModel.findOne(identifier(path[path.length - 1])).select("owner").lean(); return success(shop ? (await getProducts({ sellerId: String(shop.owner), limit: 50 })).map(productResource) : []); }
    if (route.startsWith("shops/brands/")) { await connectMongo(); const shop = await ShopModel.findOne(identifier(path[2])).select("owner").lean(); const brandIds = shop ? await ProductModel.find({ seller: shop.owner, published: true, brand: { $ne: null } }).distinct("brand") : []; return success(await BrandModel.find({ _id: { $in: brandIds }, active: true }).sort({ name: 1 }).lean()); }
    if (route === "products" || route === "products/home" || route === "products/featured" || route === "products/todays-deal" || route === "products/flash-deal" || route === "products/best-seller" || route === "products/search") { const products = await getProducts({ query: url.searchParams.get("name") || url.searchParams.get("q") || undefined, featured: route === "products/featured", deal: route.includes("deal"), limit: Number(url.searchParams.get("limit") || 48) }); return success(products.map(productResource)); }
    if (route === "products/admin") { await connectMongo(); const admin = await User.findOne({ role: "admin" }).select("_id").lean(); return success(admin ? (await getProducts({ sellerId: String(admin._id), limit: 50 })).map(productResource) : []); }
    if (route === "products/seller") { await connectMongo(); const products = await ProductModel.find({ addedBy: "seller", published: true }).select("_id").limit(50).lean(); const records = (await Promise.all(products.map((product) => getProduct(String(product._id))))).filter((product): product is NonNullable<typeof product> => Boolean(product)); return success(records.map(productResource)); }
    if (route.startsWith("products/category/")) { await connectMongo(); const category = await CategoryModel.findOne(identifier(path[2])).select("slug").lean(); return success(category ? (await getProducts({ category: category.slug, limit: 50 })).map(productResource) : []); }
    if (route.startsWith("products/sub-category/")) { await connectMongo(); const category = await CategoryModel.findOne(identifier(path[2])).select("_id").lean(); const ids = category ? await ProductModel.find({ subcategory: category._id, published: true }).select("_id").limit(50).lean() : []; const products = (await Promise.all(ids.map((product) => getProduct(String(product._id))))).filter((product): product is NonNullable<typeof product> => Boolean(product)); return success(products.map(productResource)); }
    if (route.startsWith("products/sub-sub-category/")) { await connectMongo(); const category = await CategoryModel.findOne(identifier(path[2])).select("_id").lean(); const ids = category ? await ProductModel.find({ subsubcategory: category._id, published: true }).select("_id").limit(50).lean() : []; const products = (await Promise.all(ids.map((product) => getProduct(String(product._id))))).filter((product): product is NonNullable<typeof product> => Boolean(product)); return success(products.map(productResource)); }
    if (route.startsWith("products/brand/")) { await connectMongo(); const brand = await BrandModel.findOne(identifier(path[2])).select("slug").lean(); return success(brand ? (await getProducts({ brand: brand.slug, limit: 50 })).map(productResource) : []); }
    if (route.startsWith("products/related/")) { const product = await getProduct(path[2]); return success(product ? (await getProducts({ limit: 30 })).filter((candidate) => candidate.categoryId === product.categoryId && candidate.id !== product.id).map(productResource) : []); }
    if (route.startsWith("products/top-from-seller/")) { const product = await getProduct(path[2]); return success(product ? (await getProducts({ sellerId: product.sellerId, limit: 10 })).filter((candidate) => candidate.id !== product.id).map(productResource) : []); }
    if (/^products\/[^/]+$/.test(route)) { const product = await getProduct(path[1]); return product ? success(productResource(product)) : failure("Product not found", 404); }
    if (route === "business-settings" || route === "settings") { await connectMongo(); return success(await SettingModel.find(route === "settings" ? { public: true } : { group: "business" }).lean()); }
    if (route === "general-settings") { await connectMongo(); return success(await SettingModel.find({ group: "general", public: true }).lean()); }
    if (route === "currencies" || route === "colors") { await connectMongo(); return success(await mongoose.connection.db!.collection(route).find({ active: { $ne: false } }).toArray()); }
    if (route.startsWith("customers/")) { const auth = await requireUser(request); if (!auth) return failure("Unauthorized", 401); const user = await User.findById(auth.id).select("legacyId role name email avatar phone").lean(); return success(user ? apiUser(user) : null); }
    if (route.startsWith("reviews/product/")) { await connectMongo(); const product = await ProductModel.findOne(identifier(path[2])).select("_id").lean(); return success(product ? await ReviewModel.find({ product: product._id, published: true }).sort({ createdAt: -1 }).lean() : []); }
    if (route.startsWith("policies/")) { await connectMongo(); return success(await SettingModel.findOne({ key: `policy.${path[1]}`, public: true }).lean() || { value: "" }); }
    if (route.startsWith("purchase-history/")) { const auth = await requireUser(request); if (!auth) return failure("Unauthorized", 401); await connectMongo(); return success(await OrderModel.find({ customer: auth.id }).sort({ createdAt: -1 }).lean()); }
    if (route.startsWith("purchase-history-details/")) { const auth = await requireUser(request); if (!auth) return failure("Unauthorized", 401); await connectMongo(); const orderId = objectId(path[1]); return success(orderId ? await OrderModel.findOne({ _id: orderId, customer: auth.id }).lean() : null); }
    if (route.startsWith("wallet/balance/")) { const auth = await requireUser(request); if (!auth) return failure("Unauthorized", 401); await connectMongo(); const account = await User.findById(auth.id).select("balance").lean(); return success(Number(account?.balance || 0)); }
    if (route.startsWith("wallet/history/")) { const auth = await requireUser(request); if (!auth) return failure("Unauthorized", 401); await connectMongo(); return success(await WalletTransactionModel.find({ user: auth.id }).sort({ createdAt: -1 }).lean()); }
    if (route.startsWith("wishlists/")) { const auth = await requireUser(request); if (!auth) return failure("Unauthorized", 401); await connectMongo(); return success(await WishlistModel.find({ user: auth.id }).populate("product").sort({ createdAt: -1 }).lean()); }
    if (route.startsWith("carts/")) { const auth = await requireUser(request); if (!auth) return failure("Unauthorized", 401); await connectMongo(); return success(await CartModel.findOne({ user: auth.id }).populate("items.product").lean() || { items: [] }); }
    if (route.startsWith("user/info/")) { const auth = await requireUser(request); if (!auth) return failure("Unauthorized", 401); await connectMongo(); return success(await User.findById(auth.id).select("name email role avatar phone balance").lean()); }
    if (route.startsWith("user/shipping/address/")) { const auth = await requireUser(request); if (!auth) return failure("Unauthorized", 401); await connectMongo(); return success(await AddressModel.find({ user: auth.id }).sort({ isDefault: -1, createdAt: -1 }).lean()); }
    if (route.startsWith("user/shipping/delete/")) { const auth = await requireUser(request); if (!auth) return failure("Unauthorized", 401); const id = objectId(path[2]); if (!id) return failure("Invalid address id", 400); const removed = await AddressModel.deleteOne({ _id: id, user: auth.id }); return removed.deletedCount ? success(null, "Address deleted") : failure("Address not found", 404); }
    return failure("Invalid Route", 404);
  } catch {
    return failure("The requested data source is unavailable", 503);
  }
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const route = path.join("/");
  if (route === "auth/login") { try { return await apiLogin(request); } catch (error) { if (error instanceof z.ZodError) return NextResponse.json({ message: "Invalid credentials" }, { status: 400 }); return NextResponse.json({ message: "Login is temporarily unavailable" }, { status: 503 }); } }
  if (route === "auth/signup") { try { return await apiSignup(request); } catch (error) { if (error instanceof z.ZodError) return NextResponse.json({ message: error.issues[0]?.message || "Invalid registration" }, { status: 400 }); if (isMongoDuplicate(error)) return NextResponse.json({ message: "The email has already been taken." }, { status: 409 }); return NextResponse.json({ message: "Registration is temporarily unavailable" }, { status: 503 }); } }
  if (route === "auth/password/create" || route === "auth/password/forget_request") return forgotPassword(request);
  if (route === "auth/password/confirm_reset") {
    try { const body = z.record(z.string(), z.unknown()).parse(await request.json()); return resetPassword(new Request(request.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: body.token || body.code, password: body.password, passwordConfirmation: body.password_confirmation || body.passwordConfirmation || body.password }) })); }
    catch (error) { return error instanceof z.ZodError ? failure(error.issues[0]?.message || "Invalid reset request", 400) : failure("Password reset is unavailable", 503); }
  }
  if (route === "auth/social-login") {
    try {
      const body = z.object({ provider: z.enum(["google", "facebook"]).optional(), social_provider: z.enum(["google", "facebook"]).optional(), access_token: z.string().min(10).max(4096) }).refine((value) => Boolean(value.provider || value.social_provider), { message: "Provider is required" }).parse(await request.json());
      const provider = (body.provider || body.social_provider)! as OAuthProvider;
      if (!await oauthProviderEnabled(provider)) return failure("Social login is disabled", 409);
      const profile = await profileFromAccessToken(provider, body.access_token);
      const user = await resolveOAuthUser(provider, profile);
      const token = await issueApiToken(user, request);
      return NextResponse.json({ access_token: token.token, token_type: "Bearer", expires_at: token.expiresAt.toISOString(), user: apiUser(user), message: "Login Successful" });
    } catch (error) { return error instanceof z.ZodError ? failure(error.issues[0]?.message || "Invalid social login", 400) : failure("Social login failed", 401); }
  }
  try {
    if (route === "products/variant/price") {
      const body = z.object({ id: z.string().optional(), product_id: z.string().optional(), variation: z.string().trim().max(200).optional() }).parse(await request.json());
      const id = String(body.id || body.product_id || "");
      await connectMongo();
      const product = await ProductModel.findOne(identifier(id)).select("unitPrice discount discountType stock variants published").lean();
      if (!product?.published) return failure("Product not found", 404);
      const variant = body.variation && Array.isArray(product.variants) ? product.variants.find((candidate: any) => String(candidate?.name || candidate?.variant || "").trim().toLowerCase() === body.variation!.toLowerCase()) : null;
      const basePrice = Number(variant?.price ?? product.unitPrice);
      const price = Math.max(0, product.discountType === "percent" ? basePrice * (1 - Math.min(Number(product.discount), 100) / 100) : basePrice - Number(product.discount));
      return success({ price: Math.round(price * 100) / 100, stock: Number(variant?.stock ?? variant?.qty ?? product.stock), variation: body.variation });
    }
    const auth = await requireUser(request);
    if (!auth) return failure("Unauthorized", 401);
    await connectMongo();
    if (route === "order/store" || route === "payments/pay/cod") return await mobileOrder(request, auth);
    if (route === "coupon/apply") {
      const body = z.object({ code: z.string().trim().min(1).max(80).optional(), coupon_code: z.string().trim().min(1).max(80).optional() }).refine((value) => Boolean(value.code || value.coupon_code), { message: "Coupon code is required" }).parse(await request.json());
      const [cart, account] = await Promise.all([CartModel.findOne({ user: auth.id }).lean(), User.findById(auth.id).select("email").lean()]);
      if (!cart?.items.length || !account) return failure("Your cart is empty", 409);
      const quote = await quoteCart(cart.items.map((item: { product: unknown; quantity: number; variation?: string }) => ({ productId: String(item.product), quantity: item.quantity, variation: item.variation })), body.coupon_code || body.code, auth.id, account.email);
      return success(quote, "Coupon applied");
    }
    if (route === "wishlists/check-product") { const body = z.object({ product_id: z.string() }).parse(await request.json()); const product = objectId(body.product_id); return success(Boolean(product && await WishlistModel.exists({ user: auth.id, product }))); }
    if (route === "wishlists") { const body = z.object({ product_id: z.string() }).parse(await request.json()); const product = objectId(body.product_id); if (!product || !await ProductModel.exists({ _id: product, published: true })) return failure("Product not found", 404); await WishlistModel.updateOne({ user: auth.id, product }, { $setOnInsert: { user: auth.id, product } }, { upsert: true }); return success(null, "Added to wishlist"); }
    if (route === "carts/add") {
      const body = z.object({ product_id: z.string(), quantity: z.coerce.number().int().min(1).max(100), variation: z.string().trim().max(200).optional() }).parse(await request.json());
      const product = objectId(body.product_id);
      const catalogProduct = product ? await ProductModel.findOne({ _id: product, published: true }).select("stock minQuantity").lean() : null;
      if (!product || !catalogProduct) return failure("Product is unavailable", 404);
      const cart = await CartModel.findOne({ user: auth.id });
      const item = cart?.items.find((candidate: { product: unknown; variation?: string }) => String(candidate.product) === String(product) && (candidate.variation || "") === (body.variation || ""));
      const requestedQuantity = (item?.quantity || 0) + body.quantity;
      if (requestedQuantity > 100 || requestedQuantity > catalogProduct.stock) return failure("Product is unavailable in the requested quantity", 409);
      if (requestedQuantity < catalogProduct.minQuantity) return failure(`A minimum quantity of ${catalogProduct.minQuantity} is required`, 409);
      if (!cart) await CartModel.create({ user: auth.id, items: [{ product, quantity: requestedQuantity, variation: body.variation }] });
      else { if (item) item.quantity = requestedQuantity; else cart.items.push({ product, quantity: requestedQuantity, variation: body.variation }); cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); await cart.save(); }
      return success(null, "Added to cart");
    }
    if (route === "carts/change-quantity") {
      const body = z.object({ product_id: z.string(), quantity: z.coerce.number().int().min(1).max(100) }).parse(await request.json());
      const product = objectId(body.product_id);
      if (!product) return failure("Invalid product", 400);
      const catalogProduct = await ProductModel.findOne({ _id: product, published: true }).select("stock minQuantity").lean();
      if (!catalogProduct || body.quantity > catalogProduct.stock) return failure("Requested quantity is unavailable", 409);
      if (body.quantity < catalogProduct.minQuantity) return failure(`A minimum quantity of ${catalogProduct.minQuantity} is required`, 409);
      const update = await CartModel.updateOne({ user: auth.id, "items.product": product }, { $set: { "items.$.quantity": body.quantity, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
      return update.matchedCount ? success(null, "Cart updated") : failure("Cart item not found", 404);
    }
    if (route === "user/info/update") { const body = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().max(30).optional() }).parse(await request.json()); await User.updateOne({ _id: auth.id }, { $set: body }); return success(null, "Profile updated"); }
    if (route === "user/shipping/create") { const body = z.object({ address: z.string().min(3).max(500), country: z.string().min(2).max(120), city: z.string().min(2).max(120), postal_code: z.string().min(3).max(20), phone: z.string().min(5).max(30), recipient: z.string().max(120).optional() }).parse(await request.json()); const address = await AddressModel.create({ user: auth.id, address: body.address, country: body.country, city: body.city, postalCode: body.postal_code, phone: body.phone, recipient: body.recipient }); return success(address, "Address created", 201); }
    if (route === "user/shipping/update") { const body = z.object({ id: z.string(), address: z.string().min(3).max(500), country: z.string().min(2).max(120), city: z.string().min(2).max(120), postal_code: z.string().min(3).max(20), phone: z.string().min(5).max(30), recipient: z.string().max(120).optional() }).parse(await request.json()); const id = objectId(body.id); if (!id) return failure("Invalid address", 400); const updated = await AddressModel.updateOne({ _id: id, user: auth.id }, { $set: { address: body.address, country: body.country, city: body.city, postalCode: body.postal_code, phone: body.phone, recipient: body.recipient } }, { runValidators: true }); return updated.matchedCount ? success(null, "Address updated") : failure("Address not found", 404); }
    if (route === "reviews/submit") { const body = z.object({ product_id: z.string(), rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().max(2000).optional() }).parse(await request.json()); const product = objectId(body.product_id); if (!product) return failure("Invalid product", 400); const order = await OrderModel.findOne({ customer: auth.id, items: { $elemMatch: { product, paymentStatus: "paid", deliveryStatus: "delivered" } } }).sort({ createdAt: -1 }).select("_id").lean(); if (!order) return failure("Reviews are available after delivery", 409); const review = await ReviewModel.findOneAndUpdate({ user: auth.id, product }, { $set: { order: order._id, rating: body.rating, comment: body.comment, published: true } }, { upsert: true, new: true, runValidators: true }); const summary = await ReviewModel.aggregate<{ average: number }>([{ $match: { product, published: true } }, { $group: { _id: null, average: { $avg: "$rating" } } }]); await ProductModel.updateOne({ _id: product }, { $set: { rating: Math.round((summary[0]?.average || 0) * 10) / 10 } }); return success(review, "Review saved", 201); }
    if (route.startsWith("payments/pay/")) return failure("This payment provider has not been configured", 503);
    return failure("Invalid Route", 404);
  } catch (error) {
    if (error instanceof z.ZodError) return failure(error.issues[0]?.message || "Invalid request", 400);
    if (error instanceof CheckoutError) return failure(error.message, error.status);
    if (isMongoDuplicate(error)) return success(null, "Already exists");
    return failure("The operation could not be completed", 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const auth = await requireUser(request);
  if (!auth) return failure("Unauthorized", 401);
  const { path } = await params;
  const route = path.join("/");
  try {
    await connectMongo();
    if (route.startsWith("wishlists/")) { const id = objectId(path[1]); if (!id) return failure("Invalid wishlist id", 400); await WishlistModel.deleteOne({ _id: id, user: auth.id }); return success(null, "Removed from wishlist"); }
    if (route.startsWith("carts/")) { const product = objectId(path[1]); if (!product) return failure("Invalid product id", 400); await CartModel.updateOne({ user: auth.id }, { $pull: { items: { product } } }); return success(null, "Removed from cart"); }
    if (route.startsWith("user/shipping/delete/")) { const id = objectId(path[2]); if (!id) return failure("Invalid address id", 400); await AddressModel.deleteOne({ _id: id, user: auth.id }); return success(null, "Address deleted"); }
    return failure("Invalid Route", 404);
  } catch {
    return failure("The operation could not be completed", 500);
  }
}
