import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { addDays, subDays, subHours } from "date-fns";
import { connectDb, disconnectDb } from "../config/db.js";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";
import { PERMISSIONS } from "../config/permissions.js";
import { privateUploadsRoot } from "../config/storage.js";
import { hashPassword } from "../utils/password.js";
import { mergeSecrets } from "../utils/secrets.js";
import { recomputeProductRating } from "../services/review.service.js";
import {
  User,
  RefreshToken,
  Shop,
  Category,
  Brand,
  Attribute,
  Color,
  Product,
  FlashDeal,
  CustomerProduct,
  Cart,
  Address,
  Wishlist,
  Review,
  Coupon,
  CouponUsage,
  Order,
  Payment,
  PaymentEvent,
  PaymentReceipt,
  Wallet,
  WalletTransaction,
  WalletRechargeRequest,
  InventoryMovement,
  SellerLedger,
  SellerWithdrawRequest,
  SellerPayout,
  Ticket,
  Conversation,
  SellerPackage,
  SellerPackagePayment,
  CustomerPackage,
  CustomerPackagePayment,
  AffiliateUser,
  AffiliateConfig,
  AffiliateEarningDetail,
  AffiliateWithdrawRequest,
  AffiliatePayment,
  Page,
  Policy,
  Slider,
  Banner,
  HomeCategory,
  Link,
  Subscriber,
  PickupPoint,
  Search,
  GeneralSetting,
  SeoSetting,
  BusinessSetting,
  Addon,
  ManualPaymentMethod,
  OtpSetting,
  SmsLog,
  SellerVerificationField,
  Language,
  Currency,
  Translation,
  Country,
  Role,
  StaffPermission,
  AdminAuditLog,
  ClubPointTransaction,
  ClubPointConfig,
  RefundRequest,
  RefundConfig,
  PaymentGateway,
} from "../models/index.js";
import { GatewayIntent } from "../models/GatewayIntent.js";
import { SmsOutbox } from "../models/SmsOutbox.js";
import {
  IMG,
  COLORS_DATA,
  CMS_PAGES,
  POLICIES_DATA,
  HEADER_FOOTER_LINKS,
  SUBSCRIBERS_DATA,
  SEARCH_ANALYTICS,
} from "./seed-content.js";

const SAMPLE_PDF_BYTES = Buffer.from(
  "%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >>endobj\n4 0 obj<< /Length 44 >>stream\nBT /F1 18 Tf 20 80 Td (PHPStore Digital Edition) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000200 00000 n \ntrailer<< /Size 5 /Root 1 0 R >>\nstartxref\n294\n%%EOF\n",
  "utf8",
);

async function ensureDigitalFiles(): Promise<Record<string, string>> {
  const dir = path.join(privateUploadsRoot, "digital", "seed");
  await fs.mkdir(dir, { recursive: true });
  const files = {
    handbook: "digital/seed/ui-system-handbook.pdf",
    playbook: "digital/seed/local-brand-playbook.pdf",
    cookbook: "digital/seed/regional-spice-cookbook.pdf",
  };
  for (const rel of Object.values(files)) {
    await fs.writeFile(path.join(privateUploadsRoot, rel), SAMPLE_PDF_BYTES);
  }
  return {
    handbook: `private-upload:///${files.handbook}`,
    playbook: `private-upload:///${files.playbook}`,
    cookbook: `private-upload:///${files.cookbook}`,
  };
}

