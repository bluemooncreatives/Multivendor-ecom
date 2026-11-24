import mongoose, { type Model } from "mongoose";
import { randomUUID } from "node:crypto";
import { LegacyIdMap } from "../../models/LegacyMap.js";
import { User } from "../../models/User.js";
import { Shop } from "../../models/Shop.js";
import { Category, Brand, Attribute, Color } from "../../models/Category.js";
import { Product, FlashDeal } from "../../models/Product.js";
import { CustomerProduct } from "../../models/CustomerProduct.js";
import { Cart } from "../../models/Cart.js";
import { Address, Wishlist, Review } from "../../models/Address.js";
import { Coupon, CouponUsage } from "../../models/Coupon.js";
import { Order } from "../../models/Order.js";
import { Wallet, WalletTransaction } from "../../models/Wallet.js";
import { SellerLedger, SellerWithdrawRequest } from "../../models/Ledger.js";
import { Ticket, Conversation } from "../../models/Support.js";
import { SellerPackage, CustomerPackage } from "../../models/Package.js";
import { AffiliateUser, AffiliateConfig, AffiliatePayment } from "../../models/Affiliate.js";
import { Page, Policy, Slider, Banner, HomeCategory, Link } from "../../models/Content.js";
import { Subscriber, PickupPoint, Search } from "../../models/Marketing.js";
import { BusinessSetting, GeneralSetting, SeoSetting, Addon, ManualPaymentMethod } from "../../models/Settings.js";
import { Language, Currency, Country } from "../../models/Localization.js";
import { Role } from "../../models/Rbac.js";
import { bool, date, jsonArray, jsonObject, num, parseDump, str, uploadUrl, type Row } from "./sql-dump.js";

/**
 * Legacy data import.
 *
 * Reads a mysqldump of the PHP application's database and writes the equivalent
 * documents into this application's collections. Design rules, all of which exist
 * because a half-finished or repeated import is worse than none:
 *
 *  - **Idempotent.** Every legacy row's primary key is recorded in `LegacyIdMap`
 *    against the document created for it, so re-running updates the same documents
 *    instead of duplicating them. An interrupted run can simply be repeated.
 *  - **Ordered.** Tables are imported in dependency order and relations are
 *    resolved through the same map, so a product lands on the right category and
 *    an order on the right customer.
 *  - **Explicit about what it cannot carry.** Every skipped row is counted with a
 *    reason, every unmapped legacy setting key is listed, and the tables that are
 *    deliberately not imported are named in `NOT_IMPORTED`. Nothing is dropped
 *    silently.
 *  - **Non-destructive.** It never deletes or truncates anything. `dryRun` reports
 *    exactly what would be written without writing.
 *
 * It does **not** copy uploaded files. Legacy rows store paths relative to the PHP
 * app's `public/` directory; those paths are rewritten to `uploadsBaseUrl` and the
 * files themselves have to be copied across separately.
 */

export interface ImportOptions {
  /** Contents of the mysqldump file. */
  sql: string;
  dryRun?: boolean;
  /** Import only these legacy tables (dependencies are still resolved from the map). */
  only?: string[];
  /** Prefix applied to legacy upload paths, e.g. "/legacy". */
  uploadsBaseUrl?: string;
  /** Minutes to add to legacy timestamps, when the dump was taken in another zone. */
  tzOffsetMinutes?: number;
  log?: (message: string) => void;
}

export interface TableReport {
  table: string;
  rows: number;
  created: number;
  updated: number;
  skipped: { reason: string; count: number; examples: string[] }[];
}

export interface ImportReport {
  dryRun: boolean;
  tables: TableReport[];
  unmappedSettings: string[];
  notImported: { table: string; rows: number; reason: string }[];
  warnings: string[];
}

/** Tables that intentionally have no counterpart here. */
const NOT_IMPORTED: Record<string, string> = {
  migrations: "Laravel schema history; this application has its own migrations",
  password_resets: "Short-lived reset tokens; users request a new link instead",
  oauth_clients: "Laravel Passport tables; this application issues its own JWTs",
  oauth_access_tokens: "Laravel Passport tables; this application issues its own JWTs",
  oauth_refresh_tokens: "Laravel Passport tables; this application issues its own JWTs",
  oauth_auth_codes: "Laravel Passport tables; this application issues its own JWTs",
  oauth_personal_access_clients: "Laravel Passport tables; this application issues its own JWTs",
  app_settings: "Superseded by general_settings, which is imported",
  customers: "A marker table only (user_id); the user rows themselves are imported",
  staff: "Imported together with users: a staff member's role is set on the user",
  affiliate_options: "Imported into AffiliateConfig.actionBonuses",
  sellers: "Imported together with shops: the seller's package/quota lands on the shop",
  product_stocks: "Imported as embedded product variants",
  flash_deal_products: "Imported as embedded flash-deal campaign lines",
  order_details: "Imported as the per-seller shipments embedded in each order",
  ticket_replies: "Imported as embedded ticket replies",
  messages: "Imported as embedded conversation messages",
};

/** Legacy order_details.delivery_status -> this application's shipment status. */
const DELIVERY_STATUS: Record<string, string> = {
  pending: "pending",
  confirmed: "confirmed",
  on_review: "processing",
  processing: "processing",
  picked_up: "shipped",
  on_the_way: "shipped",
  on_delivery: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
  refunded: "refunded",
};

/** Legacy orders.payment_type -> this application's payment method. */
const PAYMENT_METHOD: Record<string, string> = {
  cash_on_delivery: "cod",
  cod: "cod",
  wallet: "wallet",
  manual_payment: "manual",
  offline_payment: "manual",
  paypal: "paypal",
  stripe: "stripe",
  razorpay: "razorpay",
  sslcommerz: "sslcommerz",
  instamojo: "instamojo",
  paystack: "paystack",
  voguepay: "voguepay",
  payhere: "payhere",
  ngenius: "ngenius",
  paytm: "paytm",
  mpesa: "mpesa",
  flutterwave: "flutterwave",
  twocheckout: "twocheckout",
  "2checkout": "twocheckout",
  payumoney: "manual", // no PayU integration here; recorded as a manual payment
};

const PAYMENT_STATUS: Record<string, string> = { paid: "paid", unpaid: "unpaid", pending: "pending", failed: "failed", refunded: "refunded" };

const POLICY_TYPE: Record<string, string> = {
  terms: "terms",
  privacy: "privacy",
  refund: "refund",
  support_policy: "support",
  return_policy: "return",
  refund_policy: "refund",
  privacy_policy: "privacy",
  terms_condition: "terms",
  terms_conditions: "terms",
  seller_policy: "seller_agreement",
  shipping_policy: "shipping",
};

class Reporter {
  readonly tables: TableReport[] = [];
  readonly warnings: string[] = [];
  private current: TableReport | null = null;

  start(table: string, rows: number) {
    this.current = { table, rows, created: 0, updated: 0, skipped: [] };
    this.tables.push(this.current);
    return this.current;
  }

  skip(reason: string, example: string) {
    if (!this.current) return;
    const bucket = this.current.skipped.find((entry) => entry.reason === reason);
    if (bucket) {
      bucket.count += 1;
      if (bucket.examples.length < 5) bucket.examples.push(example);
    } else {
      this.current.skipped.push({ reason, count: 1, examples: [example] });
    }
  }

  warn(message: string) {
    if (!this.warnings.includes(message)) this.warnings.push(message);
  }

  /** A row whose unique business key was already taken, so it updated that document. */
  private readonly mergedByTable = new Map<string, { count: number; examples: string[] }>();

  merged(table: string, naturalKey: string) {
    const bucket = this.mergedByTable.get(table) ?? { count: 0, examples: [] };
    bucket.count += 1;
    if (bucket.examples.length < 5) bucket.examples.push(naturalKey);
    this.mergedByTable.set(table, bucket);
  }

  /** Called once at the end so a table with 148 duplicates reports one line. */
  summariseMerges() {
    for (const [table, bucket] of this.mergedByTable) {
      this.warn(
        `${table}: ${bucket.count} row(s) shared a unique key with a document that already existed and updated it in place instead of inserting a duplicate (duplicate legacy rows, or data created outside the import). Examples: ${bucket.examples.join(", ")}.`,
      );
    }
  }
}