async function clearCollections() {
  await Promise.all([
    RefreshToken.deleteMany({}),
    AdminAuditLog.deleteMany({}),
    Role.deleteMany({}),
    StaffPermission.deleteMany({}),
    Language.deleteMany({}),
    Currency.deleteMany({}),
    Country.deleteMany({}),
    Translation.deleteMany({}),
    ManualPaymentMethod.deleteMany({}),
    SellerVerificationField.deleteMany({}),
    PaymentGateway.deleteMany({}),
    Address.deleteMany({}),
    Wishlist.deleteMany({}),
    Review.deleteMany({}),
    Cart.deleteMany({}),
    CouponUsage.deleteMany({}),
    Coupon.deleteMany({}),
    FlashDeal.deleteMany({}),
    CustomerProduct.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Attribute.deleteMany({}),
    Color.deleteMany({}),
    Shop.deleteMany({}),
    SellerPackagePayment.deleteMany({}),
    CustomerPackagePayment.deleteMany({}),
    SellerPackage.deleteMany({}),
    CustomerPackage.deleteMany({}),
    GatewayIntent.deleteMany({}),
    PaymentEvent.deleteMany({}),
    PaymentReceipt.deleteMany({}),
    Payment.deleteMany({}),
    RefundRequest.deleteMany({}),
    InventoryMovement.deleteMany({}),
    SellerLedger.deleteMany({}),
    SellerWithdrawRequest.deleteMany({}),
    SellerPayout.deleteMany({}),
    Order.deleteMany({}),
    WalletTransaction.deleteMany({}),
    WalletRechargeRequest.deleteMany({}),
    Wallet.deleteMany({}),
    ClubPointTransaction.deleteMany({}),
    AffiliateEarningDetail.deleteMany({}),
    AffiliateWithdrawRequest.deleteMany({}),
    AffiliatePayment.deleteMany({}),
    AffiliateUser.deleteMany({}),
    Ticket.deleteMany({}),
    Conversation.deleteMany({}),
    Page.deleteMany({}),
    Policy.deleteMany({}),
    Slider.deleteMany({}),
    Banner.deleteMany({}),
    HomeCategory.deleteMany({}),
    Link.deleteMany({}),
    Subscriber.deleteMany({}),
    PickupPoint.deleteMany({}),
    Search.deleteMany({}),
    SmsLog.deleteMany({}),
    SmsOutbox.deleteMany({}),
    User.deleteMany({}),
  ]);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function seed() {
  await connectDb();
  logger.info("Resetting and seeding comprehensive marketplace dataset...");
  const now = new Date();
  const digitalUrls = await ensureDigitalFiles();
  await clearCollections();

  // 1. Permissions & Roles
  await StaffPermission.insertMany(PERMISSIONS);
  await Role.insertMany([
    {
      name: "Catalog Moderator",
      permissions: ["dashboard.view", "catalog.manage", "catalog.moderate", "flashdeals.manage"],
    },
    {
      name: "Order & Pickup Operations",
      permissions: ["dashboard.view", "orders.manage", "sales.view", "pickuppoints.manage", "pos.manage"],
    },
    {
      name: "Finance & Refunds Officer",
      permissions: ["dashboard.view", "payments.manage", "refunds.manage", "reports.view"],
    },
    {
      name: "Customer Support Lead",
      permissions: ["dashboard.view", "tickets.manage", "conversations.manage", "users.manage"],
    },
  ]);

  // 2. Localization
  await Language.insertMany([
    { code: "en", name: "English", rtl: false, active: true },
    { code: "hi", name: "Hindi", rtl: false, active: true },
    { code: "ar", name: "Arabic", rtl: true, active: true },
  ]);

  await Currency.insertMany([
    { code: "INR", name: "Indian Rupee", symbol: "₹", rateToBase: 1, decimals: 2, symbolPosition: "before", active: true },
    { code: "USD", name: "US Dollar", symbol: "$", rateToBase: 83, decimals: 2, symbolPosition: "before", active: true },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", rateToBase: 22.6, decimals: 2, symbolPosition: "before", active: true },
    { code: "EUR", name: "Euro", symbol: "€", rateToBase: 90, decimals: 2, symbolPosition: "before", active: true },
    { code: "GBP", name: "British Pound", symbol: "£", rateToBase: 105, decimals: 2, symbolPosition: "before", active: true },
  ]);

  await Country.insertMany([
    { code: "IN", name: "India", defaultCurrency: "INR", active: true },
    { code: "US", name: "United States", defaultCurrency: "USD", active: true },
    { code: "AE", name: "United Arab Emirates", defaultCurrency: "AED", active: true },
    { code: "GB", name: "United Kingdom", defaultCurrency: "GBP", active: true },
    { code: "DE", name: "Germany", defaultCurrency: "EUR", active: true },
    { code: "SG", name: "Singapore", defaultCurrency: "USD", active: true },
  ]);

  await Translation.insertMany([
    { languageCode: "en", key: "home.title", value: "PHPStore — Curated Multivendor Marketplace" },
    { languageCode: "en", key: "home.subtitle", value: "Discover verified independent sellers, flash deals, and handcrafted goods" },
    { languageCode: "en", key: "nav.shop", value: "Shop All" },
    { languageCode: "hi", key: "home.title", value: "PHPStore — वोकल फॉर लोकल मार्केटप्लेस" },
    { languageCode: "hi", key: "nav.shop", value: "खरीदारी करें" },
    { languageCode: "ar", key: "home.title", value: "PHPStore — سوق متعدد البائعين" },
    { languageCode: "ar", key: "nav.shop", value: "تسوق الآن" },
  ]);

  // 3. Settings, Addons, Gateways, Verification Fields
  await GeneralSetting.findOneAndUpdate(
    { key: "general" },
    {
      key: "general",
      appName: "PHPStore - Be Vocal for Local - Digital India",
      defaultLanguage: "en",
      defaultCurrency: "INR",
      defaultTimezone: "Asia/Kolkata",
      logoUrl: "/frontend/images/logo/logo.png",
      footerLogoUrl: "/frontend/images/logo/logo2.png",
      adminLogoUrl: "/frontend/images/logo/logo.png",
      themeColor: "#2563eb",
      address: "42 MG Road, Indiranagar, Bengaluru 560038, India",
      footerText: "Supporting verified Indian makers, independent sellers, and D2C brands nationwide.",
      socialProfiles: {
        facebook: "https://facebook.com/phpstore",
        twitter: "https://x.com/phpstore",
        instagram: "https://instagram.com/phpstore",
        youtube: "https://youtube.com/@phpstore",
        linkedin: "https://linkedin.com/company/phpstore",
      },
      supportEmail: "support@v4local.in",
      supportPhone: "+91 80 4123 9800",
    },
    { upsert: true, new: true },
  );

  await SeoSetting.findOneAndUpdate(
    { key: "seo" },
    {
      key: "seo",
      metaTitle: "PHPStore — Be Vocal for Local Multivendor Marketplace",
      metaDescription: "Shop electronics, handloom fashion, home decor, organic wellness, and digital downloads from verified local sellers.",
      metaKeywords: ["multivendor", "indian marketplace", "vocal for local", "electronics", "handloom", "organic"],
      author: "PHPStore Digital India",
      revisitAfterDays: 7,
      sitemapUrl: "http://localhost:3000/sitemap.xml",
      googleAnalyticsEnabled: true,
      googleAnalyticsId: "G-T7899BYWWM",
      facebookPixelEnabled: false,
      facebookChatEnabled: false,
    },
    { upsert: true, new: true },
  );

  await BusinessSetting.findOneAndUpdate(
    { key: "business" },
    {
      key: "business",
      taxPercent: 5,
      commissionPercent: 10,
      shippingMode: "flat",
      flatShippingCost: 49,
      adminShippingCost: 49,
      minOrderForFreeShipping: 1999,
      demoMode: false,
      activation: {
        vendorSystem: true,
        conversation: true,
        couponSystem: true,
        walletSystem: true,
        pickupPoint: true,
        guestCheckout: true,
        classifiedProduct: true,
        maintenanceMode: false,
        forceHttps: false,
        emailVerification: true,
        categoryBasedCommission: true,
        cashOnDelivery: true,
        reviewSystem: true,
      },
    },
    { upsert: true, new: true },
  );

  for (const key of ["affiliate", "pos", "seller_subscription", "club_points", "classified_products", "manual_payment", "otp", "refunds"] as const) {
    await Addon.findOneAndUpdate({ key }, { key, enabled: true, config: {} }, { upsert: true });
  }

  const [sbiBank, upiMethod, neftMethod] = await ManualPaymentMethod.insertMany([
    {
      name: "Bank Transfer (SBI)",
      instructions: "Transfer the exact order or recharge amount to the SBI account below and upload your transaction receipt.",
      accountDetails: { bank: "State Bank of India", accountName: "PHPStore Marketplace Pvt Ltd", accountNumber: "389100245819", ifsc: "SBIN0004120" },
      active: true,
    },
    {
      name: "UPI / IMPS Direct",
      instructions: "Pay via any UPI app to phpstore@icici and upload a screenshot showing the UTR reference number.",
      accountDetails: { upiId: "phpstore@icici", beneficiary: "PHPStore Marketplace" },
      active: true,
    },
    {
      name: "HDFC Corporate NEFT",
      instructions: "Use NEFT/RTGS for orders above ₹25,000 and attach the bank acknowledgement PDF or screenshot.",
      accountDetails: { bank: "HDFC Bank", accountNumber: "50200049182711", ifsc: "HDFC0000512" },
      active: true,
    },
    {
      name: "Legacy Cheque Deposit",
      instructions: "Deprecated offline cheque deposit method.",
      accountDetails: { branch: "MG Road" },
      active: false,
    },
  ]);

  await OtpSetting.findOneAndUpdate(
    { key: "otp" },
    {
      key: "otp",
      provider: "twilio",
      otpOnRegistration: false,
      otpOnForgotPassword: true,
      otpOnOrderPlacement: true,
      smsOnDeliveryStatus: true,
      smsOnPaymentStatus: true,
      senderId: "V4LOCL",
    },
    { upsert: true, new: true },
  );

  const verificationFields = await SellerVerificationField.insertMany([
    { label: "GSTIN / Tax Registration Number", type: "text", options: [], required: true, order: 1, active: true },
    { label: "Business Entity Type", type: "select", options: ["Sole Proprietorship", "Partnership / LLP", "Private Limited", "Artisan Cooperative"], required: true, order: 2, active: true },
    { label: "Primary Product Categories", type: "multi_select", options: ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Books & Digital", "Grocery"], required: true, order: 3, active: true },
    { label: "Fulfillment Warehouse Ownership", type: "radio", options: ["Owned Warehouse", "Leased Fulfillment Center", "Home Studio"], required: true, order: 4, active: true },
    { label: "Business Registration / KYC Document", type: "file", options: [], required: true, order: 5, active: true },
  ]);

  await ClubPointConfig.findOneAndUpdate(
    { key: "club_points" },
    { key: "club_points", convertRate: 0.5, minConvertPoints: 100 },
    { upsert: true, new: true },
  );

  await RefundConfig.findOneAndUpdate(
    { key: "refund" },
    { key: "refund", requestWindowDays: 14, showSticker: true },
    { upsert: true, new: true },
  );

  const canEncrypt = Boolean(env.SETTINGS_ENCRYPTION_KEY);
  const gatewaySeeds = [
    { code: "paytm", enabled: true, sandbox: true, creds: { merchantId: "DEMO_PAYTM_MID", merchantKey: "DEMO_PAYTM_KEY_1234", website: "WEBSTAGING" } },
    { code: "instamojo", enabled: true, sandbox: true, creds: { apiKey: "DEMO_INSTAMOJO_KEY", authToken: "DEMO_INSTAMOJO_TOKEN" } },
    { code: "sslcommerz", enabled: true, sandbox: true, creds: { storeId: "DEMO_SSL_STORE", storePassword: "DEMO_SSL_PASSWORD" } },
    { code: "paystack", enabled: false, sandbox: true, creds: {} },
    { code: "voguepay", enabled: false, sandbox: true, creds: {} },
    { code: "payhere", enabled: false, sandbox: true, creds: {} },
    { code: "ngenius", enabled: false, sandbox: true, creds: {} },
    { code: "mpesa", enabled: false, sandbox: true, creds: {} },
    { code: "flutterwave", enabled: false, sandbox: true, creds: {} },
    { code: "twocheckout", enabled: false, sandbox: true, creds: {} },
  ] as const;

  for (const gw of gatewaySeeds) {
    const credentials = canEncrypt && Object.keys(gw.creds).length
      ? mergeSecrets({}, gw.creds, Object.keys(gw.creds))
      : {};
    await PaymentGateway.create({ code: gw.code, enabled: gw.enabled, sandbox: gw.sandbox, credentials });
  }

  // 4. Packages
  const [pkgFree, pkgGrowth, pkgPro, pkgEnterprise] = await SellerPackage.insertMany([
    { name: "Starter Free", price: 0, durationDays: 30, productLimit: 10, digitalProductLimit: 2, commissionRateOverride: null, active: true },
    { name: "Growth Plan", price: 999, durationDays: 90, productLimit: 50, digitalProductLimit: 10, commissionRateOverride: 8, active: true },
    { name: "Pro Marketplace", price: 2499, durationDays: 180, productLimit: 200, digitalProductLimit: 50, commissionRateOverride: 6, active: true },
    { name: "Enterprise Unlimited", price: 4999, durationDays: 365, productLimit: 1000, digitalProductLimit: 250, commissionRateOverride: 5, active: true },
  ]);

  const [custPkgBasic, custPkgStd, custPkgPower] = await CustomerPackage.insertMany([
    { name: "Basic Classifieds", price: 0, durationDays: 30, classifiedListingLimit: 3, active: true },
    { name: "Standard Lister", price: 299, durationDays: 90, classifiedListingLimit: 15, active: true },
    { name: "Power Lister", price: 799, durationDays: 180, classifiedListingLimit: 50, active: true },
  ]);

  // 5. Users (preserving the 4 canonical accounts + adding rich staff, sellers, customers)
  const passwordHash = await hashPassword("Password123!");

  const admin = await User.create({
    name: "Admin",
    email: "admin@example.com",
    phone: "+919800000001",
    passwordHash,
    role: "admin",
    avatarUrl: IMG.avatar1,
    emailVerifiedAt: subDays(now, 90),
    phoneVerifiedAt: subDays(now, 90),
  });

  const staff1 = await User.create({
    name: "Staff Member",
    email: "staff@example.com",
    phone: "+919800000002",
    passwordHash,
    role: "staff",
    permissions: [
      "dashboard.view",
      "orders.manage",
      "catalog.moderate",
      "catalog.manage",
      "pickuppoints.manage",
      "pos.manage",
      "tickets.manage",
      "refunds.manage",
      "sellers.manage",
      "users.manage",
      "reports.view",
    ],
    avatarUrl: IMG.avatar3,
    emailVerifiedAt: subDays(now, 60),
    phoneVerifiedAt: subDays(now, 60),
  });

  const staff2 = await User.create({
    name: "Neha Kulkarni",
    email: "support.lead@example.com",
    phone: "+919800000003",
    passwordHash,
    role: "staff",
    permissions: ["dashboard.view", "tickets.manage", "conversations.manage", "users.manage", "refunds.manage"],
    avatarUrl: IMG.avatar2,
    emailVerifiedAt: subDays(now, 45),
    phoneVerifiedAt: subDays(now, 45),
  });

  const staff3 = await User.create({
    name: "Arvind Menon",
    email: "pickup.ops@example.com",
    phone: "+919800000004",
    passwordHash,
    role: "staff",
    permissions: ["dashboard.view", "orders.manage", "pickuppoints.manage", "pos.manage"],
    emailVerifiedAt: subDays(now, 30),
    phoneVerifiedAt: subDays(now, 30),
  });

  // Sellers
  const [sellerDemo, sellerTech, sellerHandloom, sellerWellness, sellerUrbanPending, sellerCraftRejected] =
    await User.insertMany([
      { name: "Demo Seller", email: "seller@example.com", phone: "+919810000001", passwordHash, role: "seller", avatarUrl: IMG.avatar1, emailVerifiedAt: subDays(now, 60), phoneVerifiedAt: subDays(now, 60) },
      { name: "Aarav Tech Studio", email: "aarav.tech@example.com", phone: "+919810000002", passwordHash, role: "seller", avatarUrl: IMG.avatar3, emailVerifiedAt: subDays(now, 55), phoneVerifiedAt: subDays(now, 55) },
      { name: "Kaveri Handlooms", email: "kaveri.looms@example.com", phone: "+919810000003", passwordHash, role: "seller", avatarUrl: IMG.avatar2, emailVerifiedAt: subDays(now, 50), phoneVerifiedAt: subDays(now, 50) },
      { name: "Veda Wellness", email: "veda.wellness@example.com", phone: "+919810000004", passwordHash, role: "seller", avatarUrl: IMG.avatar4, emailVerifiedAt: subDays(now, 45), phoneVerifiedAt: subDays(now, 45) },
      { name: "Urban Nest Living", email: "urbannest@example.com", phone: "+919810000005", passwordHash, role: "seller", emailVerifiedAt: subDays(now, 10), phoneVerifiedAt: subDays(now, 10) },
      { name: "Craftsman Studio", email: "craftsman@example.com", phone: "+919810000006", passwordHash, role: "seller", emailVerifiedAt: subDays(now, 20), phoneVerifiedAt: subDays(now, 20) },
    ]);

  // Primary customer + additional customers (including referred users & 1 banned user)
  const customerDemo = await User.create({
    name: "Demo Customer",
    email: "customer@example.com",
    phone: "+919820000001",
    passwordHash,
    role: "customer",
    avatarUrl: IMG.avatar2,
    emailVerifiedAt: subDays(now, 60),
    phoneVerifiedAt: subDays(now, 60),
    referralCode: "DEMOCUST",
    clubPoints: 450,
    customerPackageId: custPkgStd!._id,
    remainingUploads: 12,
    packageInvalidAt: addDays(now, 60),
  });

  const [custAnanya, custRohan, custPriya, custVikram, custSneha, custKabir, custMeera, custArjun, custBanned] =
    await User.insertMany([
      { name: "Ananya Sharma", email: "ananya.sharma@example.com", phone: "+919820000002", passwordHash, role: "customer", avatarUrl: IMG.avatar4, emailVerifiedAt: subDays(now, 40), phoneVerifiedAt: subDays(now, 40), referralCode: "ANANYA88", referredBy: customerDemo._id, clubPoints: 320, customerPackageId: custPkgPower!._id, remainingUploads: 48, packageInvalidAt: addDays(now, 140) },
      { name: "Rohan Mehta", email: "rohan.mehta@example.com", phone: "+919820000003", passwordHash, role: "customer", avatarUrl: IMG.avatar3, emailVerifiedAt: subDays(now, 35), phoneVerifiedAt: subDays(now, 35), referredBy: customerDemo._id, clubPoints: 180, customerPackageId: custPkgBasic!._id, remainingUploads: 2, packageInvalidAt: addDays(now, 20) },
      { name: "Priya Nair", email: "priya.nair@example.com", phone: "+919820000004", passwordHash, role: "customer", emailVerifiedAt: subDays(now, 30), phoneVerifiedAt: subDays(now, 30), referredBy: customerDemo._id, clubPoints: 210 },
      { name: "Vikram Patel", email: "vikram.patel@example.com", phone: "+919820000005", passwordHash, role: "customer", emailVerifiedAt: subDays(now, 25), phoneVerifiedAt: subDays(now, 25), clubPoints: 95 },
      { name: "Sneha Iyer", email: "sneha.iyer@example.com", phone: "+919820000006", passwordHash, role: "customer", emailVerifiedAt: subDays(now, 20), phoneVerifiedAt: subDays(now, 20), clubPoints: 150 },
      { name: "Kabir Verma", email: "kabir.verma@example.com", phone: "+919820000007", passwordHash, role: "customer", emailVerifiedAt: subDays(now, 18), clubPoints: 60 },
      { name: "Meera Joshi", email: "meera.joshi@example.com", phone: "+919820000008", passwordHash, role: "customer", emailVerifiedAt: subDays(now, 14), clubPoints: 40 },
      { name: "Arjun Reddy", email: "arjun.reddy@example.com", phone: "+919820000009", passwordHash, role: "customer", emailVerifiedAt: subDays(now, 10), clubPoints: 110 },
      { name: "Blocked Test Buyer", email: "blocked.buyer@example.com", phone: "+919820000010", passwordHash, role: "customer", banned: true, emailVerifiedAt: subDays(now, 50) },
    ]);

  await User.updateOne({ _id: custAnanya!._id }, { referredBy: customerDemo._id });
  await User.updateOne({ _id: custVikram!._id }, { referredBy: custAnanya!._id });

  // 6. Shops
  const [fGstin, fType, fCats, fWh, fDoc] = verificationFields;
  await Shop.insertMany([
    {
      sellerId: sellerDemo!._id,
      name: "Demo Seller Shop",
      slug: "demo-seller-shop",
      logoUrl: "/shop/logo/Gt1xw7vjTpMnwpADkGSilc35qrAfcw02kuZ36Jdn.png",
      bannerUrl: "/shop/sliders/2kzmQ2GcGi5Ogjz4qab3oh1yXT2wg3zjos6nlVdT.jpeg",
      description: "Flagship curated store offering wireless audio, everyday essentials, fashion basics, and digital guides.",
      address: "18 Residency Road, Bengaluru 560025",
      socialLinks: { instagram: "https://instagram.com/demosellershop", website: "https://v4local.in" },
      shippingCost: 49,
      verified: true,
      verificationStatus: "approved",
      verificationDocs: ["https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800"],
      verificationAnswers: {
        [String(fGstin!._id)]: "29AABCU9603R1ZM",
        [String(fType!._id)]: "Private Limited",
        [String(fCats!._id)]: ["Electronics", "Fashion"],
        [String(fWh!._id)]: "Owned Warehouse",
        [String(fDoc!._id)]: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
      },
      sellerPackageId: pkgGrowth!._id,
      remainingUploads: 42,
      remainingDigitalUploads: 8,
      packageInvalidAt: addDays(now, 75),
    },
    {
      sellerId: sellerTech!._id,
      name: "Aarav Tech Studio",
      slug: "aarav-tech-studio",
      logoUrl: "/shop/logo/Fn54wigRaMNBipEc275fWOES2zPgcTo4st92Od4U.jpeg",
      bannerUrl: "/shop/sliders/5Fy61fD3OAclcMC7rfiM1doGS4u5AwxhitSfpqed.jpeg",
      description: "Smart gadgets, mechanical keyboards, precision peripherals, and audio hardware.",
      address: "204 Linking Road, Bandra West, Mumbai 400050",
      socialLinks: { twitter: "https://x.com/aaravtech" },
      shippingCost: 60,
      verified: true,
      verificationStatus: "approved",
      sellerPackageId: pkgPro!._id,
      remainingUploads: 185,
      remainingDigitalUploads: 46,
      packageInvalidAt: addDays(now, 150),
    },
    {
      sellerId: sellerHandloom!._id,
      name: "Kaveri Handlooms",
      slug: "kaveri-handlooms",
      logoUrl: IMG.kurta,
      bannerUrl: "/shop/sliders/zC8n6VsTB6MV7RlLpiRyoyR95CnHTqbBvoOUFXfj.jpeg",
      description: "Authentic handwoven cotton kurtas, ethnic attire, and sustainable apparel crafted by artisan weavers.",
      address: "77 Johari Bazaar, Jaipur 302003",
      shippingCost: 39,
      verified: true,
      verificationStatus: "approved",
      sellerPackageId: pkgEnterprise!._id,
      remainingUploads: 980,
      remainingDigitalUploads: 248,
      packageInvalidAt: addDays(now, 320),
    },
    {
      sellerId: sellerWellness!._id,
      name: "Veda Wellness & Organics",
      slug: "veda-wellness-organics",
      logoUrl: IMG.skincare,
      bannerUrl: IMG.bannerHome,
      description: "Botanical skincare, single-origin coffee, artisanal spices, and mindfulness gear.",
      address: "14 Boat Club Road, Pune 411001",
      shippingCost: 45,
      verified: true,
      verificationStatus: "approved",
      sellerPackageId: pkgGrowth!._id,
      remainingUploads: 38,
      remainingDigitalUploads: 10,
      packageInvalidAt: addDays(now, 80),
    },
    {
      sellerId: sellerUrbanPending!._id,
      name: "Urban Nest Living",
      slug: "urban-nest-living",
      logoUrl: IMG.lamp,
      description: "Modern home lighting, ceramic planters, and ergonomic studio furniture (verification awaiting admin review).",
      address: "91 Jubilee Hills, Hyderabad 500033",
      shippingCost: 79,
      verified: false,
      verificationStatus: "pending",
      verificationDocs: [
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
      ],
      verificationAnswers: {
        [String(fGstin!._id)]: "36AAFCU1122K1Z8",
        [String(fType!._id)]: "Partnership / LLP",
        [String(fCats!._id)]: ["Home & Kitchen"],
        [String(fWh!._id)]: "Leased Fulfillment Center",
        [String(fDoc!._id)]: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
      },
      sellerPackageId: pkgFree!._id,
      remainingUploads: 9,
      remainingDigitalUploads: 2,
      packageInvalidAt: addDays(now, 25),
    },
    {
      sellerId: sellerCraftRejected!._id,
      name: "Craftsman Studio",
      slug: "craftsman-studio",
      logoUrl: IMG.woodenToy,
      description: "Handcrafted wooden decor & toys.",
      address: "12 Anna Nagar, Chennai 600040",
      shippingCost: 50,
      verified: false,
      verificationStatus: "rejected",
      verificationDocs: ["https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800"],
      sellerPackageId: pkgFree!._id,
      remainingUploads: 10,
      remainingDigitalUploads: 2,
      packageInvalidAt: addDays(now, 15),
    },
  ]);

  // Package Payments (paid + pending offline approvals)
  await SellerPackagePayment.insertMany([
    { sellerId: sellerDemo!._id, packageId: pkgGrowth!._id, amount: 999, startsAt: subDays(now, 15), expiresAt: addDays(now, 75), paymentMethod: "wallet", status: "paid", idempotencyKey: "seed-sp-demo", activatedAt: subDays(now, 15) },
    { sellerId: sellerTech!._id, packageId: pkgPro!._id, amount: 2499, startsAt: subDays(now, 30), expiresAt: addDays(now, 150), paymentMethod: "razorpay", status: "paid", idempotencyKey: "seed-sp-tech", activatedAt: subDays(now, 30) },
    { sellerId: sellerHandloom!._id, packageId: pkgEnterprise!._id, amount: 4999, startsAt: subDays(now, 45), expiresAt: addDays(now, 320), paymentMethod: "stripe", status: "paid", idempotencyKey: "seed-sp-handloom", activatedAt: subDays(now, 45) },
    { sellerId: sellerWellness!._id, packageId: pkgPro!._id, amount: 2499, startsAt: now, expiresAt: addDays(now, 180), paymentMethod: "manual", status: "pending", idempotencyKey: "seed-sp-pending-1", activatedAt: null },
    { sellerId: sellerUrbanPending!._id, packageId: pkgGrowth!._id, amount: 999, startsAt: now, expiresAt: addDays(now, 90), paymentMethod: "manual", status: "pending", idempotencyKey: "seed-sp-pending-2", activatedAt: null },
  ]);

  await CustomerPackagePayment.insertMany([
    { userId: customerDemo._id, packageId: custPkgStd!._id, amount: 299, startsAt: subDays(now, 30), expiresAt: addDays(now, 60), paymentMethod: "wallet", status: "paid", idempotencyKey: "seed-cp-demo", activatedAt: subDays(now, 30) },
    { userId: custAnanya!._id, packageId: custPkgPower!._id, amount: 799, startsAt: subDays(now, 40), expiresAt: addDays(now, 140), paymentMethod: "wallet", status: "paid", idempotencyKey: "seed-cp-ananya", activatedAt: subDays(now, 40) },
    { userId: custRohan!._id, packageId: custPkgStd!._id, amount: 299, startsAt: now, expiresAt: addDays(now, 90), paymentMethod: "manual", status: "pending", idempotencyKey: "seed-cp-pending-1", activatedAt: null },
    { userId: custPriya!._id, packageId: custPkgPower!._id, amount: 799, startsAt: now, expiresAt: addDays(now, 180), paymentMethod: "manual", status: "pending", idempotencyKey: "seed-cp-pending-2", activatedAt: null },
  ]);

  // 7. Categories (8 root categories, all featured <= 10, plus level 1 & level 2 tree)
  const catElectronics = await Category.create({ name: "Electronics", slug: "electronics", level: 0, ancestors: [], iconUrl: IMG.earbuds, bannerUrl: IMG.bannerTech, commissionRate: 8, featured: true, order: 1, active: true });
  const catFashion = await Category.create({ name: "Fashion", slug: "fashion", level: 0, ancestors: [], iconUrl: IMG.tshirt, bannerUrl: IMG.bannerFashion, commissionRate: 12, featured: true, order: 2, active: true });
  const catHome = await Category.create({ name: "Home & Kitchen", slug: "home-kitchen", level: 0, ancestors: [], iconUrl: IMG.lamp, bannerUrl: IMG.bannerHome, commissionRate: 10, featured: true, order: 3, active: true });
  const catBeauty = await Category.create({ name: "Beauty & Care", slug: "beauty-care", level: 0, ancestors: [], iconUrl: IMG.skincare, commissionRate: 12, featured: true, order: 4, active: true });
  const catDigital = await Category.create({ name: "Books & Digital", slug: "books-digital", level: 0, ancestors: [], iconUrl: IMG.ebook, commissionRate: 5, featured: true, order: 5, active: true });
  const catSports = await Category.create({ name: "Sports & Fitness", slug: "sports-fitness", level: 0, ancestors: [], iconUrl: IMG.yogaMat, commissionRate: 9, featured: true, order: 6, active: true });
  const catToys = await Category.create({ name: "Toys & Baby", slug: "toys-baby", level: 0, ancestors: [], iconUrl: IMG.woodenToy, commissionRate: 10, featured: true, order: 7, active: true });
  const catGrocery = await Category.create({ name: "Grocery & Gourmet", slug: "grocery-gourmet", level: 0, ancestors: [], iconUrl: IMG.coffeeBeans, commissionRate: 6, featured: true, order: 8, active: true });

  // Level 1
  const catMobiles = await Category.create({ name: "Mobiles & Tablets", slug: "mobiles-tablets", parentId: catElectronics._id, level: 1, ancestors: [catElectronics._id], iconUrl: IMG.smartphone, order: 1, active: true });
  const catAudio = await Category.create({ name: "Audio & Wearables", slug: "audio-wearables", parentId: catElectronics._id, level: 1, ancestors: [catElectronics._id], iconUrl: IMG.headphones, order: 2, active: true });
  const catComputers = await Category.create({ name: "Computers & Peripherals", slug: "computers-peripherals", parentId: catElectronics._id, level: 1, ancestors: [catElectronics._id], iconUrl: IMG.laptop, order: 3, active: true });
  const catMen = await Category.create({ name: "Men's Clothing", slug: "mens-clothing", parentId: catFashion._id, level: 1, ancestors: [catFashion._id], iconUrl: IMG.tshirt, order: 1, active: true });
  const catWomen = await Category.create({ name: "Women's Clothing", slug: "womens-clothing", parentId: catFashion._id, level: 1, ancestors: [catFashion._id], iconUrl: IMG.kurta, order: 2, active: true });
  const catFootwear = await Category.create({ name: "Footwear & Bags", slug: "footwear-bags", parentId: catFashion._id, level: 1, ancestors: [catFashion._id], iconUrl: IMG.sneakers, order: 3, active: true });
  const catKitchen = await Category.create({ name: "Kitchen Appliances", slug: "kitchen-appliances", parentId: catHome._id, level: 1, ancestors: [catHome._id], iconUrl: IMG.coffeeMaker, order: 1, active: true });
  const catDecor = await Category.create({ name: "Home Decor & Lighting", slug: "home-decor-lighting", parentId: catHome._id, level: 1, ancestors: [catHome._id], iconUrl: IMG.lamp, order: 2, active: true });
  const catSkincare = await Category.create({ name: "Skincare & Serums", slug: "skincare-serums", parentId: catBeauty._id, level: 1, ancestors: [catBeauty._id], iconUrl: IMG.serum, order: 1, active: true });
  const catEbooks = await Category.create({ name: "E-Books & Templates", slug: "ebooks-templates", parentId: catDigital._id, level: 1, ancestors: [catDigital._id], iconUrl: IMG.designKit, order: 1, active: true });
  const catFitness = await Category.create({ name: "Yoga & Gym Gear", slug: "yoga-gym-gear", parentId: catSports._id, level: 1, ancestors: [catSports._id], iconUrl: IMG.dumbbell, order: 1, active: true });
  const catCoffee = await Category.create({ name: "Artisanal Coffee & Spices", slug: "artisanal-coffee-spices", parentId: catGrocery._id, level: 1, ancestors: [catGrocery._id], iconUrl: IMG.spices, order: 1, active: true });

  // Level 2
  const catEarbuds = await Category.create({ name: "True Wireless Earbuds", slug: "true-wireless-earbuds", parentId: catAudio._id, level: 2, ancestors: [catElectronics._id, catAudio._id], iconUrl: IMG.earbuds, order: 1, active: true });
  const catSmartwatches = await Category.create({ name: "Smartwatches", slug: "smartwatches", parentId: catAudio._id, level: 2, ancestors: [catElectronics._id, catAudio._id], iconUrl: IMG.smartwatch, order: 2, active: true });
  const catKeyboards = await Category.create({ name: "Mechanical Keyboards", slug: "mechanical-keyboards", parentId: catComputers._id, level: 2, ancestors: [catElectronics._id, catComputers._id], iconUrl: IMG.keyboard, order: 1, active: true });
  const catTees = await Category.create({ name: "Cotton T-Shirts", slug: "cotton-t-shirts", parentId: catMen._id, level: 2, ancestors: [catFashion._id, catMen._id], iconUrl: IMG.tshirt, order: 1, active: true });
  const catEthnic = await Category.create({ name: "Handloom Kurtas", slug: "handloom-kurtas", parentId: catWomen._id, level: 2, ancestors: [catFashion._id, catWomen._id], iconUrl: IMG.kurta, order: 1, active: true });

  // 8. Brands, Colors, Attributes
  const [brandAurora, brandVolt, brandKaveri, brandUrbanFit, brandNest, brandVeda, brandPixel, brandTrail, brandBrew, brandGeneric] =
    await Brand.insertMany([
      { name: "Aurora Audio", slug: "aurora-audio", logoUrl: IMG.earbuds, categoryIds: [catElectronics._id, catAudio._id, catEarbuds._id], featured: true, active: true },
      { name: "VoltEdge", slug: "voltedge", logoUrl: IMG.laptop, categoryIds: [catElectronics._id, catComputers._id, catMobiles._id], featured: true, active: true },
      { name: "Kaveri Looms", slug: "kaveri-looms", logoUrl: IMG.kurta, categoryIds: [catFashion._id, catWomen._id, catEthnic._id], featured: true, active: true },
      { name: "UrbanFit", slug: "urbanfit", logoUrl: IMG.sneakers, categoryIds: [catFashion._id, catMen._id, catFootwear._id], featured: true, active: true },
      { name: "NestCraft", slug: "nestcraft", logoUrl: IMG.lamp, categoryIds: [catHome._id, catDecor._id, catKitchen._id], featured: true, active: true },
      { name: "VedaPure", slug: "vedapure", logoUrl: IMG.skincare, categoryIds: [catBeauty._id, catSkincare._id], featured: true, active: true },
      { name: "PixelPress", slug: "pixelpress", logoUrl: IMG.designKit, categoryIds: [catDigital._id, catEbooks._id], featured: true, active: true },
      { name: "TrailPeak", slug: "trailpeak", logoUrl: IMG.yogaMat, categoryIds: [catSports._id, catFitness._id], featured: true, active: true },
      { name: "BrewCraft", slug: "brewcraft", logoUrl: IMG.coffeeBeans, categoryIds: [catGrocery._id, catCoffee._id], featured: false, active: true },
      { name: "Generic", slug: "generic", logoUrl: IMG.backpack, categoryIds: [], featured: false, active: true },
    ]);

  const colors = await Color.insertMany(COLORS_DATA);
  const [colBlack, colWhite, colRed, colBlue, colGreen, colAmber, colPurple, colGrey, colPink, colNavy] = colors;

  await Attribute.insertMany([
    { name: "Size", values: ["XS", "S", "M", "L", "XL", "XXL"], categoryIds: [catFashion._id, catMen._id, catWomen._id, catTees._id, catEthnic._id] },
    { name: "Storage", values: ["64GB", "128GB", "256GB", "512GB"], categoryIds: [catElectronics._id, catMobiles._id, catComputers._id] },
    { name: "RAM", values: ["8GB", "16GB", "32GB"], categoryIds: [catComputers._id] },
    { name: "Material", values: ["100% Cotton", "Handloom Silk", "Stainless Steel", "Bamboo", "Vegan Leather"], categoryIds: [] },
    { name: "Connectivity", values: ["Bluetooth 5.3", "USB-C", "Wi-Fi 6", "Wireless 2.4GHz"], categoryIds: [catElectronics._id, catAudio._id, catComputers._id] },
    { name: "Weight / Pack", values: ["250g", "500g", "1kg", "30ml", "50ml"], categoryIds: [catGrocery._id, catBeauty._id, catCoffee._id] },
  ]);

  // 9. Products (26 rich products: Demo Seller, Aarav Tech, Kaveri Handlooms, Veda Wellness, In-House admin, Digital, Pending, Rejected)
  const products = await Product.insertMany([
    {
      sellerId: sellerDemo!._id,
      addedBy: "seller",
      name: "Aurora Wireless Earbuds Pro",
      slug: "aurora-wireless-earbuds",
      categoryId: catEarbuds._id,
      subCategoryId: catAudio._id,
      subSubCategoryId: catEarbuds._id,
      brandId: brandAurora!._id,
      description: "Active noise cancelling true wireless earbuds with 36-hour charging case, spatial audio, and IPX5 sweat resistance.",
      images: [IMG.earbuds, IMG.headphones],
      thumbnailUrl: IMG.earbuds,
      basePrice: 2999,
      purchasePrice: 1750,
      currency: "INR",
      barcode: "890100100101",
      discount: 15,
      discountType: "percent",
      variants: [
        { sku: "AURORA-BLK", attributes: { color: "Black" }, price: 2999, comparePrice: 3499, stock: 54, reserved: 0, imageUrl: IMG.earbuds },
        { sku: "AURORA-WHT", attributes: { color: "White" }, price: 3099, comparePrice: 3599, stock: 32, reserved: 0, imageUrl: IMG.earbuds },
      ],
      colors: [colBlack!._id, colWhite!._id],
      choiceOptions: [{ name: "color", values: ["Black", "White"] }],
      published: true,
      approvalStatus: "approved",
      featured: true,
      todaysDeal: true,
      clubPoints: 60,
      numOfSale: 48,
      viewCount: 620,
      tags: ["electronics", "audio", "wireless", "anc"],
    },
    {
      sellerId: sellerDemo!._id,
      addedBy: "seller",
      name: "Classic Organic Cotton T-Shirt",
      slug: "classic-cotton-t-shirt",
      categoryId: catTees._id,
      subCategoryId: catMen._id,
      subSubCategoryId: catTees._id,
      brandId: brandUrbanFit!._id,
      description: "240 GSM combed organic cotton crew-neck t-shirt, pre-shrunk and breathable for all-day comfort.",
      images: [IMG.tshirt],
      thumbnailUrl: IMG.tshirt,
      basePrice: 599,
      purchasePrice: 280,
      currency: "INR",
      barcode: "890100100102",
      discount: 10,
      discountType: "percent",
      variants: [
        { sku: "TSHIRT-BLK-S", attributes: { size: "S", color: "Black" }, price: 599, comparePrice: 799, stock: 90, reserved: 0 },
        { sku: "TSHIRT-BLK-M", attributes: { size: "M", color: "Black" }, price: 599, comparePrice: 799, stock: 120, reserved: 0 },
        { sku: "TSHIRT-NVY-L", attributes: { size: "L", color: "Navy" }, price: 649, comparePrice: 849, stock: 4, reserved: 0 },
      ],
      colors: [colBlack!._id, colNavy!._id],
      choiceOptions: [{ name: "size", values: ["S", "M", "L"] }],
      published: true,
      approvalStatus: "approved",
      featured: true,
      todaysDeal: false,
      clubPoints: 15,
      numOfSale: 85,
      viewCount: 910,
      tags: ["fashion", "clothing", "cotton"],
    },
    {
      sellerId: sellerDemo!._id,
      addedBy: "seller",
      name: "Everyday Commuter Backpack 22L",
      slug: "everyday-backpack",
      categoryId: catFootwear._id,
      subCategoryId: catFootwear._id,
      brandId: brandGeneric!._id,
      description: "Water-resistant 22L commuter backpack with padded 16-inch laptop sleeve, hidden passport pocket, and luggage strap.",
      images: [IMG.backpack],
      thumbnailUrl: IMG.backpack,
      basePrice: 1499,
      purchasePrice: 820,
      currency: "INR",
      barcode: "890100100103",
      discount: 100,
      discountType: "flat",
      variants: [
        { sku: "BACKPACK-GRY", attributes: { color: "Slate Grey" }, price: 1499, comparePrice: 1899, stock: 42, reserved: 0 },
        { sku: "BACKPACK-BLK", attributes: { color: "Black" }, price: 1549, comparePrice: 1899, stock: 25, reserved: 0 },
      ],
      colors: [colGrey!._id, colBlack!._id],
      published: true,
      approvalStatus: "approved",
      featured: false,
      todaysDeal: true,
      clubPoints: 30,
      numOfSale: 37,
      viewCount: 430,
      tags: ["accessories", "bags", "travel"],
    },
    {
      sellerId: sellerDemo!._id,
      addedBy: "seller",
      name: "Studio Wireless Over-Ear Headphones",
      slug: "studio-wireless-headphones",
      categoryId: catAudio._id,
      subCategoryId: catAudio._id,
      brandId: brandAurora!._id,
      description: "40mm custom planar drivers, memory foam earcups, 50-hour battery life, and multipoint Bluetooth 5.3.",
      images: [IMG.headphones],
      thumbnailUrl: IMG.headphones,
      basePrice: 5499,
      purchasePrice: 3200,
      currency: "INR",
      barcode: "890100100104",
      discount: 10,
      discountType: "percent",
      variants: [
        { sku: "STUDIO-HP-BLK", attributes: { color: "Black" }, price: 5499, comparePrice: 6499, stock: 18, reserved: 0 },
        { sku: "STUDIO-HP-SLV", attributes: { color: "Grey" }, price: 5499, comparePrice: 6499, stock: 3, reserved: 0 },
      ],
      colors: [colBlack!._id, colGrey!._id],
      published: true,
      approvalStatus: "approved",
      featured: true,
      todaysDeal: false,
      clubPoints: 100,
      numOfSale: 29,
      viewCount: 380,
      tags: ["electronics", "headphones", "audio"],
    },
    {
      sellerId: sellerDemo!._id,
      addedBy: "seller",
      name: "UI System & Component Handbook (PDF)",
      slug: "ui-system-component-handbook",
      categoryId: catEbooks._id,
      subCategoryId: catEbooks._id,
      brandId: brandPixel!._id,
      description: "180-page illustrated digital handbook covering design tokens, accessibility contrast scales, and responsive grid systems.",
      images: [IMG.designKit],
      thumbnailUrl: IMG.designKit,
      basePrice: 499,
      purchasePrice: 0,
      currency: "INR",
      isDigital: true,
      digitalFileUrl: digitalUrls.handbook,
      refundable: false,
      variants: [{ sku: "EBOOK-UISYS", attributes: { format: "PDF" }, price: 499, comparePrice: 799, stock: 999, reserved: 0 }],
      published: true,
      approvalStatus: "approved",
      featured: true,
      todaysDeal: false,
      clubPoints: 25,
      numOfSale: 64,
      viewCount: 510,
      tags: ["digital", "ebook", "design"],
    },
    {
      sellerId: sellerTech!._id,
      addedBy: "seller",
      name: "VoltEdge Chronos AMOLED Smartwatch",
      slug: "voltedge-chronos-smartwatch",
      categoryId: catSmartwatches._id,
      subCategoryId: catAudio._id,
      subSubCategoryId: catSmartwatches._id,
      brandId: brandVolt!._id,
      description: "1.43-inch AMOLED always-on display, dual-band GPS, heart rate & SpO2 tracking, 10-day battery life.",
      images: [IMG.smartwatch],
      thumbnailUrl: IMG.smartwatch,
      basePrice: 4299,
      purchasePrice: 2600,
      currency: "INR",
      barcode: "890100100105",
      discount: 12,
      discountType: "percent",
      variants: [
        { sku: "CHRONOS-BLK", attributes: { color: "Black" }, price: 4299, comparePrice: 5499, stock: 26, reserved: 0 },
        { sku: "CHRONOS-BLU", attributes: { color: "Blue" }, price: 4399, comparePrice: 5499, stock: 19, reserved: 0 },
      ],
      colors: [colBlack!._id, colBlue!._id],
      published: true,
      approvalStatus: "approved",
      featured: true,
      todaysDeal: true,
      clubPoints: 85,
      numOfSale: 56,
      viewCount: 740,
      tags: ["smartwatch", "wearables", "fitness"],
    },
    {
      sellerId: sellerTech!._id,
      addedBy: "seller",
      name: "VoltEdge Tactile Mechanical Keyboard 75%",
      slug: "voltedge-mechanical-keyboard",
      categoryId: catKeyboards._id,
      subCategoryId: catComputers._id,
      subSubCategoryId: catKeyboards._id,
      brandId: brandVolt!._id,
      description: "Hot-swappable gasket-mounted mechanical keyboard with PBT keycaps, tri-mode wireless, and warm white backlight.",
      images: [IMG.keyboard],
      thumbnailUrl: IMG.keyboard,
      basePrice: 3899,
      purchasePrice: 2300,
      currency: "INR",
      barcode: "890100100106",
      discount: 300,
      discountType: "flat",
      variants: [
        { sku: "MECH75-BRN", attributes: { switch: "Tactile Brown" }, price: 3899, comparePrice: 4499, stock: 22, reserved: 0 },
        { sku: "MECH75-RED", attributes: { switch: "Linear Red" }, price: 3899, comparePrice: 4499, stock: 4, reserved: 0 },
      ],
      colors: [colBlack!._id, colWhite!._id],
      published: true,
      approvalStatus: "approved",
      featured: true,
      todaysDeal: true,
      clubPoints: 75,
      numOfSale: 41,
      viewCount: 520,
      tags: ["keyboard", "mechanical", "desk"],
    },
    {
      sellerId: sellerTech!._id,
      addedBy: "seller",
      name: "Aurora 360 Portable Bluetooth Speaker",
      slug: "aurora-portable-speaker",
      categoryId: catAudio._id,
      subCategoryId: catAudio._id,
      brandId: brandAurora!._id,
      description: "20W stereo driver with passive bass radiator, IP67 waterproof shell, and 18-hour playtime.",
      images: [IMG.speaker],
      thumbnailUrl: IMG.speaker,
      basePrice: 2199,
      purchasePrice: 1200,
      currency: "INR",
      barcode: "890100100107",
      variants: [
        { sku: "SPK-BLK", attributes: { color: "Black" }, price: 2199, stock: 34, reserved: 0 },
        { sku: "SPK-RED", attributes: { color: "Crimson Red" }, price: 2249, stock: 16, reserved: 0 },
      ],
      colors: [colBlack!._id, colRed!._id],
      published: true,
      approvalStatus: "approved",
      featured: false,
      todaysDeal: true,
      clubPoints: 40,
      numOfSale: 33,
      tags: ["speaker", "bluetooth", "audio"],
    },
    {
      sellerId: sellerTech!._id,
      addedBy: "seller",
      name: "VoltEdge ProBook 14 Ultrabook",
      slug: "voltedge-probook-14",
      categoryId: catComputers._id,
      subCategoryId: catComputers._id,
      brandId: brandVolt!._id,
      description: "Lightweight aluminum ultrabook with 14-inch 2.8K IPS display, 16GB LPDDR5 RAM, and 512GB NVMe SSD.",
      images: [IMG.laptop],
      thumbnailUrl: IMG.laptop,
      basePrice: 54990,
      purchasePrice: 44000,
      currency: "INR",
      barcode: "890100100108",
      discount: 5,
      discountType: "percent",
      variants: [
        { sku: "PROBOOK-16-512", attributes: { RAM: "16GB", Storage: "512GB" }, price: 54990, comparePrice: 59990, stock: 8, reserved: 0 },
      ],
      colors: [colGrey!._id],
      published: true,
      approvalStatus: "approved",
      featured: true,
      todaysDeal: false,
      clubPoints: 500,
      numOfSale: 9,
      tags: ["laptop", "ultrabook", "workstation"],
    },
    {
      sellerId: sellerTech!._id,
      addedBy: "seller",
      name: "VoltEdge Precision Ergonomic Mouse",
      slug: "voltedge-precision-mouse",
      categoryId: catComputers._id,
      subCategoryId: catComputers._id,
      brandId: brandVolt!._id,
      description: "Silent multi-device wireless mouse with MagSpeed scroll wheel and USB-C fast charging.",
      images: [IMG.mouse],
      thumbnailUrl: IMG.mouse,
      basePrice: 1299,
      purchasePrice: 700,
      currency: "INR",
      barcode: "890100100109",
      variants: [{ sku: "MOUSE-GRY", attributes: { color: "Slate Grey" }, price: 1299, stock: 45, reserved: 0 }],
      colors: [colGrey!._id],
      published: true,
      approvalStatus: "approved",
      featured: false,
      todaysDeal: false,
      clubPoints: 20,
      numOfSale: 27,
      tags: ["mouse", "wireless", "accessories"],
    },
    {
      sellerId: sellerTech!._id,
      addedBy: "seller",
      name: "Nova X5 5G Smartphone (128GB)",
      slug: "nova-x5-5g-smartphone",
      categoryId: catMobiles._id,
      subCategoryId: catMobiles._id,
      brandId: brandVolt!._id,
      description: "120Hz OLED display, 50MP OIS triple camera, 5000mAh battery with 67W fast charging.",
      images: [IMG.smartphone],
      thumbnailUrl: IMG.smartphone,
      basePrice: 21999,
      purchasePrice: 17500,
      currency: "INR",
      barcode: "890100100110",
      discount: 1000,
      discountType: "flat",
      variants: [
        { sku: "NOVAX5-128-BLK", attributes: { Storage: "128GB", color: "Black" }, price: 21999, comparePrice: 23999, stock: 14, reserved: 0 },
        { sku: "NOVAX5-256-BLU", attributes: { Storage: "256GB", color: "Ocean Blue" }, price: 24999, comparePrice: 26999, stock: 10, reserved: 0 },
      ],
      colors: [colBlack!._id, colBlue!._id],
      published: true,
      approvalStatus: "approved",
      featured: true,
      todaysDeal: false,
      clubPoints: 200,
      numOfSale: 19,
      tags: ["smartphone", "5g", "mobiles"],
    },
    {
      sellerId: sellerHandloom!._id,
      addedBy: "seller",
      name: "Jaipur Block-Print Handloom Kurta",
      slug: "jaipur-block-print-kurta",
      categoryId: catEthnic._id,
      subCategoryId: catWomen._id,
      subSubCategoryId: catEthnic._id,
      brandId: brandKaveri!._id,
      description: "Hand-block printed pure Mulmul cotton kurta featuring delicate mirror work and breathable relaxed fit.",
      images: [IMG.kurta],
      thumbnailUrl: IMG.kurta,
      basePrice: 1699,
      purchasePrice: 890,
      currency: "INR",
      barcode: "890100100111",
      discount: 20,
      discountType: "percent",
      variants: [
        { sku: "KURTA-PNK-S", attributes: { size: "S", color: "Rose Pink" }, price: 1699, comparePrice: 2199, stock: 24, reserved: 0 },
        { sku: "KURTA-PNK-M", attributes: { size: "M", color: "Rose Pink" }, price: 1699, comparePrice: 2199, stock: 30, reserved: 0 },
        { sku: "KURTA-EMR-L", attributes: { size: "L", color: "Emerald Green" }, price: 1749, comparePrice: 2199, stock: 18, reserved: 0 },
      ],
      colors: [colPink!._id, colGreen!._id],
      choiceOptions: [{ name: "size", values: ["S", "M", "L"] }],
      published: true,
      approvalStatus: "approved",
      featured: true,
      todaysDeal: true,
      clubPoints: 35,
      numOfSale: 52,
      tags: ["handloom", "kurta", "ethnic", "jaipur"],
    },
    {
      sellerId: sellerHandloom!._id,
      addedBy: "seller",
      name: "Indigo Linen Summer Midi Dress",
      slug: "indigo-linen-midi-dress",
      categoryId: catWomen._id,
      subCategoryId: catWomen._id,
      brandId: brandKaveri!._id,
      description: "Natural-dyed linen-cotton blend midi dress with side pockets and wooden button placket.",
      images: [IMG.dress],
      thumbnailUrl: IMG.dress,
      basePrice: 2199,
      purchasePrice: 1150,
      currency: "INR",
      barcode: "890100100112",
      variants: [
        { sku: "DRESS-IND-S", attributes: { size: "S" }, price: 2199, stock: 15, reserved: 0 },
        { sku: "DRESS-IND-M", attributes: { size: "M" }, price: 2199, stock: 20, reserved: 0 },
      ],
      colors: [colNavy!._id],
      published: true,
      approvalStatus: "approved",
      featured: false,
      todaysDeal: false,
      clubPoints: 40,
      numOfSale: 22,
      tags: ["dress", "linen", "womenswear"],
    },
    {
      sellerId: sellerHandloom!._id,
      addedBy: "seller",
      name: "Heritage Waxed Canvas Field Jacket",
      slug: "heritage-field-jacket",
      categoryId: catMen._id,
      subCategoryId: catMen._id,
      brandId: brandUrbanFit!._id,
      description: "Weather-resistant heavyweight cotton canvas jacket with quilted flannel lining and brass snap hardware.",
      images: [IMG.jacket],
      thumbnailUrl: IMG.jacket,
      basePrice: 3499,
      purchasePrice: 1950,
      currency: "INR",
      barcode: "890100100113",
      discount: 10,
      discountType: "percent",
      variants: [
        { sku: "JACKET-BLK-M", attributes: { size: "M" }, price: 3499, comparePrice: 3999, stock: 12, reserved: 0 },
        { sku: "JACKET-BLK-L", attributes: { size: "L" }, price: 3499, comparePrice: 3999, stock: 14, reserved: 0 },
      ],
      colors: [colBlack!._id],
      published: true,
      approvalStatus: "approved",
      featured: true,
      todaysDeal: false,
      clubPoints: 70,
      numOfSale: 18,
      tags: ["jacket", "outerwear", "menswear"],
    },
    {
      sellerId: sellerHandloom!._id,
      addedBy: "seller",
      name: "UrbanFit Aero Knit Running Sneakers",
      slug: "urbanfit-aero-sneakers",
      categoryId: catFootwear._id,
      subCategoryId: catFootwear._id,
      brandId: brandUrbanFit!._id,
      description: "Breathable engineered-knit upper with dual-density EVA cushioning for daily road miles.",
      images: [IMG.sneakers],
      thumbnailUrl: IMG.sneakers,
      basePrice: 2799,
      purchasePrice: 1500,
      currency: "INR",
      barcode: "890100100114",
      discount: 15,
      discountType: "percent",
      variants: [
        { sku: "AERO-RED-9", attributes: { size: "UK 9", color: "Red" }, price: 2799, comparePrice: 3299, stock: 21, reserved: 0 },
        { sku: "AERO-BLK-10", attributes: { size: "UK 10", color: "Black" }, price: 2799, comparePrice: 3299, stock: 16, reserved: 0 },
      ],
      colors: [colRed!._id, colBlack!._id],
      published: true,
      approvalStatus: "approved",
      featured: false,
      todaysDeal: true,
      clubPoints: 50,
      numOfSale: 34,
      tags: ["sneakers", "footwear", "running"],
    },
    {
      sellerId: sellerWellness!._id,
      addedBy: "seller",
      name: "VedaPure 15% Vitamin C + Ferulic Serum",
      slug: "vedapure-vitamin-c-serum",
      categoryId: catSkincare._id,
      subCategoryId: catSkincare._id,
      brandId: brandVeda!._id,
      description: "Cold-pressed Kakadu plum and 15% stabilized L-ascorbic acid brightening serum (30ml).",
      images: [IMG.serum, IMG.skincare],
      thumbnailUrl: IMG.serum,
      basePrice: 899,
      purchasePrice: 390,
      currency: "INR",
      barcode: "890100100115",
      discount: 10,
      discountType: "percent",
      refundable: false,
      variants: [{ sku: "SERUM-VITC-30", attributes: { size: "30ml" }, price: 899, comparePrice: 999, stock: 65, reserved: 0 }],
      published: true,
      approvalStatus: "approved",
      featured: true,
      todaysDeal: true,
      clubPoints: 20,
      numOfSale: 73,
      tags: ["skincare", "serum", "beauty"],
    },
    {
      sellerId: sellerWellness!._id,
      addedBy: "seller",
      name: "Chikmagalur Single-Estate Arabica Coffee (500g)",
      slug: "chikmagalur-arabica-coffee",
      categoryId: catCoffee._id,
      subCategoryId: catCoffee._id,
      brandId: brandBrew!._id,
      description: "Medium-dark roasted 100% AA Arabica beans with notes of roasted hazelnut, dark chocolate, and caramel.",
      images: [IMG.coffeeBeans],
      thumbnailUrl: IMG.coffeeBeans,
      basePrice: 649,
      purchasePrice: 340,
      currency: "INR",
      barcode: "890100100116",
      refundable: false,
      variants: [
        { sku: "COFFEE-WHOLE-500", attributes: { grind: "Whole Bean", pack: "500g" }, price: 649, stock: 50, reserved: 0 },
        { sku: "COFFEE-POUR-500", attributes: { grind: "Pour Over", pack: "500g" }, price: 649, stock: 38, reserved: 0 },
      ],
      published: true,
      approvalStatus: "approved",
      featured: false,
      todaysDeal: false,
      clubPoints: 15,
      numOfSale: 61,
      tags: ["coffee", "arabica", "gourmet"],
    },
    {
      sellerId: sellerWellness!._id,
      addedBy: "seller",
      name: "Malabar Organic Whole Spice Box (6 Jars)",
      slug: "malabar-organic-spice-box",
      categoryId: catCoffee._id,
      subCategoryId: catCoffee._id,
      brandId: brandBrew!._id,
      description: "Single-origin Tellicherry black pepper, green cardamom, Ceylon cinnamon, cloves, star anise, and turmeric.",
      images: [IMG.spices],
      thumbnailUrl: IMG.spices,
      basePrice: 949,
      purchasePrice: 510,
      currency: "INR",
      barcode: "890100100117",
      variants: [{ sku: "SPICE-BOX-6", attributes: { pack: "6 Glass Jars" }, price: 949, stock: 28, reserved: 0 }],
      published: true,
      approvalStatus: "approved",
      featured: false,
      todaysDeal: false,
      clubPoints: 20,
      numOfSale: 29,
      tags: ["spices", "organic", "grocery"],
    },
    {
      sellerId: sellerWellness!._id,
      addedBy: "seller",
      name: "Regional Indian Spice Cookbook (Digital PDF)",
      slug: "regional-spice-cookbook-pdf",
      categoryId: catEbooks._id,
      subCategoryId: catEbooks._id,
      brandId: brandPixel!._id,
      description: "45 heirloom spice-blending recipes and regional pairing notes in a printable high-resolution PDF.",
      images: [IMG.ebook],
      thumbnailUrl: IMG.ebook,
      basePrice: 299,
      purchasePrice: 0,
      currency: "INR",
      isDigital: true,
      digitalFileUrl: digitalUrls.cookbook,
      refundable: false,
      variants: [{ sku: "EBOOK-SPICES", attributes: { format: "PDF" }, price: 299, stock: 999, reserved: 0 }],
      published: true,
      approvalStatus: "approved",
      featured: false,
      todaysDeal: false,
      clubPoints: 10,
      numOfSale: 24,
      tags: ["digital", "cookbook", "ebook"],
    },
    // In-House Admin-owned products (sellerId: null, addedBy: "admin")
    {
      sellerId: null,
      addedBy: "admin",
      name: "NestCraft Nordic Desk Lamp",
      slug: "nestcraft-nordic-desk-lamp",
      categoryId: catDecor._id,
      subCategoryId: catDecor._id,
      brandId: brandNest!._id,
      description: "Matte powder-coated steel task lamp with solid ash wood pivot arm and warm 2700K LED bulb included.",
      images: [IMG.lamp],
      thumbnailUrl: IMG.lamp,
      basePrice: 1899,
      purchasePrice: 1050,
      currency: "INR",
      barcode: "890100100118",
      discount: 10,
      discountType: "percent",
      variants: [
        { sku: "LAMP-BLK", attributes: { color: "Black" }, price: 1899, comparePrice: 2199, stock: 30, reserved: 0 },
        { sku: "LAMP-WHT", attributes: { color: "White" }, price: 1899, comparePrice: 2199, stock: 22, reserved: 0 },
      ],
      colors: [colBlack!._id, colWhite!._id],
      published: true,
      approvalStatus: "approved",
      featured: true,
      todaysDeal: true,
      clubPoints: 35,
      numOfSale: 44,
      tags: ["home", "lamp", "decor", "in-house"],
    },
    {
      sellerId: null,
      addedBy: "admin",
      name: "NestCraft Pour-Over Coffee Brewer Set",
      slug: "nestcraft-pour-over-brewer",
      categoryId: catKitchen._id,
      subCategoryId: catKitchen._id,
      brandId: brandNest!._id,
      description: "Borosilicate glass carafe with stainless mesh cone filter and wooden collar — zero paper waste.",
      images: [IMG.coffeeMaker],
      thumbnailUrl: IMG.coffeeMaker,
      basePrice: 1449,
      purchasePrice: 780,
      currency: "INR",
      barcode: "890100100119",
      variants: [{ sku: "POUROVER-600", attributes: { capacity: "600ml" }, price: 1449, stock: 36, reserved: 0 }],
      published: true,
      approvalStatus: "approved",
      featured: false,
      todaysDeal: false,
      clubPoints: 25,
      numOfSale: 31,
      tags: ["kitchen", "coffee", "in-house"],
    },
    {
      sellerId: null,
      addedBy: "admin",
      name: "TrailPeak Cork & Natural Rubber Yoga Mat",
      slug: "trailpeak-cork-yoga-mat",
      categoryId: catFitness._id,
      subCategoryId: catFitness._id,
      brandId: brandTrail!._id,
      description: "5mm non-slip antimicrobial Portuguese cork top fused to natural tree rubber, with cotton carry strap.",
      images: [IMG.yogaMat],
      thumbnailUrl: IMG.yogaMat,
      basePrice: 2299,
      purchasePrice: 1300,
      currency: "INR",
      barcode: "890100100120",
      discount: 200,
      discountType: "flat",
      variants: [{ sku: "YOGA-CORK-5MM", attributes: { thickness: "5mm" }, price: 2299, comparePrice: 2699, stock: 25, reserved: 0 }],
      published: true,
      approvalStatus: "approved",
      featured: true,
      todaysDeal: false,
      clubPoints: 45,
      numOfSale: 39,
      tags: ["yoga", "fitness", "cork", "in-house"],
    },
    {
      sellerId: null,
      addedBy: "admin",
      name: "Local Brand Launch Playbook (Digital PDF)",
      slug: "local-brand-launch-playbook",
      categoryId: catEbooks._id,
      subCategoryId: catEbooks._id,
      brandId: brandPixel!._id,
      description: "Complete step-by-step e-commerce operations guide for Indian D2C founders, covering pricing, packaging, and retention.",
      images: [IMG.ebook],
      thumbnailUrl: IMG.ebook,
      basePrice: 399,
      purchasePrice: 0,
      currency: "INR",
      isDigital: true,
      digitalFileUrl: digitalUrls.playbook,
      refundable: false,
      variants: [{ sku: "EBOOK-PLAYBOOK", attributes: { format: "PDF" }, price: 399, stock: 999, reserved: 0 }],
      published: true,
      approvalStatus: "approved",
      featured: false,
      todaysDeal: false,
      clubPoints: 20,
      numOfSale: 28,
      tags: ["digital", "business", "ebook", "in-house"],
    },
    // Pending moderation products (for Admin -> Products -> Moderation Queue)
    {
      sellerId: sellerTech!._id,
      addedBy: "seller",
      name: "VoltEdge Creator Mirrorless Camera Kit",
      slug: "voltedge-creator-camera-kit",
      categoryId: catElectronics._id,
      brandId: brandVolt!._id,
      description: "24MP APS-C mirrorless body with 16-50mm f/2.8 kit lens and dual battery charger.",
      images: [IMG.camera],
      basePrice: 44999,
      purchasePrice: 38000,
      currency: "INR",
      variants: [{ sku: "CAM-X24-KIT", attributes: { kit: "16-50mm" }, price: 44999, stock: 5, reserved: 0 }],
      published: false,
      approvalStatus: "pending",
      tags: ["camera", "photography"],
    },
    {
      sellerId: sellerHandloom!._id,
      addedBy: "seller",
      name: "Kaveri Terracotta Ceramic Planter Trio",
      slug: "kaveri-ceramic-planter-trio",
      categoryId: catDecor._id,
      subCategoryId: catDecor._id,
      brandId: brandNest!._id,
      description: "Hand-thrown stoneware planters with drainage saucers in earthy matte glaze.",
      images: [IMG.ceramicPot],
      basePrice: 1199,
      purchasePrice: 600,
      currency: "INR",
      variants: [{ sku: "PLANTER-TRIO", attributes: { set: "3 Pieces" }, price: 1199, stock: 18, reserved: 0 }],
      published: false,
      approvalStatus: "pending",
      tags: ["decor", "ceramics"],
    },
    {
      sellerId: sellerDemo!._id,
      addedBy: "seller",
      name: "TrailPeak Adjustable Hex Dumbbells (Pair)",
      slug: "trailpeak-adjustable-dumbbells",
      categoryId: catFitness._id,
      subCategoryId: catFitness._id,
      brandId: brandTrail!._id,
      description: "Rubber-encased anti-roll dumbbells with knurled chrome handles.",
      images: [IMG.dumbbell],
      basePrice: 2499,
      purchasePrice: 1450,
      currency: "INR",
      variants: [{ sku: "DUMBBELL-10KG", attributes: { weight: "2 x 5kg" }, price: 2499, stock: 12, reserved: 0 }],
      published: false,
      approvalStatus: "pending",
      tags: ["fitness", "gym"],
    },
    // 1 Rejected product for status filter variety
    {
      sellerId: sellerCraftRejected!._id,
      addedBy: "seller",
      name: "Unverified Wooden Toy Set",
      slug: "unverified-wooden-toy-set",
      categoryId: catToys._id,
      brandId: brandGeneric!._id,
      description: "Pending safety certification documentation.",
      images: [IMG.woodenToy],
      basePrice: 799,
      currency: "INR",
      variants: [{ sku: "TOY-WOOD-01", attributes: {}, price: 799, stock: 10, reserved: 0 }],
      published: false,
      approvalStatus: "rejected",
      tags: ["toys"],
    },
  ]);

  const [
    pEarbuds,
    pTshirt,
    pBackpack,
    pHeadphones,
    pHandbook,
    pSmartwatch,
    pKeyboard,
    pSpeaker,
    pLaptop,
    pMouse,
    pPhone,
    pKurta,
    pDress,
    pJacket,
    pSneakers,
    pSerum,
    pCoffee,
    pSpices,
    pCookbook,
    pLamp,
    pPourOver,
    pYogaMat,
    pPlaybook,
  ] = products;

  // 10. Flash Deals (2 active live campaigns + 1 scheduled future campaign)
  await FlashDeal.insertMany([
    {
      title: "Monsoon Mega Tech & Style Flash Sale",
      slug: "monsoon-mega-flash-sale",
      bannerUrl: IMG.bannerSale,
      textColor: "#ffffff",
      backgroundColor: "#ea580c",
      featured: true,
      startsAt: subDays(now, 2),
      endsAt: addDays(now, 10),
      active: true,
      products: [
        { productId: pEarbuds!._id, variantSku: "AURORA-BLK", discountType: "percent", discount: 25, dealStock: 30, dealSold: 8 },
        { productId: pSmartwatch!._id, variantSku: "CHRONOS-BLK", discountType: "percent", discount: 20, dealStock: 20, dealSold: 5 },
        { productId: pKeyboard!._id, variantSku: "MECH75-BRN", discountType: "flat", discount: 600, dealStock: 15, dealSold: 3 },
        { productId: pKurta!._id, variantSku: "KURTA-PNK-M", discountType: "percent", discount: 30, dealStock: 25, dealSold: 6 },
        { productId: pLamp!._id, variantSku: "LAMP-BLK", discountType: "percent", discount: 20, dealStock: 20, dealSold: 4 },
      ],
    },
    {
      title: "Weekend Audio & Wellness Drops",
      slug: "weekend-audio-wellness-drops",
      bannerUrl: IMG.bannerTech,
      textColor: "#ffffff",
      backgroundColor: "#2563eb",
      featured: false,
      startsAt: subDays(now, 1),
      endsAt: addDays(now, 6),
      active: true,
      products: [
        { productId: pSpeaker!._id, variantSku: "SPK-BLK", discountType: "percent", discount: 18, dealStock: 20, dealSold: 2 },
        { productId: pSerum!._id, variantSku: "SERUM-VITC-30", discountType: "percent", discount: 20, dealStock: 40, dealSold: 9 },
        { productId: pYogaMat!._id, variantSku: "YOGA-CORK-5MM", discountType: "flat", discount: 400, dealStock: 15, dealSold: 3 },
      ],
    },
    {
      title: "Upcoming Festive Clearance",
      slug: "upcoming-festive-clearance",
      bannerUrl: IMG.bannerFashion,
      featured: false,
      startsAt: addDays(now, 7),
      endsAt: addDays(now, 14),
      active: true,
      products: [
        { productId: pSneakers!._id, variantSku: "AERO-RED-9", discountType: "percent", discount: 25, dealStock: 20, dealSold: 0 },
        { productId: pBackpack!._id, variantSku: "BACKPACK-GRY", discountType: "flat", discount: 300, dealStock: 20, dealSold: 0 },
      ],
    },
  ]);

  // 11. Coupons
  const [cWelcome, cFlat200, cTech15, cHandloom] = await Coupon.insertMany([
    { code: "WELCOME10", type: "percent", value: 10, scope: "cart", minOrderValue: 500, maxDiscount: 300, usageLimitPerUser: 2, active: true, startsAt: subDays(now, 30), expiresAt: addDays(now, 90) },
    { code: "FLAT200", type: "flat", value: 200, scope: "cart", minOrderValue: 1500, maxDiscount: 200, usageLimitTotal: 500, usageLimitPerUser: 1, active: true, startsAt: subDays(now, 15), expiresAt: addDays(now, 60) },
    { code: "TECH15", type: "percent", value: 15, scope: "product", categoryIds: [catElectronics._id], minOrderValue: 1000, maxDiscount: 1500, usageLimitPerUser: 2, active: true, startsAt: subDays(now, 10), expiresAt: addDays(now, 45) },
    { code: "LOOM250", type: "flat", value: 250, scope: "product", categoryIds: [catFashion._id], minOrderValue: 1200, maxDiscount: 250, usageLimitPerUser: 3, active: true, startsAt: subDays(now, 5), expiresAt: addDays(now, 40) },
    { code: "SUMMEREND", type: "percent", value: 20, scope: "cart", minOrderValue: 1000, maxDiscount: 500, usageLimitPerUser: 1, active: false, startsAt: subDays(now, 60), expiresAt: subDays(now, 5) },
  ]);

  // 12. Addresses
  const addresses = await Address.insertMany([
    { userId: customerDemo._id, label: "Home", line1: "14B, 12th Main Road, HAL 2nd Stage", line2: "Indiranagar", city: "Bengaluru", state: "Karnataka", country: "India", postalCode: "560008", phone: "+919820000001", isDefault: true },
    { userId: customerDemo._id, label: "Office", line1: "Level 6, Prestige Tech Park", line2: "Outer Ring Road", city: "Bengaluru", state: "Karnataka", country: "India", postalCode: "560103", phone: "+919820000001", isDefault: false },
    { userId: custAnanya!._id, label: "Home", line1: "302 Sea Breeze Apartments, Pali Hill", city: "Mumbai", state: "Maharashtra", country: "India", postalCode: "400050", phone: "+919820000002", isDefault: true },
    { userId: custRohan!._id, label: "Home", line1: "24 Lane 5, Koregaon Park", city: "Pune", state: "Maharashtra", country: "India", postalCode: "411001", phone: "+919820000003", isDefault: true },
    { userId: custPriya!._id, label: "Home", line1: "B-44 Greater Kailash Part 1", city: "New Delhi", state: "Delhi", country: "India", postalCode: "110048", phone: "+919820000004", isDefault: true },
    { userId: custVikram!._id, label: "Home", line1: "18 Jubilee Enclave, Madhapur", city: "Hyderabad", state: "Telangana", country: "India", postalCode: "500081", phone: "+919820000005", isDefault: true },
  ]);
  const [addrDemoHome, addrDemoOffice, addrAnanya, addrRohan, addrPriya, addrVikram] = addresses;

  // 13. Pickup Points
  const [ppBlr, ppMum, ppPune, ppDel] = await PickupPoint.insertMany([
    { name: "Indiranagar Express Hub", address: "100 Feet Road, Near Metro Station, Indiranagar", city: "Bengaluru", phone: "+918041001100", staffId: staff1!._id, active: true },
    { name: "Bandra West Collection Point", address: "Hill Road, Opposite Elco Market, Bandra West", city: "Mumbai", phone: "+912241002200", staffId: staff3!._id, active: true },
    { name: "Koregaon Park Desk", address: "North Main Road, Koregaon Park", city: "Pune", phone: "+912041003300", staffId: staff3!._id, active: true },
    { name: "Connaught Place Locker Hub", address: "Block B, Inner Circle, Connaught Place", city: "New Delhi", phone: "+911141004400", staffId: staff1!._id, active: true },
  ]);

  // 14. Affiliate Program
  await AffiliateConfig.findOneAndUpdate(
    {},
    {
      enabled: true,
      commissionPercent: 5,
      cookieDays: 30,
      minWithdrawAmount: 500,
      firstPurchase: { enabled: true, percent: 10 },
      productSharing: { enabled: true, commissionType: "percent", commission: 5 },
      categorySharing: { enabled: false, rates: [{ categoryId: catElectronics._id, commissionType: "percent", commission: 4 }] },
      actionBonuses: { signup: 50, product_share: 15, category_share: 10, shop_share: 15 },
      allowedMethods: ["bank_transfer", "wallet", "manual"],
    },
    { upsert: true, new: true },
  );

  const [affDemo, affAnanya, affPriya, affKabir] = await AffiliateUser.insertMany([
    {
      userId: customerDemo._id,
      referralCode: "DEMOCUST",
      status: "approved",
      totalEarnings: 1650,
      availableBalance: 1150,
      paymentSettings: { method: "bank_transfer", accountName: "Demo Customer", accountNumber: "0048102000192", bankName: "HDFC Bank", routingNumber: "HDFC0000048" },
    },
    {
      userId: custAnanya!._id,
      referralCode: "ANANYA88",
      status: "approved",
      totalEarnings: 950,
      availableBalance: 950,
      paymentSettings: { method: "wallet" },
    },
    { userId: custPriya!._id, referralCode: "PRIYAREF", status: "pending", totalEarnings: 0, availableBalance: 0 },
    { userId: custKabir!._id, referralCode: "KABIR99", status: "suspended", totalEarnings: 200, availableBalance: 0, rejectionReason: "Self-referral abuse detected" },
  ]);

  // 15. Orders, Payments, Ledger, InventoryMovements, Refunds, Reviews, ClubPoints, Affiliates
  const orderSpecs = [
    // 1. Multi-vendor delivered order for customerDemo (with pickup point + digital + physical)
    {
      code: "ORD-2026-1001",
      userId: customerDemo._id,
      addressId: addrDemoHome!._id,
      addressSnapshot: addrDemoHome!.toObject(),
      createdAt: subDays(now, 24),
      paymentMethod: "wallet" as const,
      paymentStatus: "paid" as const,
      status: "delivered" as const,
      couponCode: "WELCOME10",
      couponDoc: cWelcome!,
      discount: 290,
      tax: 165,
      shippingTotal: 49,
      details: [
        {
          sellerId: sellerDemo!._id,
          pickupPointId: ppBlr!._id,
          commissionRate: 8,
          shippingCost: 49,
          status: "delivered" as const,
          deliveredAt: subDays(now, 21),
          items: [
            { productId: pEarbuds!._id, variantSku: "AURORA-BLK", name: pEarbuds!.name, attributes: { color: "Black" }, quantity: 1, unitPrice: 2549, listPrice: 2999, imageUrl: IMG.earbuds, refundable: true, clubPoints: 60 },
            { productId: pHandbook!._id, variantSku: "EBOOK-UISYS", name: pHandbook!.name, attributes: { format: "PDF" }, quantity: 1, unitPrice: 499, listPrice: 499, imageUrl: IMG.designKit, refundable: false, clubPoints: 25 },
          ],
        },
        {
          sellerId: null, // In-House item
          pickupPointId: null,
          commissionRate: 0,
          shippingCost: 0,
          status: "delivered" as const,
          deliveredAt: subDays(now, 20),
          items: [
            { productId: pLamp!._id, variantSku: "LAMP-BLK", name: pLamp!.name, attributes: { color: "Black" }, quantity: 1, unitPrice: 1709, listPrice: 1899, imageUrl: IMG.lamp, refundable: true, clubPoints: 35 },
          ],
        },
      ],
    },
    // 2. Delivered digital + apparel order for customerDemo (eligible for refund + review)
    {
      code: "ORD-2026-1002",
      userId: customerDemo._id,
      addressId: addrDemoOffice!._id,
      addressSnapshot: addrDemoOffice!.toObject(),
      createdAt: subDays(now, 16),
      paymentMethod: "stripe" as const,
      paymentStatus: "paid" as const,
      status: "delivered" as const,
      discount: 0,
      tax: 110,
      shippingTotal: 0,
      details: [
        {
          sellerId: sellerHandloom!._id,
          pickupPointId: null,
          commissionRate: 5,
          shippingCost: 0,
          status: "delivered" as const,
          deliveredAt: subDays(now, 12),
          items: [
            { productId: pKurta!._id, variantSku: "KURTA-PNK-M", name: pKurta!.name, attributes: { size: "M", color: "Rose Pink" }, quantity: 1, unitPrice: 1359, listPrice: 1699, imageUrl: IMG.kurta, refundable: true, clubPoints: 35 },
          ],
        },
        {
          sellerId: null,
          pickupPointId: null,
          commissionRate: 0,
          shippingCost: 0,
          status: "delivered" as const,
          deliveredAt: subDays(now, 16),
          items: [
            { productId: pPlaybook!._id, variantSku: "EBOOK-PLAYBOOK", name: pPlaybook!.name, attributes: { format: "PDF" }, quantity: 1, unitPrice: 399, listPrice: 399, imageUrl: IMG.ebook, refundable: false, clubPoints: 20 },
          ],
        },
      ],
    },
    // 3. Delivered smartwatch order for customerDemo (recently delivered — within 14 day refund window!)
    {
      code: "ORD-2026-1003",
      userId: customerDemo._id,
      addressId: addrDemoHome!._id,
      addressSnapshot: addrDemoHome!.toObject(),
      createdAt: subDays(now, 7),
      paymentMethod: "razorpay" as const,
      paymentStatus: "paid" as const,
      status: "delivered" as const,
      couponCode: "TECH15",
      couponDoc: cTech15!,
      discount: 567,
      tax: 189,
      shippingTotal: 0,
      details: [
        {
          sellerId: sellerTech!._id,
          pickupPointId: null,
          commissionRate: 6,
          shippingCost: 0,
          status: "delivered" as const,
          deliveredAt: subDays(now, 4),
          items: [
            { productId: pSmartwatch!._id, variantSku: "CHRONOS-BLK", name: pSmartwatch!.name, attributes: { color: "Black" }, quantity: 1, unitPrice: 3783, listPrice: 4299, imageUrl: IMG.smartwatch, refundable: true, clubPoints: 85 },
          ],
        },
      ],
    },
    // 4. Shipped order for customerDemo
    {
      code: "ORD-2026-1004",
      userId: customerDemo._id,
      addressId: addrDemoHome!._id,
      addressSnapshot: addrDemoHome!.toObject(),
      createdAt: subDays(now, 3),
      paymentMethod: "wallet" as const,
      paymentStatus: "paid" as const,
      status: "shipped" as const,
      discount: 0,
      tax: 82,
      shippingTotal: 49,
      details: [
        {
          sellerId: sellerWellness!._id,
          pickupPointId: ppBlr!._id,
          commissionRate: 8,
          shippingCost: 49,
          status: "shipped" as const,
          items: [
            { productId: pCoffee!._id, variantSku: "COFFEE-WHOLE-500", name: pCoffee!.name, attributes: { grind: "Whole Bean", pack: "500g" }, quantity: 1, unitPrice: 649, listPrice: 649, imageUrl: IMG.coffeeBeans, refundable: false, clubPoints: 15 },
            { productId: pSpices!._id, variantSku: "SPICE-BOX-6", name: pSpices!.name, attributes: { pack: "6 Glass Jars" }, quantity: 1, unitPrice: 949, listPrice: 949, imageUrl: IMG.spices, refundable: true, clubPoints: 20 },
          ],
        },
      ],
    },
    // 5. Processing order for customerDemo
    {
      code: "ORD-2026-1005",
      userId: customerDemo._id,
      addressId: addrDemoHome!._id,
      addressSnapshot: addrDemoHome!.toObject(),
      createdAt: subDays(now, 1),
      paymentMethod: "cod" as const,
      paymentStatus: "unpaid" as const,
      status: "processing" as const,
      discount: 0,
      tax: 70,
      shippingTotal: 49,
      details: [
        {
          sellerId: sellerDemo!._id,
          pickupPointId: null,
          commissionRate: 8,
          shippingCost: 49,
          status: "processing" as const,
          items: [
            { productId: pBackpack!._id, variantSku: "BACKPACK-GRY", name: pBackpack!.name, attributes: { color: "Slate Grey" }, quantity: 1, unitPrice: 1399, listPrice: 1499, imageUrl: IMG.backpack, refundable: true, clubPoints: 30 },
          ],
        },
      ],
    },
    // 6. Pending manual-payment order for customerDemo
    {
      code: "ORD-2026-1006",
      userId: customerDemo._id,
      addressId: addrDemoHome!._id,
      addressSnapshot: addrDemoHome!.toObject(),
      createdAt: subHours(now, 6),
      paymentMethod: "manual" as const,
      paymentStatus: "pending" as const,
      status: "pending" as const,
      discount: 0,
      tax: 247,
      shippingTotal: 0,
      details: [
        {
          sellerId: sellerDemo!._id,
          pickupPointId: null,
          commissionRate: 8,
          shippingCost: 0,
          status: "pending" as const,
          items: [
            { productId: pHeadphones!._id, variantSku: "STUDIO-HP-BLK", name: pHeadphones!.name, attributes: { color: "Black" }, quantity: 1, unitPrice: 4949, listPrice: 5499, imageUrl: IMG.headphones, refundable: true, clubPoints: 100 },
          ],
        },
      ],
    },
    // 7. Ananya (referred by customerDemo) - Delivered order (drives affiliate earnings & seller chart!)
    {
      code: "ORD-2026-1007",
      userId: custAnanya!._id,
      addressId: addrAnanya!._id,
      addressSnapshot: addrAnanya!.toObject(),
      createdAt: subDays(now, 19),
      paymentMethod: "stripe" as const,
      paymentStatus: "paid" as const,
      status: "delivered" as const,
      couponCode: "FLAT200",
      couponDoc: cFlat200!,
      discount: 200,
      tax: 300,
      shippingTotal: 0,
      details: [
        {
          sellerId: sellerDemo!._id,
          pickupPointId: ppMum!._id,
          commissionRate: 8,
          shippingCost: 0,
          status: "delivered" as const,
          deliveredAt: subDays(now, 15),
          items: [
            { productId: pHeadphones!._id, variantSku: "STUDIO-HP-BLK", name: pHeadphones!.name, attributes: { color: "Black" }, quantity: 1, unitPrice: 4949, listPrice: 5499, imageUrl: IMG.headphones, refundable: true, clubPoints: 100, productReferralCode: "DEMOCUST" },
            { productId: pTshirt!._id, variantSku: "TSHIRT-BLK-M", name: pTshirt!.name, attributes: { size: "M", color: "Black" }, quantity: 2, unitPrice: 539, listPrice: 599, imageUrl: IMG.tshirt, refundable: true, clubPoints: 15 },
          ],
        },
      ],
    },
    // 8. Rohan (referred by customerDemo) - Delivered order (recent, for refund request + seller chart)
    {
      code: "ORD-2026-1008",
      userId: custRohan!._id,
      addressId: addrRohan!._id,
      addressSnapshot: addrRohan!.toObject(),
      createdAt: subDays(now, 10),
      paymentMethod: "wallet" as const,
      paymentStatus: "paid" as const,
      status: "delivered" as const,
      discount: 0,
      tax: 220,
      shippingTotal: 0,
      details: [
        {
          sellerId: sellerTech!._id,
          pickupPointId: ppPune!._id,
          commissionRate: 6,
          shippingCost: 0,
          status: "delivered" as const,
          deliveredAt: subDays(now, 6),
          items: [
            { productId: pKeyboard!._id, variantSku: "MECH75-BRN", name: pKeyboard!.name, attributes: { switch: "Tactile Brown" }, quantity: 1, unitPrice: 3599, listPrice: 3899, imageUrl: IMG.keyboard, refundable: true, clubPoints: 75, productReferralCode: "DEMOCUST" },
          ],
        },
        {
          sellerId: sellerDemo!._id,
          pickupPointId: ppPune!._id,
          commissionRate: 8,
          shippingCost: 0,
          status: "delivered" as const,
          deliveredAt: subDays(now, 6),
          items: [
            { productId: pTshirt!._id, variantSku: "TSHIRT-BLK-S", name: pTshirt!.name, attributes: { size: "S", color: "Black" }, quantity: 2, unitPrice: 539, listPrice: 599, imageUrl: IMG.tshirt, refundable: true, clubPoints: 15 },
          ],
        },
      ],
    },
    // 9. Priya - Delivered order (has refunded refund request)
    {
      code: "ORD-2026-1009",
      userId: custPriya!._id,
      addressId: addrPriya!._id,
      addressSnapshot: addrPriya!.toObject(),
      createdAt: subDays(now, 14),
      paymentMethod: "razorpay" as const,
      paymentStatus: "paid" as const,
      status: "refunded" as const,
      couponCode: "LOOM250",
      couponDoc: cHandloom!,
      discount: 250,
      tax: 150,
      shippingTotal: 0,
      details: [
        {
          sellerId: sellerHandloom!._id,
          pickupPointId: ppDel!._id,
          commissionRate: 5,
          shippingCost: 0,
          status: "refunded" as const,
          deliveredAt: subDays(now, 10),
          items: [
            { productId: pJacket!._id, variantSku: "JACKET-BLK-M", name: pJacket!.name, attributes: { size: "M" }, quantity: 1, unitPrice: 3149, listPrice: 3499, imageUrl: IMG.jacket, refundable: true, clubPoints: 70 },
          ],
        },
      ],
    },
    // 10. Vikram - Delivered order (has seller-approved refund awaiting admin payout)
    {
      code: "ORD-2026-1010",
      userId: custVikram!._id,
      addressId: addrVikram!._id,
      addressSnapshot: addrVikram!.toObject(),
      createdAt: subDays(now, 9),
      paymentMethod: "wallet" as const,
      paymentStatus: "paid" as const,
      status: "delivered" as const,
      discount: 0,
      tax: 119,
      shippingTotal: 0,
      details: [
        {
          sellerId: sellerHandloom!._id,
          pickupPointId: null,
          commissionRate: 5,
          shippingCost: 0,
          status: "delivered" as const,
          deliveredAt: subDays(now, 5),
          items: [
            { productId: pSneakers!._id, variantSku: "AERO-RED-9", name: pSneakers!.name, attributes: { size: "UK 9", color: "Red" }, quantity: 1, unitPrice: 2379, listPrice: 2799, imageUrl: IMG.sneakers, refundable: true, clubPoints: 50, productReferralCode: "ANANYA88" },
          ],
        },
      ],
    },
    // 11. Sneha - Confirmed order for Demo Seller (5 days ago)
    {
      code: "ORD-2026-1011",
      userId: custSneha!._id,
      addressId: addrDemoHome!._id,
      addressSnapshot: { line1: "88 MG Road", city: "Bengaluru", state: "Karnataka", country: "India", postalCode: "560001", phone: "+919820000006" },
      createdAt: subDays(now, 5),
      paymentMethod: "stripe" as const,
      paymentStatus: "paid" as const,
      status: "confirmed" as const,
      discount: 0,
      tax: 127,
      shippingTotal: 0,
      details: [
        {
          sellerId: sellerDemo!._id,
          pickupPointId: ppBlr!._id,
          commissionRate: 8,
          shippingCost: 0,
          status: "confirmed" as const,
          items: [
            { productId: pEarbuds!._id, variantSku: "AURORA-WHT", name: pEarbuds!.name, attributes: { color: "White" }, quantity: 1, unitPrice: 2634, listPrice: 3099, imageUrl: IMG.earbuds, refundable: true, clubPoints: 60 },
          ],
        },
      ],
    },
    // 12. Kabir - Cancelled order
    {
      code: "ORD-2026-1012",
      userId: custKabir!._id,
      addressId: addrDemoHome!._id,
      addressSnapshot: { line1: "45 Park Street", city: "Kolkata", state: "West Bengal", country: "India", postalCode: "700016", phone: "+919820000007" },
      createdAt: subDays(now, 11),
      paymentMethod: "cod" as const,
      paymentStatus: "unpaid" as const,
      status: "cancelled" as const,
      discount: 0,
      tax: 65,
      shippingTotal: 49,
      details: [
        {
          sellerId: sellerTech!._id,
          pickupPointId: null,
          commissionRate: 6,
          shippingCost: 49,
          status: "cancelled" as const,
          cancelledAt: subDays(now, 10),
          items: [
            { productId: pMouse!._id, variantSku: "MOUSE-GRY", name: pMouse!.name, attributes: { color: "Slate Grey" }, quantity: 1, unitPrice: 1299, listPrice: 1299, imageUrl: IMG.mouse, refundable: true, clubPoints: 20 },
          ],
        },
      ],
    },
    // 13. POS In-Store Sale for Demo Seller (2 days ago)
    {
      code: "POS-2026-2001",
      userId: custMeera!._id,
      addressId: null,
      addressSnapshot: { line1: "In-store purchase", city: "Bengaluru", state: "Karnataka", country: "India", postalCode: "560025", phone: "+919820000008" },
      createdAt: subDays(now, 2),
      paymentMethod: "manual" as const,
      paymentStatus: "paid" as const,
      status: "delivered" as const,
      discount: 0,
      tax: 155,
      shippingTotal: 0,
      details: [
        {
          sellerId: sellerDemo!._id,
          pickupPointId: null,
          commissionRate: 8,
          shippingCost: 0,
          status: "delivered" as const,
          deliveredAt: subDays(now, 2),
          items: [
            { productId: pEarbuds!._id, variantSku: "AURORA-BLK", name: pEarbuds!.name, attributes: { color: "Black" }, quantity: 1, unitPrice: 2549, listPrice: 2999, imageUrl: IMG.earbuds, refundable: true, clubPoints: 60 },
            { productId: pTshirt!._id, variantSku: "TSHIRT-BLK-M", name: pTshirt!.name, attributes: { size: "M", color: "Black" }, quantity: 1, unitPrice: 539, listPrice: 599, imageUrl: IMG.tshirt, refundable: true, clubPoints: 15 },
          ],
        },
      ],
    },
    // 14. POS Walk-in Sale for Tech + In-House (yesterday)
    {
      code: "POS-2026-2002",
      userId: custArjun!._id,
      addressId: null,
      addressSnapshot: { line1: "In-store purchase", city: "Mumbai", state: "Maharashtra", country: "India", postalCode: "400050", phone: "+919820000009" },
      createdAt: subDays(now, 1),
      paymentMethod: "manual" as const,
      paymentStatus: "paid" as const,
      status: "delivered" as const,
      discount: 0,
      tax: 168,
      shippingTotal: 0,
      details: [
        {
          sellerId: sellerTech!._id,
          pickupPointId: null,
          commissionRate: 6,
          shippingCost: 0,
          status: "delivered" as const,
          deliveredAt: subDays(now, 1),
          items: [
            { productId: pSpeaker!._id, variantSku: "SPK-BLK", name: pSpeaker!.name, attributes: { color: "Black" }, quantity: 1, unitPrice: 2199, listPrice: 2199, imageUrl: IMG.speaker, refundable: true, clubPoints: 40 },
          ],
        },
        {
          sellerId: null,
          pickupPointId: null,
          commissionRate: 0,
          shippingCost: 0,
          status: "delivered" as const,
          deliveredAt: subDays(now, 1),
          items: [
            { productId: pPourOver!._id, variantSku: "POUROVER-600", name: pPourOver!.name, attributes: { capacity: "600ml" }, quantity: 1, unitPrice: 1449, listPrice: 1449, imageUrl: IMG.coffeeMaker, refundable: true, clubPoints: 25 },
          ],
        },
      ],
    },
    // 15. Big laptop order for Vikram (22 days ago)
    {
      code: "ORD-2026-1015",
      userId: custVikram!._id,
      addressId: addrVikram!._id,
      addressSnapshot: addrVikram!.toObject(),
      createdAt: subDays(now, 22),
      paymentMethod: "stripe" as const,
      paymentStatus: "paid" as const,
      status: "delivered" as const,
      discount: 0,
      tax: 2612,
      shippingTotal: 0,
      details: [
        {
          sellerId: sellerTech!._id,
          pickupPointId: null,
          commissionRate: 6,
          shippingCost: 0,
          status: "delivered" as const,
          deliveredAt: subDays(now, 18),
          items: [
            { productId: pLaptop!._id, variantSku: "PROBOOK-16-512", name: pLaptop!.name, attributes: { RAM: "16GB", Storage: "512GB" }, quantity: 1, unitPrice: 52240, listPrice: 54990, imageUrl: IMG.laptop, refundable: true, clubPoints: 500 },
          ],
        },
      ],
    },
    // 16. Recent Demo Seller order (today) for 30-day chart freshness
    {
      code: "ORD-2026-1016",
      userId: custAnanya!._id,
      addressId: addrAnanya!._id,
      addressSnapshot: addrAnanya!.toObject(),
      createdAt: subHours(now, 4),
      paymentMethod: "wallet" as const,
      paymentStatus: "paid" as const,
      status: "confirmed" as const,
      discount: 0,
      tax: 152,
      shippingTotal: 0,
      details: [
        {
          sellerId: sellerDemo!._id,
          pickupPointId: null,
          commissionRate: 8,
          shippingCost: 0,
          status: "confirmed" as const,
          items: [
            { productId: pEarbuds!._id, variantSku: "AURORA-BLK", name: pEarbuds!.name, attributes: { color: "Black" }, quantity: 1, unitPrice: 2549, listPrice: 2999, imageUrl: IMG.earbuds, refundable: true, clubPoints: 60 },
          ],
        },
      ],
    },
  ];

  const createdOrders = new Map<string, InstanceType<typeof Order>>();
  const sellerBalances = new Map<string, number>();

  for (const spec of orderSpecs) {
    const computedDetails = spec.details.map((d) => {
      const subtotal = round2(d.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0));
      const commissionAmount = d.sellerId ? round2((subtotal * d.commissionRate) / 100) : 0;
      return {
        sellerId: d.sellerId,
        items: d.items,
        subtotal,
        tax: null,
        commissionRate: d.commissionRate,
        commissionAmount,
        shippingCost: d.shippingCost,
        discount: null,
        clubPointsSpent: null,
        pickupPointId: d.pickupPointId,
        status: d.status,
        deliveredAt: "deliveredAt" in d ? d.deliveredAt : undefined,
        cancelledAt: "cancelledAt" in d ? d.cancelledAt : undefined,
      };
    });

    const goodsTotal = computedDetails.reduce((s, d) => s + d.subtotal, 0);
    const grandTotal = round2(Math.max(0, goodsTotal - spec.discount + spec.tax + spec.shippingTotal));

    const order = await Order.create({
      code: spec.code,
      userId: spec.userId,
      addressId: spec.addressId,
      addressSnapshot: spec.addressSnapshot,
      details: computedDetails,
      couponCode: spec.couponCode ?? null,
      discount: spec.discount,
      couponDiscount: spec.discount,
      clubPointsSpent: 0,
      clubPointsDiscount: 0,
      tax: spec.tax,
      shippingTotal: spec.shippingTotal,
      grandTotal,
      currency: "INR",
      paymentMethod: spec.paymentMethod,
      paymentStatus: spec.paymentStatus,
      inventoryStatus: spec.status === "cancelled" ? "released" : spec.paymentStatus === "paid" ? "confirmed" : "reserved",
      status: spec.status,
      idempotencyKey: `seed-order-${spec.code}`,
      trackingCode: ["shipped", "delivered"].includes(spec.status) ? `TRK-${spec.code}` : undefined,
      deliveryViewed: spec.code !== "ORD-2026-1004",
      paymentStatusViewed: true,
      createdAt: spec.createdAt,
      updatedAt: spec.createdAt,
    });

    createdOrders.set(spec.code, order);

    if (spec.couponDoc) {
      await CouponUsage.create({
        couponId: spec.couponDoc._id,
        userId: spec.userId,
        orderId: order._id,
      });
    }

    await Payment.create({
      orderId: order._id,
      method: spec.paymentMethod,
      amount: grandTotal,
      currency: "INR",
      status: spec.paymentStatus,
      providerRef: spec.paymentStatus === "paid" ? `prov_${spec.code}` : undefined,
      idempotencyKey: `seed-pay-${spec.code}`,
      manualProofUrl: spec.paymentMethod === "manual" ? IMG.bannerSale : undefined,
      createdAt: spec.createdAt,
    });

    for (const d of computedDetails) {
      for (const item of d.items) {
        await InventoryMovement.create({
          productId: item.productId,
          variantSku: item.variantSku,
          type: spec.status === "cancelled" ? "release" : spec.paymentStatus === "paid" ? "confirm" : "reserve",
          quantity: spec.status === "cancelled" ? item.quantity : -item.quantity,
          orderId: order._id,
          note: `Seed order ${spec.code}`,
          createdAt: spec.createdAt,
        });
      }

      if (d.sellerId && spec.paymentStatus === "paid") {
        const sid = String(d.sellerId);
        await SellerLedger.create([
          { sellerId: d.sellerId, orderId: order._id, type: "sale", amount: d.subtotal, note: `Sale ${spec.code}`, createdAt: spec.createdAt },
          { sellerId: d.sellerId, orderId: order._id, type: "commission", amount: -d.commissionAmount, note: `Commission ${spec.code}`, createdAt: spec.createdAt },
        ]);
        sellerBalances.set(sid, round2((sellerBalances.get(sid) ?? 0) + d.subtotal - d.commissionAmount));
      }
    }
  }

  // 16. Seller Payouts & Withdraw Requests (keeping ledger consistent and positive)
  const ord1009 = createdOrders.get("ORD-2026-1009")!;
  // Reverse ORD-2026-1009 refund on Handloom ledger
  await SellerLedger.create([
    { sellerId: sellerHandloom!._id, orderId: ord1009._id, type: "refund", amount: -3149, note: "Refund approved (ORD-2026-1009)", createdAt: subDays(now, 8) },
    { sellerId: sellerHandloom!._id, orderId: ord1009._id, type: "commission", amount: 157.45, note: "Refund commission reversal", createdAt: subDays(now, 8) },
  ]);
  // Give Handloom an opening adjustment so it stays comfortably positive after the refund + payouts
  await SellerLedger.create({
    sellerId: sellerHandloom!._id,
    type: "adjustment",
    amount: 4500,
    note: "Opening balance carried forward",
    createdAt: subDays(now, 28),
  });

  // Recorded payouts (admin pay-to-seller) + ledger withdrawals
  await SellerPayout.insertMany([
    { sellerId: sellerDemo!._id, amount: 3000, method: "bank_transfer", reference: "NEFT-8812041", note: "Bi-weekly settlement", paidBy: admin._id, idempotencyKey: "seed-payout-demo-1", createdAt: subDays(now, 10) },
    { sellerId: sellerTech!._id, amount: 25000, method: "bank_transfer", reference: "NEFT-8812099", note: "Electronics settlement", paidBy: admin._id, idempotencyKey: "seed-payout-tech-1", createdAt: subDays(now, 7) },
    { sellerId: sellerHandloom!._id, amount: 1500, method: "wallet", reference: "WAL-99102", note: "Settled to seller wallet", paidBy: admin._id, idempotencyKey: "seed-payout-handloom-1", createdAt: subDays(now, 6) },
  ]);

  await SellerLedger.insertMany([
    { sellerId: sellerDemo!._id, type: "withdrawal", amount: -3000, note: "Bi-weekly settlement", createdAt: subDays(now, 10) },
    { sellerId: sellerTech!._id, type: "withdrawal", amount: -25000, note: "Electronics settlement", createdAt: subDays(now, 7) },
    { sellerId: sellerHandloom!._id, type: "withdrawal", amount: -1500, note: "Settled to seller wallet", createdAt: subDays(now, 6) },
  ]);

  // Withdraw requests (paid, rejected, and pending within available balance!)
  await SellerWithdrawRequest.insertMany([
    { sellerId: sellerDemo!._id, amount: 3000, method: "bank_transfer", bankDetails: { bank: "HDFC", account: "XXXX4412" }, status: "paid", processedBy: admin._id, processedAt: subDays(now, 10), createdAt: subDays(now, 11) },
    { sellerId: sellerDemo!._id, amount: 1500, method: "bank_transfer", bankDetails: { bank: "HDFC", account: "XXXX4412" }, status: "pending", createdAt: subDays(now, 1) },
    { sellerId: sellerTech!._id, amount: 5000, method: "bank_transfer", bankDetails: { bank: "ICICI", account: "XXXX9081" }, status: "pending", createdAt: subHours(now, 12) },
    { sellerId: sellerWellness!._id, amount: 800, method: "wallet", status: "pending", createdAt: subHours(now, 5) },
    { sellerId: sellerHandloom!._id, amount: 12000, method: "bank_transfer", status: "rejected", processedBy: admin._id, processedAt: subDays(now, 4), rejectionReason: "Exceeds available settled balance", createdAt: subDays(now, 5) },
  ]);

  // 17. Refund Requests (pending, approved, refunded, rejected)
  const ord1001 = createdOrders.get("ORD-2026-1001")!;
  const ord1002 = createdOrders.get("ORD-2026-1002")!;
  const ord1003 = createdOrders.get("ORD-2026-1003")!;
  const ord1004 = createdOrders.get("ORD-2026-1004")!;
  const ord1005 = createdOrders.get("ORD-2026-1005")!;
  const ord1008 = createdOrders.get("ORD-2026-1008")!;
  const ord1010 = createdOrders.get("ORD-2026-1010")!;

  await RefundRequest.insertMany([
    {
      orderId: ord1003._id,
      userId: customerDemo._id,
      sellerId: sellerTech!._id,
      reason: "Watch strap clasp feels slightly loose on my wrist; would like a refund.",
      images: [IMG.smartwatch],
      lines: [{ productId: pSmartwatch!._id, variantSku: "CHRONOS-BLK", quantity: 1, restocked: false }],
      merchandise: 3783,
      tax: 189,
      discount: 567,
      amount: 3405,
      status: "pending",
      createdAt: subDays(now, 2),
    },
    {
      orderId: ord1008._id,
      userId: custRohan!._id,
      sellerId: sellerDemo!._id,
      reason: "Ordered size S by mistake, need to reorder size M.",
      images: [IMG.tshirt],
      lines: [{ productId: pTshirt!._id, variantSku: "TSHIRT-BLK-S", quantity: 2, restocked: false }],
      merchandise: 1078,
      tax: 54,
      discount: 0,
      amount: 1132,
      status: "pending",
      createdAt: subDays(now, 1),
    },
    {
      orderId: ord1010._id,
      userId: custVikram!._id,
      sellerId: sellerHandloom!._id,
      reason: "Size runs half a size small for wide feet.",
      images: [IMG.sneakers],
      lines: [{ productId: pSneakers!._id, variantSku: "AERO-RED-9", quantity: 1, restocked: false }],
      merchandise: 2379,
      tax: 119,
      discount: 0,
      amount: 2498,
      status: "approved",
      resolvedBy: sellerHandloom!._id,
      resolutionNote: "Seller verified return in unused condition; ready for wallet payout.",
      createdAt: subDays(now, 3),
    },
    {
      orderId: ord1009._id,
      userId: custPriya!._id,
      sellerId: sellerHandloom!._id,
      reason: "Changed mind before wearing; tags intact.",
      images: [IMG.jacket],
      lines: [{ productId: pJacket!._id, variantSku: "JACKET-BLK-M", quantity: 1, restocked: true }],
      merchandise: 3149,
      tax: 150,
      discount: 250,
      amount: 3049,
      status: "refunded",
      resolvedBy: admin._id,
      resolutionNote: "Restocked and credited to customer wallet.",
      createdAt: subDays(now, 8),
    },
    {
      orderId: ord1001._id,
      userId: customerDemo._id,
      sellerId: sellerDemo!._id,
      reason: "Testing partial return inquiry outside window.",
      images: [],
      lines: [{ productId: pEarbuds!._id, variantSku: "AURORA-BLK", quantity: 1, restocked: false }],
      merchandise: 2549,
      tax: 127,
      discount: 0,
      amount: 2676,
      status: "rejected",
      resolvedBy: sellerDemo!._id,
      resolutionNote: "Item verified working during pickup demonstration.",
      createdAt: subDays(now, 18),
    },
  ]);

  // 18. Wallets, Wallet Transactions & Recharge Requests
  const allUsers = [
    admin,
    staff1,
    staff2,
    staff3,
    sellerDemo!,
    sellerTech!,
    sellerHandloom!,
    sellerWellness!,
    sellerUrbanPending!,
    sellerCraftRejected!,
    customerDemo,
    custAnanya!,
    custRohan!,
    custPriya!,
    custVikram!,
    custSneha!,
    custKabir!,
    custMeera!,
    custArjun!,
    custBanned!,
  ];

  const walletBalances = new Map<string, number>([
    [String(admin._id), 25000],
    [String(customerDemo._id), 12450],
    [String(custAnanya!._id), 8200],
    [String(custRohan!._id), 4500],
    [String(custPriya!._id), 6849],
    [String(custVikram!._id), 5200],
    [String(sellerDemo!._id), 9500],
    [String(sellerTech!._id), 14000],
    [String(sellerHandloom!._id), 6500],
  ]);

  for (const u of allUsers) {
    await Wallet.create({
      userId: u._id,
      balance: walletBalances.get(String(u._id)) ?? 5000,
      currency: "INR",
    });
  }

  await WalletTransaction.insertMany([
    { userId: customerDemo._id, amount: 15000, balanceAfter: 15000, reason: "Wallet recharge approved", refType: "recharge", idempotencyKey: "seed-wt-demo-1", createdAt: subDays(now, 28) },
    { userId: customerDemo._id, amount: -4632, balanceAfter: 10368, reason: `Order payment (${ord1001.code})`, refType: "order", refId: ord1001._id, idempotencyKey: "seed-wt-demo-2", createdAt: subDays(now, 24) },
    { userId: customerDemo._id, amount: 500, balanceAfter: 10868, reason: "Affiliate withdrawal payout", refType: "affiliate", idempotencyKey: "seed-wt-demo-3", createdAt: subDays(now, 12) },
    { userId: customerDemo._id, amount: 1582, balanceAfter: 12450, reason: "Club points converted (3164 pts -> manual credit)", refType: "manual", idempotencyKey: "seed-wt-demo-4", createdAt: subDays(now, 5) },
    { userId: custPriya!._id, amount: 3800, balanceAfter: 3800, reason: "Opening wallet recharge", refType: "recharge", idempotencyKey: "seed-wt-priya-1", createdAt: subDays(now, 20) },
    { userId: custPriya!._id, amount: 3049, balanceAfter: 6849, reason: "Refund approved", refType: "refund", refId: ord1009._id, idempotencyKey: "seed-wt-priya-2", createdAt: subDays(now, 8) },
    { userId: sellerHandloom!._id, amount: 1500, balanceAfter: 6500, reason: "Seller payout", refType: "withdrawal", idempotencyKey: "seed-wt-handloom-1", createdAt: subDays(now, 6) },
  ]);

  await WalletRechargeRequest.insertMany([
    { userId: customerDemo._id, amount: 15000, methodId: sbiBank!._id, proofUrl: IMG.bannerSale, status: "approved", resolvedBy: admin._id, createdAt: subDays(now, 28) },
    { userId: customerDemo._id, amount: 2500, methodId: upiMethod!._id, proofUrl: IMG.bannerTech, status: "pending", createdAt: subHours(now, 8) },
    { userId: custAnanya!._id, amount: 5000, methodId: neftMethod!._id, proofUrl: IMG.bannerHome, status: "pending", createdAt: subHours(now, 3) },
    { userId: custRohan!._id, amount: 1500, methodId: upiMethod!._id, proofUrl: IMG.bannerFashion, status: "rejected", resolvedBy: admin._id, rejectionReason: "UTR number unreadable in uploaded screenshot", createdAt: subDays(now, 4) },
  ]);

  // 19. Club Point Transactions (aligned with User.clubPoints)
  await ClubPointTransaction.insertMany([
    { userId: customerDemo._id, points: 120, reason: `Earned from order ${ord1001.code}`, orderId: ord1001._id, idempotencyKey: "seed-cp-demo-1", createdAt: subDays(now, 20) },
    { userId: customerDemo._id, points: 55, reason: `Earned from order ${ord1002.code}`, orderId: ord1002._id, idempotencyKey: "seed-cp-demo-2", createdAt: subDays(now, 12) },
    { userId: customerDemo._id, points: 85, reason: `Earned from order ${ord1003.code}`, orderId: ord1003._id, idempotencyKey: "seed-cp-demo-3", createdAt: subDays(now, 4) },
    { userId: customerDemo._id, points: 290, reason: "Welcome & festive loyalty bonus", idempotencyKey: "seed-cp-demo-4", createdAt: subDays(now, 10) },
    { userId: customerDemo._id, points: -100, reason: "Converted 100 club points to wallet", idempotencyKey: "seed-cp-demo-5", createdAt: subDays(now, 5) },
    { userId: custAnanya!._id, points: 320, reason: "Earned from electronics & fashion orders", idempotencyKey: "seed-cp-ananya-1", createdAt: subDays(now, 15) },
    { userId: custRohan!._id, points: 180, reason: "Earned from peripherals order", idempotencyKey: "seed-cp-rohan-1", createdAt: subDays(now, 6) },
    { userId: custPriya!._id, points: 210, reason: "Loyalty milestone bonus", idempotencyKey: "seed-cp-priya-1", createdAt: subDays(now, 10) },
  ]);

  // 20. Affiliate Earnings, Withdrawals, Payments
  const ord1007 = createdOrders.get("ORD-2026-1007")!;
  const ord1015 = createdOrders.get("ORD-2026-1015")!;
  await AffiliateEarningDetail.insertMany([
    { buyerId: custAnanya!._id, affiliateUserId: affDemo!._id, orderId: ord1007._id, kind: "first_purchase", lineKey: null, amount: 600, status: "credited", createdAt: subDays(now, 15) },
    { buyerId: custAnanya!._id, affiliateUserId: affDemo!._id, orderId: ord1007._id, kind: "product_share", lineKey: `${pHeadphones!._id}:STUDIO-HP-BLK`, amount: 350, status: "credited", createdAt: subDays(now, 15) },
    { buyerId: custRohan!._id, affiliateUserId: affDemo!._id, orderId: ord1008._id, kind: "first_purchase", lineKey: null, amount: 460, status: "credited", createdAt: subDays(now, 6) },
    { buyerId: custRohan!._id, affiliateUserId: affDemo!._id, orderId: ord1008._id, kind: "product_share", lineKey: `${pKeyboard!._id}:MECH75-BRN`, amount: 240, status: "credited", createdAt: subDays(now, 6) },
    { buyerId: custVikram!._id, affiliateUserId: affAnanya!._id, orderId: ord1010._id, kind: "first_purchase", lineKey: null, amount: 250, status: "credited", createdAt: subDays(now, 5) },
    { buyerId: custVikram!._id, affiliateUserId: affAnanya!._id, orderId: ord1015._id, kind: "order_commission", lineKey: null, amount: 700, status: "credited", createdAt: subDays(now, 18) },
  ]);

  const [affWdPaid, affWdPending] = await AffiliateWithdrawRequest.insertMany([
    { affiliateUserId: affDemo!._id, amount: 500, method: "wallet", status: "paid", processedBy: admin._id, createdAt: subDays(now, 12) },
    { affiliateUserId: affDemo!._id, amount: 500, method: "bank_transfer", bankDetails: { accountName: "Demo Customer", accountNumber: "0048102000192" }, status: "pending", createdAt: subDays(now, 1) },
    { affiliateUserId: affAnanya!._id, amount: 500, method: "wallet", status: "pending", createdAt: subHours(now, 10) },
  ]);

  await AffiliatePayment.insertMany([
    { affiliateUserId: affDemo!._id, withdrawRequestId: affWdPaid!._id, amount: 500, note: "Credited to wallet", paidBy: admin._id, paidAt: subDays(now, 12), idempotencyKey: `affiliate-withdrawal:${affWdPaid!._id}` },
    { affiliateUserId: affAnanya!._id, withdrawRequestId: null, amount: 250, note: "Early performance bonus", paidBy: admin._id, paidAt: subDays(now, 4), idempotencyKey: "seed-aff-direct-1" },
  ]);
  void affWdPending;

  // 21. Reviews (unique on userId + orderId + productId) + recompute product ratings
  const reviewsToInsert = [
    { userId: customerDemo._id, productId: pEarbuds!._id, orderId: ord1001._id, rating: 5, comment: "Noise cancellation on metro commutes is impressive, and battery easily lasts a full week.", approved: true, sellerReply: "Thank you for the awesome review! Enjoy your Aurora Earbuds.", sellerViewed: true, createdAt: subDays(now, 19) },
    { userId: customerDemo._id, productId: pLamp!._id, orderId: ord1001._id, rating: 5, comment: "Solid wood joint feels sturdy and the warm bulb is super easy on the eyes late at night.", approved: true, sellerViewed: true, createdAt: subDays(now, 18) },
    { userId: customerDemo._id, productId: pHandbook!._id, orderId: ord1001._id, rating: 5, comment: "Clean layout, actionable spacing tokens, and instant PDF download.", approved: true, sellerViewed: false, createdAt: subDays(now, 18) },
    { userId: customerDemo._id, productId: pKurta!._id, orderId: ord1002._id, rating: 4, comment: "Beautiful Jaipur block print and soft mulmul fabric. Colours stayed bright after wash.", approved: true, sellerReply: "So glad you loved the mulmul weave!", sellerViewed: true, createdAt: subDays(now, 11) },
    { userId: custAnanya!._id, productId: pHeadphones!._id, orderId: ord1007._id, rating: 5, comment: "Crisp vocals and zero clamping pressure during 4-hour editing sessions.", approved: true, sellerViewed: false, createdAt: subDays(now, 14) },
    { userId: custAnanya!._id, productId: pTshirt!._id, orderId: ord1007._id, rating: 4, comment: "Thick 240 GSM fabric, fits true to size.", approved: true, sellerViewed: false, createdAt: subDays(now, 14) },
    { userId: custRohan!._id, productId: pKeyboard!._id, orderId: ord1008._id, rating: 5, comment: "Gasket mount sounds thocky right out of the box. Best 75% board under ₹4,000.", approved: true, sellerReply: "Happy typing! Reach out anytime if you try different switches.", sellerViewed: true, createdAt: subDays(now, 5) },
    { userId: custRohan!._id, productId: pTshirt!._id, orderId: ord1008._id, rating: 5, comment: "Super comfortable cotton, ordered two more colors.", approved: true, sellerViewed: false, createdAt: subDays(now, 5) },
    { userId: custVikram!._id, productId: pLaptop!._id, orderId: ord1015._id, rating: 5, comment: "2.8K screen is razor sharp and aluminum chassis has zero flex.", approved: true, sellerViewed: true, createdAt: subDays(now, 16) },
    { userId: custPriya!._id, productId: pEarbuds!._id, orderId: new mongoose.Types.ObjectId(), rating: 4, comment: "Great microphone clarity for calls. Case is compact.", approved: true, sellerViewed: false, createdAt: subDays(now, 9) },
    { userId: custSneha!._id, productId: pSmartwatch!._id, orderId: new mongoose.Types.ObjectId(), rating: 5, comment: "AMOLED display stays readable outdoors and GPS locks in seconds.", approved: true, sellerViewed: true, createdAt: subDays(now, 8) },
    { userId: custKabir!._id, productId: pSpeaker!._id, orderId: new mongoose.Types.ObjectId(), rating: 4, comment: "Punchy bass for a compact desk speaker.", approved: true, sellerViewed: true, createdAt: subDays(now, 7) },
    { userId: custMeera!._id, productId: pSerum!._id, orderId: new mongoose.Types.ObjectId(), rating: 5, comment: "Lightweight, absorbs quickly, and doesn't oxidize fast.", approved: true, sellerViewed: true, createdAt: subDays(now, 6) },
    { userId: custArjun!._id, productId: pCoffee!._id, orderId: new mongoose.Types.ObjectId(), rating: 5, comment: "Fresh roast date printed on the bag — makes an aromatic morning pour-over.", approved: true, sellerViewed: true, createdAt: subDays(now, 5) },
    { userId: custPriya!._id, productId: pYogaMat!._id, orderId: new mongoose.Types.ObjectId(), rating: 5, comment: "Zero slipping even during hot vinyasa flows.", approved: true, sellerViewed: true, createdAt: subDays(now, 4) },
    { userId: custSneha!._id, productId: pBackpack!._id, orderId: new mongoose.Types.ObjectId(), rating: 4, comment: "Fits my 16-inch laptop and camera cube comfortably.", approved: true, sellerViewed: false, createdAt: subDays(now, 3) },
    { userId: custKabir!._id, productId: pSneakers!._id, orderId: new mongoose.Types.ObjectId(), rating: 4, comment: "Very airy upper, good bounce on treadmill runs.", approved: true, sellerViewed: true, createdAt: subDays(now, 2) },
    { userId: custMeera!._id, productId: pDress!._id, orderId: new mongoose.Types.ObjectId(), rating: 5, comment: "Love the deep pockets and natural indigo shade.", approved: true, sellerViewed: true, createdAt: subDays(now, 2) },
    { userId: custArjun!._id, productId: pPhone!._id, orderId: new mongoose.Types.ObjectId(), rating: 4, comment: "Clean software and super fast 67W charger in the box.", approved: true, sellerViewed: true, createdAt: subDays(now, 1) },
    // 1 unapproved review for admin review moderation
    { userId: custBanned!._id, productId: pEarbuds!._id, orderId: new mongoose.Types.ObjectId(), rating: 1, comment: "Spam link review awaiting moderation removal.", approved: false, sellerViewed: false, createdAt: subDays(now, 1) },
  ];
  await Review.insertMany(reviewsToInsert);

  const reviewedProductIds = [...new Set(reviewsToInsert.map((r) => String(r.productId)))];
  for (const pid of reviewedProductIds) {
    await recomputeProductRating(new mongoose.Types.ObjectId(pid));
  }

  // 22. Wishlists & Carts
  await Wishlist.insertMany([
    { userId: customerDemo._id, productId: pSmartwatch!._id },
    { userId: customerDemo._id, productId: pKeyboard!._id },
    { userId: customerDemo._id, productId: pKurta!._id },
    { userId: customerDemo._id, productId: pYogaMat!._id },
    { userId: customerDemo._id, productId: pCoffee!._id },
    { userId: custAnanya!._id, productId: pEarbuds!._id },
    { userId: custAnanya!._id, productId: pKurta!._id },
    { userId: custAnanya!._id, productId: pLamp!._id },
    { userId: custRohan!._id, productId: pSmartwatch!._id },
    { userId: custRohan!._id, productId: pHeadphones!._id },
    { userId: custPriya!._id, productId: pDress!._id },
    { userId: custPriya!._id, productId: pSerum!._id },
    { userId: custVikram!._id, productId: pEarbuds!._id },
    { userId: custSneha!._id, productId: pYogaMat!._id },
    { userId: custMeera!._id, productId: pPourOver!._id },
  ]);

  await Cart.create({
    userId: customerDemo._id,
    items: [
      { productId: pSpeaker!._id, variantSku: "SPK-BLK", quantity: 1 },
      { productId: pTshirt!._id, variantSku: "TSHIRT-BLK-M", quantity: 2 },
    ],
  });

  // 23. Classifieds (CustomerProduct)
  await CustomerProduct.insertMany([
    { userId: customerDemo._id, title: "Keychron K2 Wireless Mechanical Keyboard (Mint Condition)", slug: "keychron-k2-mechanical-keyboard-used", description: "Barely used for 3 months, includes original box, USB-C braided cable, and Mac/Windows keycaps.", price: 5200, currency: "INR", categoryId: catKeyboards._id, subCategoryId: catComputers._id, subSubCategoryId: catKeyboards._id, brandId: brandVolt!._id, condition: "used", tags: ["keyboard", "keychron", "bengaluru"], images: [IMG.keyboard], thumbnailUrl: IMG.keyboard, location: "Bengaluru", contactPhone: "+919820000001", status: "approved" },
    { userId: customerDemo._id, title: "Acoustic Dreadnought Guitar + Padded Gig Bag", slug: "acoustic-guitar-with-gig-bag", description: "Spruce top acoustic guitar in great condition with fresh phosphor bronze strings.", price: 6800, currency: "INR", categoryId: catSports._id, condition: "used", tags: ["guitar", "music"], images: [IMG.guitar], thumbnailUrl: IMG.guitar, location: "Bengaluru", contactPhone: "+919820000001", status: "pending" },
    { userId: customerDemo._id, title: "Sony Mirrorless Camera Strap & Tripod Bundle", slug: "camera-strap-tripod-bundle", description: "Sold locally to another photographer.", price: 1800, currency: "INR", categoryId: catElectronics._id, condition: "used", tags: ["camera", "tripod"], images: [IMG.camera], thumbnailUrl: IMG.camera, location: "Bengaluru", contactPhone: "+919820000001", status: "sold" },
    { userId: custAnanya!._id, title: "Hybrid City Commuter Bicycle (21-Speed Alloy Frame)", slug: "hybrid-city-commuter-bicycle", description: "700c tires, Shimano Altus drivetrain, disc brakes, recently serviced.", price: 14500, currency: "INR", categoryId: catSports._id, brandId: brandTrail!._id, condition: "used", tags: ["bicycle", "commuter", "mumbai"], images: [IMG.bicycle], thumbnailUrl: IMG.bicycle, location: "Mumbai", contactPhone: "+919820000002", status: "approved" },
    { userId: custAnanya!._id, title: "Ergonomic Mesh Study & WFH Chair (Brand New Sealed)", slug: "ergonomic-mesh-wfh-chair-new", description: "Extra unopened unit from home office setup; adjustable lumbar support and armrests.", price: 7900, currency: "INR", categoryId: catDecor._id, brandId: brandNest!._id, condition: "new", tags: ["chair", "office", "furniture"], images: [IMG.deskChair], thumbnailUrl: IMG.deskChair, location: "Mumbai", contactPhone: "+919820000002", status: "approved" },
    { userId: custRohan!._id, title: "iPad Air Drawing Tablet 64GB + Stylus", slug: "ipad-air-drawing-tablet-used", description: "Zero scratches, paper-like screen protector applied since day one.", price: 32000, currency: "INR", categoryId: catMobiles._id, brandId: brandVolt!._id, condition: "used", tags: ["tablet", "drawing", "pune"], images: [IMG.tablet], thumbnailUrl: IMG.tablet, location: "Pune", contactPhone: "+919820000003", status: "approved" },
    { userId: custPriya!._id, title: "Mirrorless 24MP Vlogging Camera + Prime Lens", slug: "mirrorless-vlogging-camera-delhi", description: "Low shutter count (under 2,500), includes 64GB UHS-II SD card.", price: 38500, currency: "INR", categoryId: catElectronics._id, condition: "used", tags: ["camera", "vlogging", "delhi"], images: [IMG.camera], thumbnailUrl: IMG.camera, location: "New Delhi", contactPhone: "+919820000004", status: "approved" },
    { userId: custVikram!._id, title: "Polarized Aviator Sunglasses (Unopened Gift)", slug: "polarized-aviator-sunglasses-new", description: "Brand new in hard case with cleaning cloth.", price: 1450, currency: "INR", categoryId: catFashion._id, condition: "new", tags: ["sunglasses", "accessories"], images: [IMG.sunglasses], thumbnailUrl: IMG.sunglasses, location: "Hyderabad", contactPhone: "+919820000005", status: "approved" },
    { userId: custSneha!._id, title: "Cotton King-Size Quilt & Bedsheet Set", slug: "cotton-king-size-bedsheet-set", description: "Unused wedding gift, 300 TC pure cotton percale.", price: 2100, currency: "INR", categoryId: catHome._id, condition: "new", tags: ["bedding", "home"], images: [IMG.bedding], thumbnailUrl: IMG.bedding, location: "Chennai", contactPhone: "+919820000006", status: "approved" },
    { userId: custRohan!._id, title: "Studio Condenser Headphones (Awaiting Moderation)", slug: "studio-condenser-headphones-pending", description: "Open-back studio monitoring headphones with coiled cable.", price: 4200, currency: "INR", categoryId: catAudio._id, condition: "used", tags: ["headphones", "studio"], images: [IMG.headphones], thumbnailUrl: IMG.headphones, location: "Pune", contactPhone: "+919820000003", status: "pending" },
  ]);

  // 24. Support Tickets & Conversations
  await Ticket.insertMany([
    {
      userId: customerDemo._id,
      subject: "Need GST invoice copy for corporate reimbursement",
      status: "answered",
      priority: "medium",
      replies: [
        { authorId: customerDemo._id, message: "Hi team, can you confirm whether GST breakdown is included on the PDF invoice for ORD-2026-1001?", createdAt: subDays(now, 15) },
        { authorId: staff2!._id, message: "Hello! Yes — click Download Invoice inside Orders > ORD-2026-1001 to get the full tax-itemized PDF.", createdAt: subDays(now, 14) },
      ],
    },
    {
      userId: customerDemo._id,
      subject: "Pickup hub extended hours on Saturday?",
      status: "open",
      priority: "low",
      replies: [
        { authorId: customerDemo._id, message: "My order ORD-2026-1004 is headed to Indiranagar Express Hub. Can I pick it up after 7 PM on Saturday?", createdAt: subHours(now, 18) },
      ],
    },
    {
      userId: custAnanya!._id,
      subject: "Manual wallet recharge verification",
      status: "open",
      priority: "high",
      replies: [
        { authorId: custAnanya!._id, message: "I uploaded my NEFT transfer proof for ₹5,000 three hours ago. Please review when possible.", createdAt: subHours(now, 2) },
      ],
    },
    {
      userId: custRohan!._id,
      subject: "Exchange size inquiry for cotton t-shirts",
      status: "answered",
      priority: "medium",
      replies: [
        { authorId: custRohan!._id, message: "I opened a refund request on ORD-2026-1008 so I can reorder size M.", createdAt: subDays(now, 1) },
        { authorId: staff1!._id, message: "Got it! Once the seller inspects and approves the return, wallet credit is instant.", createdAt: subHours(now, 12) },
      ],
    },
    {
      userId: custPriya!._id,
      subject: "Refund credited to wallet — thank you!",
      status: "closed",
      priority: "low",
      replies: [
        { authorId: custPriya!._id, message: "Confirming I received the ₹3,049 refund credit in my wallet.", createdAt: subDays(now, 7) },
        { authorId: admin._id, message: "Glad to help! Closing this ticket now.", createdAt: subDays(now, 7) },
      ],
    },
  ]);

  await Conversation.insertMany([
    {
      title: pEarbuds!.name,
      participantIds: [customerDemo._id, sellerDemo!._id],
      productId: pEarbuds!._id,
      lastMessageAt: subHours(now, 4),
      messages: [
        { senderId: customerDemo._id, body: "Hi! Do the Aurora Wireless Earbuds support multipoint connection with two laptops?", readAt: subDays(now, 2), createdAt: subDays(now, 2) },
        { senderId: sellerDemo!._id, body: "Yes! Bluetooth 5.3 multipoint lets you pair a laptop and phone simultaneously and switch seamlessly.", readAt: subDays(now, 2), createdAt: subDays(now, 2) },
        { senderId: customerDemo._id, body: "Awesome, thank you! Also, are extra silicone ear tips included in the box?", createdAt: subHours(now, 4) },
      ],
    },
    {
      title: pTshirt!.name,
      participantIds: [custAnanya!._id, sellerDemo!._id],
      productId: pTshirt!._id,
      lastMessageAt: subHours(now, 9),
      messages: [
        { senderId: custAnanya!._id, body: "Is the Navy Blue color restocking in size L next week?", createdAt: subHours(now, 9) },
      ],
    },
    {
      title: pSmartwatch!.name,
      participantIds: [customerDemo._id, sellerTech!._id],
      productId: pSmartwatch!._id,
      lastMessageAt: subDays(now, 3),
      messages: [
        { senderId: customerDemo._id, body: "Does Chronos use standard 22mm quick-release straps?", readAt: subDays(now, 3), createdAt: subDays(now, 4) },
        { senderId: sellerTech!._id, body: "Yes, any standard 22mm quick-release watch strap fits perfectly.", createdAt: subDays(now, 3) },
      ],
    },
    {
      title: pKurta!.name,
      participantIds: [customerDemo._id, sellerHandloom!._id],
      productId: pKurta!._id,
      lastMessageAt: subDays(now, 6),
      messages: [
        { senderId: customerDemo._id, body: "Should I hand-wash the block print kurta in cold water?", readAt: subDays(now, 6), createdAt: subDays(now, 7) },
        { senderId: sellerHandloom!._id, body: "Yes, gentle cold hand-wash separately for the first wash keeps the natural dye crisp.", readAt: subDays(now, 6), createdAt: subDays(now, 6) },
      ],
    },
    {
      title: pLamp!.name,
      participantIds: [custRohan!._id, staff1!._id],
      productId: pLamp!._id,
      lastMessageAt: subDays(now, 1),
      messages: [
        { senderId: custRohan!._id, body: "What bulb socket does the Nordic Desk Lamp use?", readAt: subDays(now, 1), createdAt: subDays(now, 1) },
        { senderId: staff1!._id, body: "Standard E27 screw base up to 15W LED (9W warm LED included in box).", createdAt: subDays(now, 1) },
      ],
    },
  ]);

  // 25. Homepage, CMS, Policies, Links, Newsletter, Searches, SMS & Audit logs
  await Slider.insertMany([
    { imageUrl: IMG.bannerTech, linkUrl: "/en/products?featured=true", order: 1, active: true },
    { imageUrl: IMG.bannerFashion, linkUrl: "/en/category/fashion", order: 2, active: true },
    { imageUrl: IMG.bannerHome, linkUrl: "/en/flash-deal/monsoon-mega-flash-sale", order: 3, active: true },
  ]);

  await Banner.insertMany([
    { imageUrl: IMG.bannerSale, linkUrl: "/en/flash-deal/monsoon-mega-flash-sale", placement: "home_top", active: true },
    { imageUrl: IMG.bannerTech, linkUrl: "/en/category/electronics", placement: "home_middle", active: true },
    { imageUrl: IMG.bannerFashion, linkUrl: "/en/category/fashion", placement: "home_middle", active: true },
    { imageUrl: IMG.bannerHome, linkUrl: "/en/category/home-kitchen", placement: "category", active: true },
    { imageUrl: IMG.bannerSale, linkUrl: "/en/products?todaysDeal=true", placement: "checkout", active: true },
  ]);

  await HomeCategory.insertMany([
    { categoryId: catElectronics._id, subSubCategoryIds: [catEarbuds._id, catSmartwatches._id, catKeyboards._id], order: 1 },
    { categoryId: catFashion._id, subSubCategoryIds: [catTees._id, catEthnic._id], order: 2 },
    { categoryId: catHome._id, subSubCategoryIds: [], order: 3 },
  ]);

  await Page.insertMany(CMS_PAGES);
  await Policy.insertMany(POLICIES_DATA);
  await Link.insertMany(HEADER_FOOTER_LINKS);
  await Subscriber.insertMany(SUBSCRIBERS_DATA.map((email) => ({ email })));
  await Search.insertMany(
    SEARCH_ANALYTICS.map((s, idx) => ({
      ...s,
      userId: idx % 2 === 0 ? customerDemo._id : null,
      createdAt: subHours(now, idx * 4),
    })),
  );

  await SmsLog.insertMany([
    { sentBy: admin._id, message: "Monsoon Mega Flash Sale is LIVE! Save up to 30% on audio & handlooms.", audience: "customers", recipientCount: 8, provider: "twilio", createdAt: subDays(now, 2) },
    { sentBy: admin._id, message: "Reminder: Verify your shop KYC documents before Friday to unlock featured placement.", audience: "sellers", recipientCount: 5, provider: "twilio", createdAt: subDays(now, 5) },
    { sentBy: staff1!._id, message: "Indiranagar Express Hub is open Sunday 10 AM - 6 PM for weekend collections.", audience: "explicit", recipientCount: 2, provider: "twilio", createdAt: subDays(now, 1) },
  ]);

  await SmsOutbox.insertMany([
    { _id: `sms:${ord1003._id}:placed`, orderId: ord1003._id, kind: "placed", state: "placed", shipmentKey: "all", phone: "+919820000001", message: `Your order ${ord1003.code} has been placed.`, status: "sent", attempts: 1, acceptedAt: subDays(now, 7) },
    { _id: `sms:${ord1003._id}:delivery`, orderId: ord1003._id, kind: "delivery", state: "delivered", shipmentKey: "0", phone: "+919820000001", message: `Your order ${ord1003.code} has been delivered.`, status: "sent", attempts: 1, acceptedAt: subDays(now, 4) },
    { _id: `sms:${ord1004._id}:delivery`, orderId: ord1004._id, kind: "delivery", state: "shipped", shipmentKey: "0", phone: "+919820000001", message: `Your order ${ord1004.code} has shipped.`, status: "sent", attempts: 1, acceptedAt: subDays(now, 2) },
    { _id: `sms:${ord1005._id}:placed`, orderId: ord1005._id, kind: "placed", state: "placed", shipmentKey: "all", phone: "+919820000001", message: `Your order ${ord1005.code} has been placed.`, status: "queued", attempts: 0 },
  ]);

  await AdminAuditLog.insertMany([
    { adminId: admin._id, action: "impersonate", targetUserId: sellerDemo!._id, ip: "127.0.0.1", createdAt: subDays(now, 3) },
    { adminId: admin._id, action: "impersonate", targetUserId: customerDemo._id, ip: "127.0.0.1", createdAt: subDays(now, 1) },
  ]);

  await GatewayIntent.insertMany([
    { purpose: "wallet_recharge", userId: customerDemo._id, refId: null, code: "PAY-SEEDRECH01", grandTotal: 5000, currency: "INR", paymentMethod: "paytm", paymentStatus: "paid", fulfilledAt: subDays(now, 14) },
    { purpose: "seller_package", userId: sellerTech!._id, refId: pkgPro!._id, code: "PAY-SEEDPKG002", grandTotal: 2499, currency: "INR", paymentMethod: "instamojo", paymentStatus: "paid", fulfilledAt: subDays(now, 30) },
  ]);

  logger.info("Comprehensive seed complete.");
  logger.info("Demo logins (password: Password123!):");
  logger.info("  Admin:    admin@example.com");
  logger.info("  Staff:    staff@example.com");
  logger.info("  Seller:   seller@example.com (also aarav.tech@example.com, kaveri.looms@example.com, veda.wellness@example.com)");
  logger.info("  Customer: customer@example.com (also ananya.sharma@example.com, rohan.mehta@example.com, priya.nair@example.com)");

  await disconnectDb();
}

seed().catch((err) => {
  logger.error("Seed failed", err);
  process.exit(1);
});