export async function importLegacyDump(options: ImportOptions): Promise<ImportReport> {
  const log = options.log ?? (() => {});
  const dump = parseDump(options.sql);
  const reporter = new Reporter();
  const dryRun = options.dryRun ?? false;
  const uploads = options.uploadsBaseUrl ?? "";
  const shift = options.tzOffsetMinutes ?? 0;

  const wanted = options.only && options.only.length > 0 ? new Set(options.only) : null;
  /** Legacy business_settings keys with no home in this application's settings. */
  const unmapped = new Set<string>();
  const rowsOf = (table: string) => dump.tables.get(table) ?? [];
  const at = (value: Parameters<typeof date>[0]) => {
    const parsed = date(value);
    return parsed ? new Date(parsed.getTime() + shift * 60_000) : null;
  };

  // --- id mapping ---------------------------------------------------------------

  const cache = new Map<string, mongoose.Types.ObjectId>();
  const key = (table: string, legacyId: unknown) => `${table}:${String(legacyId)}`;

  // Pre-load the map so a re-run resolves relations without a query per row.
  for (const entry of await LegacyIdMap.find().lean()) {
    cache.set(key(entry.table, entry.legacyId), entry.documentId as mongoose.Types.ObjectId);
  }

  const mappedId = (table: string, legacyId: unknown): mongoose.Types.ObjectId | null => {
    if (legacyId === null || legacyId === undefined || legacyId === "") return null;
    return cache.get(key(table, legacyId)) ?? null;
  };

  /**
   * Upserts one legacy row. The document id is stable across runs: either the one
   * recorded earlier, or a fresh id recorded now.
   *
   * `naturalKey` names the unique business key of the collection (an email, a code,
   * a slug). When a document already holds that key - because an earlier legacy row
   * had the same one (the legacy `countries` table, for instance, lists every code
   * twice), or because the row was created outside the import - that document is
   * adopted and updated instead of inserting a duplicate the unique index would
   * reject.
   */
  async function upsert<T>(
    model: Model<T>,
    table: string,
    legacyId: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doc: Record<string, any>,
    report: TableReport,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    naturalKey?: Record<string, any>,
  ): Promise<mongoose.Types.ObjectId> {
    let existing = mappedId(table, legacyId);

    if (!existing && naturalKey) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const holder = await (model as any).findOne(naturalKey, { _id: 1 }).lean();
      if (holder) {
        existing = holder._id as mongoose.Types.ObjectId;
        reporter.merged(table, JSON.stringify(naturalKey));
        if (!dryRun) {
          await LegacyIdMap.updateOne(
            { table, legacyId: String(legacyId) },
            { $set: { documentId: existing, collectionName: model.collection.name } },
            { upsert: true },
          );
        }
        cache.set(key(table, legacyId), existing);
      }
    }

    const documentId = existing ?? new mongoose.Types.ObjectId();

    if (!dryRun) {
      // A key mapped to `undefined` is removed rather than written as null: a
      // sparse unique index (User.referralCode) treats an explicit null as a value,
      // so two accounts without a referral code would collide on it.
      const set = Object.fromEntries(Object.entries(doc).filter(([, value]) => value !== undefined));
      const unset = Object.fromEntries(Object.entries(doc).filter(([, value]) => value === undefined).map(([field]) => [field, ""]));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (model as any).updateOne(
        { _id: documentId },
        Object.keys(unset).length > 0 ? { $set: set, $unset: unset } : { $set: set },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
      if (!existing) {
        await LegacyIdMap.updateOne(
          { table, legacyId: String(legacyId) },
          { $set: { documentId, collectionName: model.collection.name } },
          { upsert: true },
        );
      }
    }

    cache.set(key(table, legacyId), documentId);
    if (existing) report.updated += 1;
    else report.created += 1;
    return documentId;
  }

  const run = async (table: string, importer: (rows: Row[], report: TableReport) => Promise<void>) => {
    if (wanted && !wanted.has(table)) return;
    const rows = rowsOf(table);
    const report = reporter.start(table, rows.length);
    if (rows.length === 0) return;
    log(`${table}: ${rows.length} row(s)`);
    await importer(rows, report);
  };

  // --- localization -------------------------------------------------------------

  await run("languages", async (rows, report) => {
    for (const row of rows) {
      const code = str(row.code);
      if (!code) { reporter.skip("language has no code", String(row.id)); continue; }
      await upsert(Language, "languages", row.id, {
        code,
        name: str(row.name) ?? code,
        rtl: bool(row.rtl),
        active: true,
      }, report, { code });
    }
  });

  // Legacy prices are stored in the store's "system default currency"; its rate is
  // the pivot every other rate was expressed against (see Helpers.php convert_price).
  const settingRows = rowsOf("business_settings");
  const settingValue = (type: string) => {
    const row = settingRows.find((entry) => str(entry.type) === type);
    return row ? str(row.value) : null;
  };
  const defaultCurrencyLegacyId = settingValue("system_default_currency");
  const currencyRows = rowsOf("currencies");
  const defaultCurrencyRow = currencyRows.find((row) => String(row.id) === String(defaultCurrencyLegacyId));
  const pivotRate = defaultCurrencyRow ? num(defaultCurrencyRow.exchange_rate, 1) : 1;
  const defaultCurrencyCode = defaultCurrencyRow ? (str(defaultCurrencyRow.code) ?? "INR") : "INR";

  await run("currencies", async (rows, report) => {
    if (!defaultCurrencyRow) {
      reporter.warn("No system_default_currency setting found; currency rates were imported unchanged relative to the legacy pivot");
    }
    for (const row of rows) {
      const code = str(row.code);
      if (!code) { reporter.skip("currency has no code", String(row.id)); continue; }
      const rate = num(row.exchange_rate, 0);
      if (rate <= 0) { reporter.skip("currency has a zero or negative exchange rate", code); continue; }
      // Legacy codes were free text (this dump's default currency is spelled
      // "Rupee"). The code is carried over verbatim rather than guessed at, since
      // it is what every imported product and order is priced in - but an operator
      // is told, because a non-ISO code is not what a payment gateway expects.
      if (!/^[A-Z]{3}$/.test(code)) {
        reporter.warn(`Currency "${code}" is not a three-letter ISO code. It was imported as-is and is used by every imported price; rename it in Admin > Currencies before taking payments in it.`);
      }
      await upsert(Currency, "currencies", row.id, {
        code,
        name: str(row.name) ?? code,
        symbol: str(row.symbol) ?? code,
        // rateToBase = base-currency units per unit of this currency, where base is
        // the store's default currency, so the default currency comes out at 1.
        rateToBase: Math.round((pivotRate / rate) * 1e6) / 1e6,
        decimals: Number(settingValue("no_of_decimals") ?? 2),
        symbolPosition: settingValue("symbol_format") === "0" ? "after" : "before",
        active: bool(row.status),
      }, report, { code });
    }
  });

  await run("countries", async (rows, report) => {
    for (const row of rows) {
      const code = str(row.code);
      if (!code) { reporter.skip("country has no code", String(row.id)); continue; }
      await upsert(Country, "countries", row.id, {
        code,
        name: str(row.name) ?? code,
        active: bool(row.status),
      }, report, { code });
    }
  });

  // --- settings -----------------------------------------------------------------

  await run("business_settings", async (rows, report) => {
    const value = (type: string) => {
      const row = rows.find((entry) => str(entry.type) === type);
      return row ? str(row.value) : null;
    };
    const flag = (type: string) => value(type) === "1";
    const handled = new Set<string>();
    const take = (type: string) => { handled.add(type); return value(type); };
    const takeFlag = (type: string) => { handled.add(type); return flag(type); };

    const shippingType = take("shipping_type"); // flat_rate | seller_wise_shipping | product_wise_shipping | free_shipping
    const shippingMode =
      shippingType === "product_wise_shipping" ? "product_wise"
      : shippingType === "seller_wise_shipping" ? "seller_wise"
      : shippingType === "free_shipping" ? "free"
      : "flat";

    const business = {
      key: "business",
      commissionPercent: Number(take("vendor_commission") ?? 0),
      shippingMode,
      flatShippingCost: Number(take("flat_rate_shipping_cost") ?? 0),
      adminShippingCost: Number(take("shipping_cost_admin") ?? 0),
      activation: {
        vendorSystem: takeFlag("vendor_system_activation"),
        conversation: takeFlag("conversation_system"),
        couponSystem: takeFlag("coupon_system"),
        walletSystem: takeFlag("wallet_system"),
        pickupPoint: takeFlag("pickup_point"),
        guestCheckout: takeFlag("guest_checkout_active"),
        classifiedProduct: takeFlag("classified_product"),
        maintenanceMode: takeFlag("maintenance_mode"),
        emailVerification: takeFlag("email_verification"),
        categoryBasedCommission: takeFlag("category_wise_commission"),
        cashOnDelivery: takeFlag("cash_payment"),
        reviewSystem: true, // legacy had no switch for reviews
      },
      recaptcha: { enabled: takeFlag("google_recaptcha") },
      socialLogin: {
        google: takeFlag("google_login"),
        facebook: takeFlag("facebook_login"),
        twitter: takeFlag("twitter_login"),
      },
    };
    handled.add("product_activation");
    handled.add("show_vendors");
    handled.add("pos_activation_for_seller");
    handled.add("verification_form");
    handled.add("best_selling");
    handled.add("current_version");
    handled.add("home_default_currency");
    handled.add("system_default_currency");
    handled.add("currency_format");
    handled.add("symbol_format");
    handled.add("no_of_decimals");

    if (!dryRun) await BusinessSetting.updateOne({ key: "business" }, { $set: business }, { upsert: true });
    report.updated += 1;

    const seo = {
      key: "seo",
      metaKeywords: null as string | null,
      googleAnalyticsEnabled: takeFlag("google_analytics"),
      facebookPixelEnabled: takeFlag("facebook_pixel"),
      facebookChatEnabled: takeFlag("facebook_chat"),
    };
    if (!dryRun) await SeoSetting.updateOne({ key: "seo" }, { $set: seo }, { upsert: true });

    // Gateway switches/sandbox flags live in PaymentGateway rows here, which carry
    // credentials this dump does not contain; the keys are reported rather than
    // half-migrated into a gateway that would then fail at runtime.
    for (const row of rows) {
      const type = str(row.type);
      if (type && !handled.has(type)) unmapped.add(type);
    }
  });

  await run("general_settings", async (rows, report) => {
    const row = rows[0];
    if (!row) return;
    await upsert(GeneralSetting, "general_settings", row.id, {
      key: "general",
      appName: str(row.site_name) ?? "Store",
      defaultCurrency: defaultCurrencyCode,
      logoUrl: uploadUrl(row.logo, uploads),
      footerLogoUrl: uploadUrl(row.footer_logo, uploads),
      adminLogoUrl: uploadUrl(row.admin_logo, uploads),
      faviconUrl: uploadUrl(row.favicon, uploads),
      loginBackgroundUrl: uploadUrl(row.admin_login_background, uploads),
      loginSidebarUrl: uploadUrl(row.admin_login_sidebar, uploads),
      themeColor: str(row.frontend_color),
      address: str(row.address),
      footerText: str(row.description),
      supportEmail: str(row.email),
      supportPhone: str(row.phone),
      socialProfiles: {
        facebook: str(row.facebook),
        instagram: str(row.instagram),
        twitter: str(row.twitter),
        youtube: str(row.youtube),
        google: str(row.google_plus),
      },
    }, report);
  });

  await run("seo_settings", async (rows, report) => {
    const row = rows[0];
    if (!row) return;
    if (!dryRun) {
      await SeoSetting.updateOne(
        { key: "seo" },
        {
          $set: {
            metaKeywords: str(row.keyword),
            metaDescription: str(row.description),
            author: str(row.author),
            revisitAfterDays: num(row.revisit, 7),
            sitemapUrl: str(row.sitemap_link),
          },
        },
        { upsert: true },
      );
    }
    report.updated += 1;
  });

  await run("addons", async (rows, report) => {
    // Legacy add-on identifiers map one-to-one onto this application's keys, except
    // where the name differs; an unknown identifier is imported under its own key
    // rather than being dropped, so an operator can see it in the add-on list.
    const KEYS: Record<string, string> = {
      affiliate_system: "affiliate",
      offline_payment: "manual_payment",
      pos_system: "pos",
      refund_request: "refunds",
      seller_subscription: "seller_subscription",
      classified_product: "classified_products",
      club_point: "club_points",
      otp_system: "otp",
    };
    for (const row of rows) {
      const identifier = str(row.unique_identifier);
      if (!identifier) { reporter.skip("add-on has no unique_identifier", String(row.id)); continue; }
      const key = KEYS[identifier];
      // An add-on with no counterpart here (the regional payment-gateway bundles,
      // the delivery-boy module) is reported rather than invented: its features are
      // either built in or absent, and a stray add-on row would switch nothing.
      if (!key) { reporter.skip(`add-on "${identifier}" has no equivalent in this application`, String(row.id)); continue; }
      await upsert(Addon, "addons", row.id, {
        key,
        enabled: bool(row.activated),
      }, report, { key });
    }
  });

  await run("manual_payment_methods", async (rows, report) => {
    for (const row of rows) {
      await upsert(ManualPaymentMethod, "manual_payment_methods", row.id, {
        name: str(row.heading) ?? str(row.type) ?? "Offline payment",
        instructions: str(row.description) ?? "",
        accountDetails: str(row.bank_info) ?? "",
        active: true,
      }, report);
    }
  });

  await run("roles", async (rows, report) => {
    for (const row of rows) {
      const name = str(row.name);
      if (!name) { reporter.skip("role has no name", String(row.id)); continue; }
      // Legacy permissions were numeric ids into a hard-coded list; they cannot be
      // mapped to this application's named permissions, so the role is created
      // without any and an administrator re-grants them.
      await upsert(Role, "roles", row.id, { name, permissions: [] }, report, { name });
      reporter.warn("Staff roles were imported without permissions: the legacy ids are positional and have no named equivalent here. Re-grant them in Admin > Staff > Roles.");
    }
  });

  // --- users --------------------------------------------------------------------

  const staffRows = rowsOf("staff");
  const staffRoleByUser = new Map<string, unknown>(
    staffRows.map((row) => [String(row.user_id), row.role_id]),
  );

  await run("users", async (rows, report) => {
    for (const row of rows) {
      const email = str(row.email)?.toLowerCase();
      if (!email) { reporter.skip("user has no email address", String(row.id)); continue; }
      const type = str(row.user_type) ?? "customer";
      const role = type === "admin" ? "admin" : type === "staff" ? "staff" : type === "seller" ? "seller" : "customer";

      // The legacy password hash is bcrypt ($2y$), which this application verifies
      // directly - imported accounts keep their existing passwords.
      //
      // A legacy account created through social login or OTP has no password at
      // all. Dropping it would drop that customer's addresses, cart, wishlist,
      // orders and conversations with it, so it is imported with a hash that no
      // password can ever match: the account exists, password sign-in is
      // impossible, and the person recovers it through "forgot password" or by
      // signing in with the provider again.
      const legacyHash = str(row.password);
      const passwordHash = legacyHash ?? `legacy-no-password:${randomUUID()}`;
      if (!legacyHash) {
        reporter.warn(
          "Some imported accounts had no password in the legacy system (social or OTP sign-up). They were imported with an unusable password: those customers must use social sign-in or the password-reset link.",
        );
      }

      const userId = await upsert(User, "users", row.id, {
        name: str(row.name) ?? email,
        email,
        phone: str(row.phone),
        passwordHash,
        role,
        avatarUrl: uploadUrl(row.avatar_original ?? row.avatar, uploads),
        banned: bool(row.banned),
        emailVerifiedAt: at(row.email_verified_at),
        provider: str(row.provider_id) ? "google" : "credentials",
        providerId: str(row.provider_id) ?? undefined,
        referralCode: str(row.referral_code) ?? undefined,
        remainingUploads: num(row.remaining_uploads),
        createdAt: at(row.created_at) ?? new Date(),
      }, report, { email });

      if (role === "staff" && staffRoleByUser.has(String(row.id))) {
        // Role-held permissions are re-granted by an administrator (see above), so
        // the staff member starts with none rather than with a wrong set.
        if (!dryRun) await User.updateOne({ _id: userId }, { $set: { permissions: [] } });
      }

      const balance = num(row.balance);
      if (balance !== 0 && !dryRun) {
        await Wallet.updateOne(
          { userId },
          { $set: { balance: Math.max(0, balance), currency: defaultCurrencyCode } },
          { upsert: true },
        );
        // An opening balance, so the wallet statement reconciles with the balance.
        await WalletTransaction.updateOne(
          { idempotencyKey: `legacy:wallet-opening:${row.id}` },
          {
            $set: {
              userId,
              amount: balance,
              balanceAfter: Math.max(0, balance),
              reason: "Balance carried over from the previous system",
              refType: "manual",
            },
          },
          { upsert: true },
        );
      }
      if (balance < 0) {
        reporter.warn(`User ${email} had a negative legacy balance (${balance}); the wallet was opened at 0 and the amount recorded in the statement for reconciliation.`);
      }
    }

    // referred_by is resolved in a second pass: the referrer may appear later.
    for (const row of rows) {
      const referrer = mappedId("users", row.referred_by);
      const self = mappedId("users", row.id);
      if (referrer && self && !dryRun) await User.updateOne({ _id: self }, { $set: { referredBy: referrer } });
    }
  });

  await run("addresses", async (rows, report) => {
    for (const row of rows) {
      const userId = mappedId("users", row.user_id);
      if (!userId) { reporter.skip("address has no imported owner", String(row.id)); continue; }
      const line1 = str(row.address);
      if (!line1) { reporter.skip("address has no street line", String(row.id)); continue; }
      await upsert(Address, "addresses", row.id, {
        userId,
        label: "Address",
        line1,
        // The legacy form had no state field; the city line often carried it.
        city: str(row.city) ?? "-",
        state: str(row.city) ?? "-",
        country: str(row.country) ?? "-",
        postalCode: str(row.postal_code) ?? "-",
        phone: str(row.phone) ?? "-",
        isDefault: bool(row.set_default),
        createdAt: at(row.created_at) ?? new Date(),
      }, report);
    }
  });

  // --- taxonomy -----------------------------------------------------------------

  await run("categories", async (rows, report) => {
    for (const row of rows) {
      const name = str(row.name);
      if (!name) { reporter.skip("category has no name", String(row.id)); continue; }
      await upsert(Category, "categories", row.id, {
        name,
        slug: str(row.slug) ?? `category-${row.id}`,
        parentId: null,
        level: 0,
        ancestors: [],
        iconUrl: uploadUrl(row.icon, uploads),
        bannerUrl: uploadUrl(row.banner, uploads),
        commissionRate: num(row.commision_rate),
        featured: bool(row.featured),
        active: true,
      }, report, { slug: str(row.slug) ?? `category-${row.id}` });
    }
  });

  await run("sub_categories", async (rows, report) => {
    for (const row of rows) {
      const parentId = mappedId("categories", row.category_id);
      if (!parentId) { reporter.skip("sub-category has no imported parent", String(row.id)); continue; }
      await upsert(Category, "sub_categories", row.id, {
        name: str(row.name) ?? `Sub-category ${row.id}`,
        slug: str(row.slug) ?? `sub-category-${row.id}`,
        parentId,
        level: 1,
        ancestors: [parentId],
        active: true,
      }, report, { slug: str(row.slug) ?? `sub-category-${row.id}` });
    }
  });

  await run("sub_sub_categories", async (rows, report) => {
    const subRows = rowsOf("sub_categories");
    for (const row of rows) {
      const parentId = mappedId("sub_categories", row.sub_category_id);
      if (!parentId) { reporter.skip("sub-sub-category has no imported parent", String(row.id)); continue; }
      const parentRow = subRows.find((entry) => String(entry.id) === String(row.sub_category_id));
      const rootId = parentRow ? mappedId("categories", parentRow.category_id) : null;
      await upsert(Category, "sub_sub_categories", row.id, {
        name: str(row.name) ?? `Sub-sub-category ${row.id}`,
        slug: str(row.slug) ?? `sub-sub-category-${row.id}`,
        parentId,
        level: 2,
        ancestors: [rootId, parentId].filter(Boolean),
        active: true,
      }, report, { slug: str(row.slug) ?? `sub-sub-category-${row.id}` });
    }
  });

  await run("brands", async (rows, report) => {
    for (const row of rows) {
      const name = str(row.name);
      if (!name) { reporter.skip("brand has no name", String(row.id)); continue; }
      await upsert(Brand, "brands", row.id, {
        name,
        slug: str(row.slug) ?? `brand-${row.id}`,
        logoUrl: uploadUrl(row.logo, uploads),
        featured: bool(row.top),
        active: true,
      }, report, { slug: str(row.slug) ?? `brand-${row.id}` });
    }
  });

  await run("colors", async (rows, report) => {
    for (const row of rows) {
      const name = str(row.name);
      if (!name) { reporter.skip("colour has no name", String(row.id)); continue; }
      await upsert(Color, "colors", row.id, { name, hex: str(row.code) ?? "#000000", active: true }, report, { name });
    }
  });

  await run("attributes", async (rows, report) => {
    for (const row of rows) {
      const name = str(row.name);
      if (!name) { reporter.skip("attribute has no name", String(row.id)); continue; }
      // Legacy stored an attribute's selectable values on each product, not on the
      // attribute, so the value list starts empty and fills as products import.
      await upsert(Attribute, "attributes", row.id, { name, values: [] }, report, { name });
    }
  });

  // --- shops and sellers --------------------------------------------------------

  const sellerRows = rowsOf("sellers");
  const sellerByUser = new Map<string, Row>(sellerRows.map((row) => [String(row.user_id), row]));

  await run("shops", async (rows, report) => {
    for (const row of rows) {
      const sellerId = mappedId("users", row.user_id);
      if (!sellerId) { reporter.skip("shop has no imported owner", String(row.id)); continue; }
      const seller = sellerByUser.get(String(row.user_id));
      const verification = seller ? num(seller.verification_status) : 0;
      const invalidAt = seller ? at(seller.invalid_at) : null;

      await upsert(Shop, "shops", row.id, {
        sellerId,
        name: str(row.name) ?? `Shop ${row.id}`,
        slug: str(row.slug) ?? `shop-${row.id}`,
        logoUrl: uploadUrl(row.logo, uploads),
        address: str(row.address),
        shippingCost: num(row.shipping_cost),
        socialLinks: {
          facebook: str(row.facebook),
          twitter: str(row.twitter),
          youtube: str(row.youtube),
          google: str(row.google),
        },
        verified: verification === 1,
        verificationStatus: verification === 1 ? "approved" : verification === 2 ? "rejected" : "pending",
        verificationAnswers: seller ? Object.fromEntries(
          jsonArray(seller.verification_info)
            .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
            .map((entry, index) => [String(entry.label ?? index), entry.value ?? null]),
        ) : {},
        sellerPackageId: seller ? mappedId("seller_packages", seller.seller_package_id) : null,
        remainingUploads: seller ? num(seller.remaining_uploads) : 0,
        remainingDigitalUploads: seller ? num(seller.remaining_digital_uploads) : 0,
        packageInvalidAt: invalidAt,
        createdAt: at(row.created_at) ?? new Date(),
      }, report, { sellerId });

      // `sellers.admin_to_pay` is what the platform still owed the vendor. It is
      // carried over as one opening ledger adjustment so the seller's balance in
      // this application matches what they were owed, without inventing per-order
      // history the legacy rows cannot support.
      const owed = seller ? num(seller.admin_to_pay) : 0;
      if (owed !== 0 && !dryRun) {
        await SellerLedger.updateOne(
          { sellerId, type: "adjustment", note: "Balance carried over from the previous system" },
          { $set: { sellerId, type: "adjustment", amount: owed, note: "Balance carried over from the previous system" } },
          { upsert: true },
        );
      }
    }
  });

  await run("seller_packages", async (rows, report) => {
    for (const row of rows) {
      await upsert(SellerPackage, "seller_packages", row.id, {
        name: str(row.name) ?? `Package ${row.id}`,
        price: num(row.amount),
        durationDays: Math.max(1, num(row.duration, 30)),
        productLimit: num(row.product_upload),
        digitalProductLimit: num(row.digital_product_upload),
        logoUrl: uploadUrl(row.logo, uploads),
        active: true,
      }, report);
    }
  });

  await run("customer_packages", async (rows, report) => {
    for (const row of rows) {
      await upsert(CustomerPackage, "customer_packages", row.id, {
        name: str(row.name) ?? `Package ${row.id}`,
        price: num(row.amount),
        // Legacy customer packages never expired; their allowance is a counter.
        durationDays: 3650,
        classifiedListingLimit: num(row.product_upload),
        logoUrl: uploadUrl(row.logo, uploads),
        active: true,
      }, report);
    }
  });

  // --- catalogue ----------------------------------------------------------------

  const stockRows = rowsOf("product_stocks");
  const stocksByProduct = new Map<string, Row[]>();
  for (const row of stockRows) {
    const list = stocksByProduct.get(String(row.product_id)) ?? [];
    list.push(row);
    stocksByProduct.set(String(row.product_id), list);
  }

  /**
   * (legacy product id, legacy variation string) -> variant sku.
   *
   * Derived from the dump rather than from the product importer, so a partial run
   * (`--only orders`) still resolves the SKUs its order lines refer to. The empty
   * variation key is the product's first variant, which is what a legacy
   * non-variant line carried.
   */
  const variantSku = new Map<string, string>();
  const skuFor = (legacyProductId: unknown, variation: string, index: number) => {
    const stocks = stocksByProduct.get(String(legacyProductId)) ?? [];
    const stock = stocks[index];
    return (stock ? str(stock.sku) : null) ?? (variation ? `${String(legacyProductId)}-${variation}` : `${String(legacyProductId)}-default`);
  };
  for (const product of rowsOf("products")) {
    const stocks = stocksByProduct.get(String(product.id)) ?? [];
    if (stocks.length === 0) {
      variantSku.set(`${product.id}|`, str(product.barcode) ?? `${product.id}-default`);
      continue;
    }
    stocks.forEach((stock, index) => {
      const variation = str(stock.variant) ?? "";
      const sku = skuFor(product.id, variation, index);
      variantSku.set(`${product.id}|${variation}`, sku);
      if (index === 0) variantSku.set(`${product.id}|`, sku);
    });
  }

  await run("products", async (rows, report) => {
    for (const row of rows) {
      const name = str(row.name);
      if (!name) { reporter.skip("product has no name", String(row.id)); continue; }
      const categoryId =
        mappedId("sub_sub_categories", row.subsubcategory_id) ??
        mappedId("sub_categories", row.subcategory_id) ??
        mappedId("categories", row.category_id);
      if (!categoryId) { reporter.skip("product has no imported category", name); continue; }

      const addedBy = str(row.added_by) === "admin" ? "admin" : "seller";
      const sellerId = addedBy === "seller" ? mappedId("users", row.user_id) : null;
      if (addedBy === "seller" && !sellerId) { reporter.skip("seller product has no imported seller", name); continue; }

      const unitPrice = num(row.unit_price);
      const stocks = stocksByProduct.get(String(row.id)) ?? [];
      const variants = stocks.length > 0
        ? stocks.map((stock, index) => {
            const variation = str(stock.variant) ?? "";
            const sku = variantSku.get(`${row.id}|${variation}`) ?? skuFor(row.id, variation, index);
            return {
              sku,
              // The legacy variation string is "Colour-Size"; it is kept verbatim as
              // one attribute because the legacy choice_options order is the only
              // thing that said which part was which, and it was not always set.
              attributes: variation ? { variation } : {},
              price: num(stock.price, unitPrice),
              stock: Math.max(0, num(stock.qty)),
              reserved: 0,
            };
          })
        : [{
            sku: variantSku.get(`${row.id}|`) ?? `${row.id}-default`,
            attributes: {},
            price: unitPrice,
            stock: Math.max(0, num(row.current_stock)),
            reserved: 0,
          }];

      const colors = jsonArray(row.colors)
        .map((legacyColorId) => mappedId("colors", legacyColorId))
        .filter(Boolean);

      await upsert(Product, "products", row.id, {
        sellerId,
        addedBy,
        name,
        slug: str(row.slug) ?? `product-${row.id}`,
        categoryId,
        subCategoryId: mappedId("sub_categories", row.subcategory_id),
        subSubCategoryId: mappedId("sub_sub_categories", row.subsubcategory_id),
        brandId: mappedId("brands", row.brand_id),
        description: str(row.description) ?? "",
        images: jsonArray(row.photos).map((photo) => uploadUrl(String(photo), uploads)).filter(Boolean),
        thumbnailUrl: uploadUrl(row.thumbnail_img, uploads),
        basePrice: unitPrice,
        purchasePrice: num(row.purchase_price),
        currency: defaultCurrencyCode,
        unit: str(row.unit) ?? "pc",
        barcode: str(row.barcode),
        discount: num(row.discount),
        discountType: str(row.discount_type) === "amount" ? "flat" : "percent",
        tax: num(row.tax),
        taxType: str(row.tax_type) === "amount" ? "flat" : "percent",
        shippingType: str(row.shipping_type) === "free" ? "free" : "flat_rate",
        shippingCost: num(row.shipping_cost),
        variants,
        colors,
        minOrderQty: Math.max(1, num(row.min_qty, 1)),
        isDigital: bool(row.digital),
        digitalFileUrl: uploadUrl(row.file_path, uploads),
        videoProvider: ["youtube", "dailymotion", "vimeo"].includes(str(row.video_provider) ?? "") ? str(row.video_provider) : null,
        videoLink: str(row.video_link),
        pdfSpecUrl: uploadUrl(row.pdf, uploads),
        metaTitle: str(row.meta_title),
        metaDescription: str(row.meta_description),
        metaImageUrl: uploadUrl(row.meta_img, uploads),
        numOfSale: num(row.num_of_sale),
        published: bool(row.published),
        // Legacy had no moderation queue: a published legacy product is approved.
        approvalStatus: bool(row.published) ? "approved" : "pending",
        featured: bool(row.featured),
        todaysDeal: bool(row.todays_deal),
        tags: jsonArray(row.tags).map(String),
        ratingAverage: num(row.rating),
        createdAt: at(row.created_at) ?? new Date(),
      }, report, { slug: str(row.slug) ?? `product-${row.id}` });
    }
  });

  await run("flash_deals", async (rows, report) => {
    const dealProducts = rowsOf("flash_deal_products");
    for (const row of rows) {
      const lines = dealProducts
        .filter((entry) => String(entry.flash_deal_id) === String(row.id))
        .map((entry) => {
          const productId = mappedId("products", entry.product_id);
          const sku = variantSku.get(`${entry.product_id}|`);
          if (!productId || !sku) return null;
          return {
            productId,
            variantSku: sku,
            discountType: str(entry.discount_type) === "amount" ? "flat" : "percent",
            discount: num(entry.discount),
            // Legacy campaigns had no per-campaign stock cap.
            dealStock: null,
            dealSold: 0,
          };
        })
        .filter(Boolean);

      if (lines.length === 0) { reporter.skip("campaign has no importable products", str(row.title) ?? String(row.id)); continue; }
      if (lines.length !== dealProducts.filter((entry) => String(entry.flash_deal_id) === String(row.id)).length) {
        reporter.warn(`Flash deal "${str(row.title)}" lost campaign lines whose product was not imported.`);
      }

      const startsAt = at(row.start_date) ?? new Date();
      const endsAt = at(row.end_date) ?? new Date(startsAt.getTime() + 86_400_000);
      await upsert(FlashDeal, "flash_deals", row.id, {
        title: str(row.title) ?? `Campaign ${row.id}`,
        slug: str(row.slug) ?? `campaign-${row.id}`,
        bannerUrl: uploadUrl(row.banner, uploads),
        textColor: str(row.text_color),
        backgroundColor: str(row.background_color),
        featured: bool(row.featured),
        startsAt,
        // A campaign whose end precedes its start could never be live; the day is
        // extended so the row survives validation as a finished campaign.
        endsAt: endsAt > startsAt ? endsAt : new Date(startsAt.getTime() + 86_400_000),
        active: bool(row.status),
        products: lines,
      }, report, { slug: str(row.slug) ?? `campaign-${row.id}` });
    }
  });

  await run("coupons", async (rows, report) => {
    for (const row of rows) {
      const code = str(row.code);
      if (!code) { reporter.skip("coupon has no code", String(row.id)); continue; }
      const details = jsonObject(row.details);
      const detailList = jsonArray(row.details);
      const productScope = str(row.type) === "product_base";
      const productIds = productScope
        ? detailList
            .map((entry) => (entry && typeof entry === "object" ? (entry as Record<string, unknown>).product_id : entry))
            .map((legacyProductId) => mappedId("products", legacyProductId))
            .filter(Boolean)
        : [];
      if (productScope && productIds.length === 0) {
        reporter.skip("product coupon has no imported products", code);
        continue;
      }

      await upsert(Coupon, "coupons", row.id, {
        code,
        type: str(row.discount_type) === "amount" ? "flat" : "percent",
        value: num(row.discount),
        scope: productScope ? "product" : "cart",
        productIds,
        minOrderValue: details?.min_buy !== undefined ? Number(details.min_buy) : null,
        maxDiscount: details?.max_discount !== undefined ? Number(details.max_discount) : null,
        startsAt: at(row.start_date),
        expiresAt: at(row.end_date),
        active: true,
      }, report, { code });
    }
  });

  await run("coupon_usages", async (rows, report) => {
    for (const row of rows) {
      const couponId = mappedId("coupons", row.coupon_id);
      const userId = mappedId("users", row.user_id);
      if (!couponId || !userId) { reporter.skip("coupon usage has no imported coupon or user", String(row.id)); continue; }
      // Legacy usage rows carry no order reference, so per-user limits are honoured
      // but the redemption cannot be tied back to the order it discounted.
      await upsert(CouponUsage, "coupon_usages", row.id, {
        couponId,
        userId,
        createdAt: at(row.created_at) ?? new Date(),
      }, report);
    }
  });

  // --- orders -------------------------------------------------------------------

  await run("pickup_points", async (rows, report) => {
    for (const row of rows) {
      await upsert(PickupPoint, "pickup_points", row.id, {
        name: str(row.name) ?? `Pickup point ${row.id}`,
        address: str(row.address) ?? "-",
        city: str(row.address) ?? "-",
        phone: str(row.phone),
        active: bool(row.pick_up_status),
      }, report);
    }
  });


  await run("orders", async (rows, report) => {
    const detailRows = rowsOf("order_details");
    const productRows = rowsOf("products");
    const categoryRateByProduct = new Map<string, number>();
    const categoryRows = rowsOf("categories");
    for (const product of productRows) {
      const category = categoryRows.find((entry) => String(entry.id) === String(product.category_id));
      categoryRateByProduct.set(String(product.id), category ? num(category.commision_rate) : 0);
    }
    const globalCommission = Number(settingValue("vendor_commission") ?? 0);
    const categoryBased = settingValue("category_wise_commission") === "1";

    for (const row of rows) {
      const details = detailRows.filter((entry) => String(entry.order_id) === String(row.id));
      if (details.length === 0) { reporter.skip("order has no order_details rows", String(row.code ?? row.id)); continue; }

      const shipping = jsonObject(row.shipping_address);
      if (!shipping) { reporter.skip("order has no shipping address snapshot", String(row.code ?? row.id)); continue; }

      // One shipment per seller, each holding that seller's lines - the legacy
      // schema had one row per cart line with the seller repeated on each.
      const bySeller = new Map<string, { sellerId: mongoose.Types.ObjectId | null; items: unknown[]; subtotal: number; tax: number; shipping: number; statuses: string[]; pickupPointId: mongoose.Types.ObjectId | null; legacyProductIds: unknown[] }>();
      let dropped = 0;

      for (const detail of details) {
        const productId = mappedId("products", detail.product_id);
        if (!productId) { dropped += 1; continue; }
        const quantity = Math.max(1, num(detail.quantity, 1));
        // Legacy stored the line *total*, not the unit price.
        const lineTotal = num(detail.price);
        const sellerId = mappedId("users", detail.seller_id);
        const bucketKey = sellerId ? String(sellerId) : "__admin__";
        const bucket = bySeller.get(bucketKey) ?? {
          sellerId: sellerId ?? null, items: [], subtotal: 0, tax: 0, shipping: 0, statuses: [], pickupPointId: null, legacyProductIds: [],
        };

        const variation = str(detail.variation) ?? "";
        const sku = variantSku.get(`${detail.product_id}|${variation}`) ?? variantSku.get(`${detail.product_id}|`);
        if (!sku) { dropped += 1; continue; }

        bucket.items.push({
          productId,
          variantSku: sku,
          name: str(productRows.find((p) => String(p.id) === String(detail.product_id))?.name) ?? "Product",
          quantity,
          unitPrice: Math.round((lineTotal / quantity) * 100) / 100,
          listPrice: Math.round((lineTotal / quantity) * 100) / 100,
          refundable: true,
        });
        bucket.subtotal += lineTotal;
        bucket.tax += num(detail.tax);
        bucket.shipping += num(detail.shipping_cost);
        bucket.statuses.push(DELIVERY_STATUS[str(detail.delivery_status) ?? "pending"] ?? "pending");
        bucket.pickupPointId = bucket.pickupPointId ?? mappedId("pickup_points", detail.pickup_point_id);
        bucket.legacyProductIds.push(detail.product_id);
        bySeller.set(bucketKey, bucket);

        if (!DELIVERY_STATUS[str(detail.delivery_status) ?? "pending"]) {
          reporter.warn(`Unknown legacy delivery_status "${String(detail.delivery_status)}" was imported as "pending".`);
        }
      }

      if (bySeller.size === 0) { reporter.skip("no order line could be matched to an imported product", String(row.code ?? row.id)); continue; }
      if (dropped > 0) reporter.warn(`Order ${String(row.code ?? row.id)} lost ${dropped} line(s) whose product or variant was not imported.`);

      const paymentMethodRaw = str(row.payment_type) ?? "cod";
      const paymentMethod = PAYMENT_METHOD[paymentMethodRaw] ?? "manual";
      if (!PAYMENT_METHOD[paymentMethodRaw]) {
        reporter.warn(`Unknown legacy payment_type "${paymentMethodRaw}" was imported as a manual payment.`);
      }
      const paymentStatus = PAYMENT_STATUS[str(row.payment_status) ?? "unpaid"] ?? "unpaid";

      // The order status is the least-advanced of its shipments, which is how the
      // legacy order list rendered an order's overall state.
      // "Least advanced" over the statuses actually present - an order with one
      // pending shipment is not a delivered order.
      const RANK = ["cancelled", "pending", "confirmed", "processing", "shipped", "delivered", "refunded"];
      const leastAdvanced = (statuses: string[]) =>
        statuses.length === 0
          ? "pending"
          : statuses.reduce((lowest, status) => (RANK.indexOf(status) < RANK.indexOf(lowest) ? status : lowest), statuses[0]!);
      const orderStatus = leastAdvanced([...bySeller.values()].flatMap((bucket) => bucket.statuses));

      const orderDetails = [...bySeller.values()].map((bucket) => {
        // Admin-owned lines carry no commission. For a vendor shipment the rate is
        // the category rate of its first line when category-based commission was
        // on, else the global rate - the same precedence commission.service uses.
        const rate = !bucket.sellerId
          ? 0
          : categoryBased
            ? categoryRateByProduct.get(String(bucket.legacyProductIds[0])) ?? globalCommission
            : globalCommission;
        const subtotal = Math.round(bucket.subtotal * 100) / 100;
        const statuses = bucket.statuses;
        return {
          sellerId: bucket.sellerId,
          items: bucket.items,
          subtotal,
          commissionRate: rate,
          commissionAmount: Math.round(((subtotal * rate) / 100) * 100) / 100,
          shippingCost: Math.round(bucket.shipping * 100) / 100,
          pickupPointId: bucket.pickupPointId,
          discount: 0,
          clubPointsSpent: 0,
          status: leastAdvanced(statuses),
        };
      });

      const goods = orderDetails.reduce((sum, detail) => sum + detail.subtotal, 0);
      const tax = Math.round([...bySeller.values()].reduce((sum, bucket) => sum + bucket.tax, 0) * 100) / 100;
      const shippingTotal = orderDetails.reduce((sum, detail) => sum + detail.shippingCost, 0);
      const discount = num(row.coupon_discount);
      const grandTotal = num(row.grand_total, Math.max(0, goods - discount + tax + shippingTotal));

      const consumed = ["delivered", "shipped", "processing", "confirmed"].includes(orderStatus) || paymentStatus === "paid" || paymentMethod === "cod";
      await upsert(Order, "orders", row.id, {
        code: str(row.code) ?? `legacy-${row.id}`,
        userId: mappedId("users", row.user_id),
        guestId: str(row.guest_id),
        addressSnapshot: {
          line1: String(shipping.address ?? "-"),
          city: String(shipping.city ?? "-"),
          state: String(shipping.city ?? "-"),
          country: String(shipping.country ?? "-"),
          postalCode: String(shipping.postal_code ?? "-"),
          phone: String(shipping.phone ?? "-"),
          name: shipping.name ?? null,
          email: shipping.email ?? null,
        },
        details: orderDetails,
        discount,
        couponDiscount: discount,
        tax,
        shippingTotal: Math.round(shippingTotal * 100) / 100,
        grandTotal,
        currency: defaultCurrencyCode,
        paymentMethod,
        paymentStatus,
        status: orderStatus,
        // Legacy decremented stock when the order was placed, so a historical order
        // that reached fulfilment has already consumed its stock; nothing is held.
        inventoryStatus: ["cancelled", "refunded"].includes(orderStatus) ? "released" : consumed ? "confirmed" : "released",
        deliveryViewed: bool(row.delivery_viewed),
        paymentStatusViewed: bool(row.payment_status_viewed),
        idempotencyKey: `legacy:order:${row.id}`,
        createdAt: at(row.created_at) ?? new Date(),
      }, report, { idempotencyKey: `legacy:order:${row.id}` });

      reporter.warn("Imported orders carry a commission recomputed from the current rates: the legacy schema stored no per-order commission, only a per-seller running total (sellers.admin_to_pay), which is imported as one opening ledger adjustment.");
    }
  });

  await run("carts", async (rows, report) => {
    // Legacy carts were one row per line; here a cart is one document per owner.
    const byUser = new Map<string, Row[]>();
    for (const row of rows) {
      const list = byUser.get(String(row.user_id)) ?? [];
      list.push(row);
      byUser.set(String(row.user_id), list);
    }

    for (const [legacyUserId, lines] of byUser) {
      const userId = mappedId("users", legacyUserId);
      if (!userId) { reporter.skip("cart has no imported owner", legacyUserId); continue; }

      const items = lines
        .map((line) => {
          const productId = mappedId("products", line.product_id);
          const variation = str(line.variation) ?? "";
          const sku = variantSku.get(`${line.product_id}|${variation}`) ?? variantSku.get(`${line.product_id}|`);
          if (!productId || !sku) return null;
          return { productId, variantSku: sku, quantity: Math.max(1, num(line.quantity, 1)) };
        })
        .filter(Boolean);
      if (items.length === 0) { reporter.skip("no cart line could be matched to an imported product", legacyUserId); continue; }

      // Keyed on the owner, not a line id: one cart document per user.
      await upsert(Cart, "carts:user", legacyUserId, { userId, items }, report, { userId });
    }
  });

  await run("reviews", async (rows, report) => {
    for (const row of rows) {
      const productId = mappedId("products", row.product_id);
      const userId = mappedId("users", row.user_id);
      if (!productId || !userId) { reporter.skip("review has no imported product or author", String(row.id)); continue; }
      await upsert(Review, "reviews", row.id, {
        productId,
        userId,
        // Legacy reviews were not tied to an order; the link cannot be recovered.
        orderId: null,
        rating: Math.min(5, Math.max(1, num(row.rating, 5))),
        comment: str(row.comment) ?? "",
        approved: bool(row.status),
        createdAt: at(row.created_at) ?? new Date(),
      }, report);
    }

    // Rating aggregates are recomputed from the imported reviews rather than copied
    // from products.rating, which the legacy app updated non-transactionally.
    if (!dryRun) {
      const aggregates = await Review.aggregate([
        { $match: { approved: true } },
        { $group: { _id: "$productId", average: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]);
      for (const group of aggregates) {
        await Product.updateOne(
          { _id: group._id },
          { $set: { ratingAverage: Math.round(group.average * 10) / 10, ratingCount: group.count } },
        );
      }
    }
  });

  await run("wishlists", async (rows, report) => {
    for (const row of rows) {
      const productId = mappedId("products", row.product_id);
      const userId = mappedId("users", row.user_id);
      if (!productId || !userId) { reporter.skip("wishlist entry has no imported product or owner", String(row.id)); continue; }
      await upsert(Wishlist, "wishlists", row.id, { userId, productId, createdAt: at(row.created_at) ?? new Date() }, report);
    }
  });

  await run("customer_products", async (rows, report) => {
    for (const row of rows) {
      const userId = mappedId("users", row.user_id);
      const categoryId =
        mappedId("sub_sub_categories", row.subsubcategory_id) ??
        mappedId("sub_categories", row.subcategory_id) ??
        mappedId("categories", row.category_id);
      if (!userId || !categoryId) { reporter.skip("classified listing has no imported owner or category", String(row.id)); continue; }

      await upsert(CustomerProduct, "customer_products", row.id, {
        userId,
        title: str(row.name) ?? `Listing ${row.id}`,
        slug: str(row.slug) ?? `listing-${row.id}`,
        description: str(row.description) ?? "",
        price: num(row.unit_price),
        currency: defaultCurrencyCode,
        categoryId,
        subCategoryId: mappedId("sub_categories", row.subcategory_id),
        subSubCategoryId: mappedId("sub_sub_categories", row.subsubcategory_id),
        brandId: mappedId("brands", row.brand_id),
        condition: str(row.conditon) === "new" ? "new" : "used",
        unit: str(row.unit) ?? "pc",
        tags: jsonArray(row.tags).map(String),
        images: jsonArray(row.photos).map((photo) => uploadUrl(String(photo), uploads)).filter(Boolean),
        thumbnailUrl: uploadUrl(row.thumbnail_img, uploads),
        videoProvider: ["youtube", "dailymotion", "vimeo"].includes(str(row.video_provider) ?? "") ? str(row.video_provider) : null,
        videoLink: str(row.video_link),
        metaTitle: str(row.meta_title),
        metaDescription: str(row.meta_description),
        metaImageUrl: uploadUrl(row.meta_img, uploads),
        location: str(row.location) ?? "-",
        status: bool(row.published) && bool(row.status) ? "approved" : bool(row.status) ? "pending" : "draft",
        createdAt: at(row.created_at) ?? new Date(),
      }, report, { slug: str(row.slug) ?? `listing-${row.id}` });
    }
  });

  // --- support and messaging ----------------------------------------------------

  await run("tickets", async (rows, report) => {
    const replyRows = rowsOf("ticket_replies");
    for (const row of rows) {
      const userId = mappedId("users", row.user_id);
      if (!userId) { reporter.skip("ticket has no imported author", String(row.id)); continue; }
      const replies = [
        // The legacy ticket body is the first message in the thread here.
        ...(str(row.details) ? [{ authorId: userId, message: str(row.details)!, attachments: jsonArray(row.files).map(String), createdAt: at(row.created_at) ?? new Date() }] : []),
        ...replyRows
          .filter((reply) => String(reply.ticket_id) === String(row.id))
          .map((reply) => {
            const authorId = mappedId("users", reply.user_id);
            if (!authorId) return null;
            return {
              authorId,
              message: str(reply.reply) ?? "",
              attachments: jsonArray(reply.files).map(String),
              createdAt: at(reply.created_at) ?? new Date(),
            };
          })
          .filter(Boolean),
      ];

      await upsert(Ticket, "tickets", row.id, {
        userId,
        subject: str(row.subject) ?? `Ticket ${str(row.code) ?? row.id}`,
        status: str(row.status) === "closed" ? "closed" : replies.length > 1 ? "answered" : "open",
        replies,
        createdAt: at(row.created_at) ?? new Date(),
      }, report);
    }
  });

  await run("conversations", async (rows, report) => {
    const messageRows = rowsOf("messages");
    for (const row of rows) {
      const senderId = mappedId("users", row.sender_id);
      const receiverId = mappedId("users", row.receiver_id);
      if (!senderId || !receiverId) { reporter.skip("conversation has an unimported participant", String(row.id)); continue; }

      const messages = messageRows
        .filter((message) => String(message.conversation_id) === String(row.id))
        .map((message) => {
          const authorId = mappedId("users", message.user_id);
          if (!authorId) return null;
          return { senderId: authorId, body: str(message.message) ?? "", createdAt: at(message.created_at) ?? new Date() };
        })
        .filter(Boolean);

      await upsert(Conversation, "conversations", row.id, {
        participantIds: [senderId, receiverId],
        messages,
        lastMessageAt: at(row.updated_at) ?? at(row.created_at) ?? new Date(),
        createdAt: at(row.created_at) ?? new Date(),
      }, report);
    }
  });

  // --- marketing and content ----------------------------------------------------

  await run("subscribers", async (rows, report) => {
    for (const row of rows) {
      const email = str(row.email)?.toLowerCase();
      if (!email) { reporter.skip("subscriber has no email address", String(row.id)); continue; }
      await upsert(Subscriber, "subscribers", row.id, { email, createdAt: at(row.created_at) ?? new Date() }, report, { email });
    }
  });

  await run("searches", async (rows, report) => {
    for (const row of rows) {
      const query = str(row.query);
      if (!query) { reporter.skip("search row has no query", String(row.id)); continue; }
      // The legacy table kept a count per term; this application records one row per
      // search, so the count is carried as the row's result count for reporting.
      await upsert(Search, "searches", row.id, {
        query,
        resultCount: num(row.count),
        createdAt: at(row.created_at) ?? new Date(),
      }, report);
    }
  });

  await run("sliders", async (rows, report) => {
    for (const row of rows) {
      const imageUrl = uploadUrl(row.photo, uploads);
      if (!imageUrl) { reporter.skip("slider has no image", String(row.id)); continue; }
      await upsert(Slider, "sliders", row.id, {
        imageUrl,
        linkUrl: str(row.link),
        order: num(row.id),
        active: bool(row.published),
      }, report);
    }
  });

  await run("banners", async (rows, report) => {
    const PLACEMENT: Record<string, string> = { "1": "home_top", "2": "home_middle", "3": "category", "4": "checkout" };
    for (const row of rows) {
      const imageUrl = uploadUrl(row.photo, uploads);
      if (!imageUrl) { reporter.skip("banner has no image", String(row.id)); continue; }
      await upsert(Banner, "banners", row.id, {
        imageUrl,
        linkUrl: str(row.url),
        placement: PLACEMENT[String(row.position)] ?? "home_middle",
        active: bool(row.published),
      }, report);
    }
  });

  await run("pages", async (rows, report) => {
    for (const row of rows) {
      const slug = str(row.slug);
      if (!slug) { reporter.skip("page has no slug", String(row.id)); continue; }
      await upsert(Page, "pages", row.id, {
        slug,
        title: str(row.title) ?? slug,
        body: str(row.content) ?? "",
        seoTitle: str(row.meta_title),
        seoDescription: str(row.meta_description),
        seoKeywords: str(row.keywords),
        seoImageUrl: uploadUrl(row.meta_image, uploads),
        published: true,
      }, report, { slug });
    }
  });

  await run("policies", async (rows, report) => {
    for (const row of rows) {
      const name = str(row.name);
      const type = name ? POLICY_TYPE[name] : null;
      if (!type) { reporter.skip(`policy "${String(name)}" has no equivalent policy type`, String(row.id)); continue; }
      await upsert(Policy, "policies", row.id, { type, body: str(row.content) ?? "" }, report, { type });
    }
  });

  await run("links", async (rows, report) => {
    for (const row of rows) {
      const url = str(row.url);
      if (!url) { reporter.skip("link has no URL", String(row.id)); continue; }
      await upsert(Link, "links", row.id, {
        label: str(row.name) ?? url,
        url,
        placement: "footer",
        order: num(row.id),
      }, report);
    }
  });

  await run("home_categories", async (rows, report) => {
    for (const row of rows) {
      const categoryId = mappedId("categories", row.category_id);
      if (!categoryId) { reporter.skip("home category has no imported category", String(row.id)); continue; }
      if (!bool(row.status)) { reporter.skip("home category was disabled", String(row.id)); continue; }
      await upsert(HomeCategory, "home_categories", row.id, { categoryId, order: num(row.id) }, report);
    }
  });

  // --- money --------------------------------------------------------------------

  await run("wallets", async (rows, report) => {
    // Legacy `wallets` rows are recharge records, not balances (the balance lives on
    // users.balance, imported with the user).
    for (const row of rows) {
      const userId = mappedId("users", row.user_id);
      if (!userId) { reporter.skip("wallet recharge has no imported owner", String(row.id)); continue; }
      const amount = num(row.amount);
      if (amount <= 0) { reporter.skip("wallet recharge has no amount", String(row.id)); continue; }
      await upsert(WalletTransaction, "wallets", row.id, {
        userId,
        amount,
        // The running balance was never stored per recharge; the amount is recorded
        // and the balance shown is the one carried over with the user.
        balanceAfter: amount,
        reason: `Recharge via ${str(row.payment_method) ?? "offline payment"} (previous system)`,
        refType: "recharge",
        idempotencyKey: `legacy:wallet-recharge:${row.id}`,
        createdAt: at(row.created_at) ?? new Date(),
      }, report, { idempotencyKey: `legacy:wallet-recharge:${row.id}` });
    }
    reporter.warn("Imported wallet recharges record the amount only: the legacy table stored no running balance, so `balanceAfter` on those statement rows is the recharge amount, not a historical balance.");
  });

  await run("seller_withdraw_requests", async (rows, report) => {
    for (const row of rows) {
      const sellerId = mappedId("users", row.user_id);
      if (!sellerId) { reporter.skip("withdrawal request has no imported seller", String(row.id)); continue; }
      await upsert(SellerWithdrawRequest, "seller_withdraw_requests", row.id, {
        sellerId,
        amount: num(row.amount),
        method: "bank_transfer",
        bankDetails: str(row.message) ?? "",
        status: bool(row.status) ? "paid" : "pending",
        createdAt: at(row.created_at) ?? new Date(),
      }, report);
    }
  });

  await run("payments", async (rows, report) => {
    // Legacy `payments` are payouts the admin made to sellers.
    for (const row of rows) {
      const sellerId = mappedId("users", row.seller_id);
      if (!sellerId) { reporter.skip("payout has no imported seller", String(row.id)); continue; }
      await upsert(SellerLedger, "payments", row.id, {
        sellerId,
        type: "withdrawal",
        amount: -Math.abs(num(row.amount)),
        note: `Paid via ${str(row.payment_method) ?? "manual"}${str(row.txn_code) ? ` (${str(row.txn_code)})` : ""} in the previous system`,
        createdAt: at(row.created_at) ?? new Date(),
      }, report);
    }
  });

  // --- affiliate ----------------------------------------------------------------

  await run("affiliate_users", async (rows, report) => {
    const userRows = rowsOf("users");
    for (const row of rows) {
      const userId = mappedId("users", row.user_id);
      if (!userId) { reporter.skip("affiliate has no imported account", String(row.id)); continue; }
      const userRow = userRows.find((entry) => String(entry.id) === String(row.user_id));
      const referralCode = (userRow ? str(userRow.referral_code) : null) ?? `legacy-${row.id}`;
      await upsert(AffiliateUser, "affiliate_users", row.id, {
        userId,
        referralCode,
        status: bool(row.status) ? "approved" : "pending",
        totalEarnings: num(row.balance),
        availableBalance: num(row.balance),
        paymentSettings: {
          paypalEmail: str(row.paypal_email),
          bankInformation: str(row.bank_information),
        },
        createdAt: at(row.created_at) ?? new Date(),
      }, report, { userId });
    }
  });

  await run("affiliate_configs", async (rows, report) => {
    const options = rowsOf("affiliate_options");
    // actionBonuses is a map of action -> percentage. A legacy option that was
    // switched off contributes a zero bonus rather than vanishing, so an operator
    // can see which actions existed and re-enable one by setting a percentage.
    const bonuses = Object.fromEntries(
      options
        .map((option) => [str(option.type), bool(option.status) ? num(option.percentage) : 0] as const)
        .filter((entry): entry is readonly [string, number] => entry[0] !== null),
    );
    const commission = options.find((option) => str(option.type) === "user_registration_first_purchase");
    if (!dryRun) {
      await AffiliateConfig.updateOne(
        {},
        {
          $set: {
            actionBonuses: bonuses,
            ...(commission ? { enabled: bool(commission.status), commissionPercent: Math.min(100, num(commission.percentage)) } : {}),
          },
        },
        { upsert: true },
      );
    }
    report.updated += 1;
    if (rows.length === 0) reporter.skip("no affiliate configuration rows", "-");
  });

  await run("affiliate_payments", async (rows, report) => {
    for (const row of rows) {
      const affiliateUserId = mappedId("affiliate_users", row.affiliate_user_id);
      if (!affiliateUserId) { reporter.skip("affiliate payment has no imported affiliate", String(row.id)); continue; }
      await upsert(AffiliatePayment, "affiliate_payments", row.id, {
        affiliateUserId,
        amount: num(row.amount),
        note: `Paid via ${str(row.payment_method) ?? "manual"} in the previous system`,
        paidAt: at(row.created_at) ?? new Date(),
        createdAt: at(row.created_at) ?? new Date(),
      }, report);
    }
  });

  // --- report -------------------------------------------------------------------

  reporter.summariseMerges();

  const notImported = Object.entries(NOT_IMPORTED).map(([table, reason]) => ({
    table,
    rows: rowsOf(table).length,
    reason,
  }));

  const covered = new Set([...reporter.tables.map((entry) => entry.table), ...Object.keys(NOT_IMPORTED)]);
  for (const table of dump.tables.keys()) {
    if (!covered.has(table) && !wanted) {
      reporter.warn(`Table "${table}" (${rowsOf(table).length} row(s)) was present in the dump but no importer claims it.`);
    }
  }

  return {
    dryRun,
    tables: reporter.tables,
    unmappedSettings: [...unmapped].sort(),
    notImported,
    warnings: reporter.warnings,
  };
}
