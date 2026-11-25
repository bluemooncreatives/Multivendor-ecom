import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Wallet, WalletTransaction } from "../models/Wallet.js";
import { SellerLedger } from "../models/Ledger.js";
import { BusinessSetting, GeneralSetting } from "../models/Settings.js";
import { calculateCommission } from "./commission.service.js";
import { reserveStock, confirmReservation, type StockLine } from "./inventory.service.js";
import { resolveFlashDeals, reserveDealStock, dealKey, type DealStockLine } from "./flashdeal.service.js";
import { priceLine, ADMIN_BUCKET } from "./shipping.service.js";
import { ApiError } from "../middleware/errorHandler.js";
import { allocateUnits } from "../utils/allocation.js";
import { decorateProductsPricing } from "./pricing.service.js";
import { awardClubPointsForOrder } from "./clubpoints.service.js";
import { creditAffiliateForOrder } from "./affiliate.service.js";
import { logger } from "../config/logger.js";
import { publicProductFilter } from "./catalog-visibility.service.js";

export interface PosSaleLine {
  productId: string;
  variantSku: string;
  quantity: number;
}

/** Walk-in details captured at the counter, when the buyer has no account. */
export interface PosWalkInCustomer {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface PosSaleInput {
  /**
   * The operator's own seller id, used to scope which catalog they may sell from.
   * The seller *credited* for each line comes from the product itself, not this.
   */
  sellerId: string | null;
  /** Who is operating the till — used for the audit trail, not for ownership. */
  operatorId: string;
  /** Admin operators may sell any seller's stock; a seller may only sell their own. */
  allowAnySeller: boolean;
  lines: PosSaleLine[];
  /** Existing account the sale belongs to, if the buyer is a known customer. */
  customerId?: string | null;
  walkIn?: PosWalkInCustomer | null;
  discount?: number;
  shippingCost?: number;
  paymentType?: "cash" | "card" | "wallet" | "manual";
  idempotencyKey?: string;
}

/**
 * An in-person sale settles instantly (cash/card handled at the counter), so it
 * skips the cart/address/coupon flow entirely but reuses the same
 * reserve->confirm stock path and commission service as online checkout.
 *
 * The first version hardcoded a placeholder address and never set userId or
 * guestId, so a POS order could not be attributed to anyone and never appeared
 * in the buyer's order history. Both are captured here.
 */
export async function createPosSale(input: PosSaleInput) {
  const order = await processPosSale(input, false);
  try {
    await awardClubPointsForOrder(String(order._id));
    await creditAffiliateForOrder(String(order._id));
  } catch (error) {
    logger.error(`Failed to award POS rewards for ${order._id}: ${String(error)}`);
  }
  return order;
}

export interface PosQuote {
  subtotal: number; tax: number; discount: number; shippingCost: number; grandTotal: number; currency: string;
  items: { productId: string; variantSku: string; unitPrice: number; quantity: number }[];
}

export async function quotePosSale(input: PosSaleInput): Promise<PosQuote> {
  return processPosSale(input, true);
}

async function processPosSale(input: PosSaleInput, quoteOnly: boolean) {
  for (const amount of [input.discount ?? 0, input.shippingCost ?? 0]) {
    if (!Number.isFinite(amount) || amount < 0) throw new ApiError(400, "Amounts must be non-negative finite numbers");
  }
  const merged = new Map<string, PosSaleLine>();
  for (const line of input.lines) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) throw new ApiError(400, "Quantity must be a positive integer");
    const key = `${line.productId}:${line.variantSku}`;
    const previous = merged.get(key);
    merged.set(key, { ...line, quantity: line.quantity + (previous?.quantity ?? 0) });
  }
  input = { ...input, lines: [...merged.values()] };
  const key = `pos:${input.operatorId}:${input.idempotencyKey ?? randomUUID()}`;
  const replay = quoteOnly ? null : await Order.findOne({ idempotencyKey: key });
  if (replay) return replay;
  if (input.lines.length === 0) throw new ApiError(400, "At least one item is required");
  if (!quoteOnly && !input.customerId && !input.walkIn) {
    throw new ApiError(400, "Record the customer, or their name and phone for a walk-in");
  }

  const customer = input.customerId ? await User.findOne({ _id: input.customerId, banned: false }) : null;
  if (input.customerId && !customer) throw new ApiError(404, "Customer not found");

  const session = await mongoose.startSession();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let createdOrder: any;

    await session.withTransaction(async () => {
      const existing = await Order.findOne({ idempotencyKey: key }).session(session);
      if (existing) { createdOrder = existing; return; }
      const orderId = new mongoose.Types.ObjectId();
      const settings = await BusinessSetting.findOne({ key: "business" }).session(session);
      const storeTaxPercent = settings?.taxPercent ?? 0;
      const general = await GeneralSetting.findOne({ key: "general" }).session(session);
      const currency = general?.defaultCurrency ?? "INR";
      if (input.paymentType === "wallet" && settings?.activation?.walletSystem === false) throw new ApiError(403, "Wallet payments are disabled");

      // Grouped by the product's own seller, exactly like online checkout: an
      // admin till selling two vendors' goods produces one order with a shipment
      // (and ledger credit) per vendor, rather than crediting nobody.
      const bySeller = new Map<
        string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { sellerId: string | null; items: any[]; subtotal: number; commission: number }
      >();
      const stockLines: StockLine[] = [];
      const dealLines: DealStockLine[] = [];
      let subtotal = 0;
      let tax = 0;

      // The legacy counter (`PosController@addToCart`) priced a till line through
      // the same flash-deal scan as the storefront, so a campaign applies here too.
      const flashDeals = await resolveFlashDeals(
        input.lines.map((line) => ({ productId: String(line.productId), variantSku: line.variantSku })),
        { session },
      );

      const visibility = await publicProductFilter(session);
      for (const line of input.lines) {
        if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) throw new ApiError(400, "Quantity must be a positive integer");
        // A seller operator is scoped to their own catalog; an admin operator may
        // ring up anything, which is what the legacy admin POS did.
        const filter = input.allowAnySeller
          ? { _id: line.productId }
          : { _id: line.productId, sellerId: input.sellerId };

        const product = await Product.findOne({ ...visibility, ...filter }).session(session);
        if (!product || !product.published || product.approvalStatus !== "approved") throw new ApiError(404, "Product not found in this catalog");
        if (product.currency !== currency) throw new ApiError(409, "Product currency differs from the store currency");
        if (line.quantity < (product.minOrderQty ?? 1)) throw new ApiError(400, `Minimum quantity for ${product.name} is ${product.minOrderQty ?? 1}`);

        const variant = product.variants.find((v) => v.sku === line.variantSku);
        if (!variant) throw new ApiError(404, `No variant "${line.variantSku}" on ${product.name}`);
        if (variant.stock - variant.reserved < line.quantity) throw new ApiError(409, `Insufficient stock for ${product.name}`);

        const flashDeal = flashDeals.get(dealKey(String(product._id), variant.sku)) ?? null;
        const priced = priceLine({
          unitPrice: variant.price,
          quantity: line.quantity,
          discount: product.discount ?? 0,
          discountType: (product.discountType ?? "percent") as "flat" | "percent",
          flashDiscount: flashDeal
            ? { discount: flashDeal.discount, discountType: flashDeal.discountType }
            : null,
          tax: product.tax ?? null,
          taxType: (product.taxType ?? "percent") as "flat" | "percent",
          storeTaxPercent,
        });

        const lineSellerId = product.sellerId ? String(product.sellerId) : null;
        const key = lineSellerId ?? ADMIN_BUCKET;
        const bucket =
          bySeller.get(key) ?? { sellerId: lineSellerId, items: [], subtotal: 0, commission: 0 };

        bucket.items.push({
          productId: product._id,
          variantSku: variant.sku,
          name: product.name,
          attributes: variant.attributes,
          quantity: line.quantity,
          unitPrice: priced.unitPrice,
          listPrice: variant.price,
          flashDealId: flashDeal ? flashDeal.dealId : null,
          imageUrl: variant.imageUrl ?? product.images[0],
          refundable: product.refundable,
          clubPoints: product.clubPoints ?? 0,
        });
        bucket.subtotal += priced.lineSubtotal;
        bucket.commission += (await calculateCommission(lineSellerId, priced.lineSubtotal, String(product.categoryId), session)).amount;
        bySeller.set(key, bucket);

        subtotal += priced.lineSubtotal;
        tax += priced.lineTax;

        stockLines.push({ productId: String(product._id), variantSku: variant.sku, quantity: line.quantity });
        if (flashDeal) {
          dealLines.push({
            dealId: flashDeal.dealId,
            productId: String(product._id),
            variantSku: variant.sku,
            quantity: line.quantity,
          });
        }
      }


      subtotal = round2(subtotal);
      tax = round2(tax);

      // A counter discount cannot exceed the goods value, or the order total
      // would go negative once tax and shipping are added back.
      const discount = Math.min(round2(input.discount ?? 0), subtotal);
      const shippingCost = round2(input.shippingCost ?? 0);
      const grandTotal = round2(Math.max(0, subtotal - discount + tax + shippingCost));
      if (quoteOnly) {
        createdOrder = { subtotal, tax, discount, shippingCost, grandTotal, currency,
          items: [...bySeller.values()].flatMap((bucket) => bucket.items.map((item) => ({
            productId: String(item.productId), variantSku: item.variantSku, unitPrice: item.unitPrice, quantity: item.quantity,
          }))) };
        return;
      }
      await reserveStock(stockLines, String(orderId), session);
      await reserveDealStock(dealLines, session);
      // confirmReservation advances numOfSale (units sold) atomically with the
      // stock decrement, so no separate best-seller increment is needed here.
      await confirmReservation(stockLines, String(orderId), session);

      if (input.paymentType === "wallet") {
        if (!customer) throw new ApiError(400, "Wallet payment requires a registered customer");
        const wallet = await Wallet.findOneAndUpdate(
          { userId: customer._id, currency, balance: { $gte: grandTotal } },
          { $inc: { balance: -grandTotal } }, { session, new: true },
        );
        if (!wallet) throw new ApiError(402, "Insufficient wallet balance");
        await WalletTransaction.create([{
          userId: customer._id, amount: -grandTotal, balanceAfter: wallet.balance,
          reason: "POS order payment", refType: "order", refId: orderId, idempotencyKey: `order:${orderId}:wallet-debit`,
        }], { session });
      }

      // Delivery is charged once for the whole sale, so it lands on the first
      // shipment rather than being duplicated across every vendor.
      const details = [];
      let shippingApplied = false;

      const discountShares = allocateUnits(Math.round(discount * 100), [...bySeller.values()].map((bucket) => bucket.subtotal));
      let bucketIndex = 0;
      const taxShares = allocateUnits(Math.round(tax * 100), [...bySeller.values()].map((bucket) => bucket.subtotal));
      for (const bucket of bySeller.values()) {
        const amount = round2(bucket.commission);
        const rate = bucket.subtotal > 0 ? round2(amount * 100 / bucket.subtotal) : 0;

        details.push({
          sellerId: bucket.sellerId,
          items: bucket.items,
          subtotal: round2(bucket.subtotal),
          discount: discountShares[bucketIndex]! / 100,
          tax: taxShares[bucketIndex++]! / 100,
          commissionRate: rate,
          commissionAmount: amount,
          shippingCost: shippingApplied ? 0 : shippingCost,
          status: "delivered", // handed over at the counter
          deliveredAt: new Date(),
        });
        shippingApplied = true;

        if (bucket.sellerId) {
          await SellerLedger.create(
            [
              { sellerId: bucket.sellerId, orderId, type: "sale", amount: bucket.subtotal, note: "POS sale" },
              {
                sellerId: bucket.sellerId,
                orderId,
                type: "commission",
                amount: -amount,
                note: "Platform commission (POS)",
              },
            ],
            { session, ordered: true },
          );
        }
      }

      const walkIn = input.walkIn;
      const addressSnapshot = customer
        ? { line1: "In-store purchase", city: "-", state: "-", country: "-", postalCode: "-", phone: customer.phone ?? "-" }
        : {
            line1: walkIn?.address || "In-store purchase",
            city: walkIn?.city || "-",
            state: "-",
            country: walkIn?.country || "-",
            postalCode: walkIn?.postalCode || "-",
            phone: walkIn?.phone || "-",
            name: walkIn?.name,
            email: walkIn?.email,
          };

      const [order] = await Order.create(
        [
          {
            _id: orderId,
            code: `POS-${orderId.toHexString()}`,
            userId: customer?._id ?? null,
            // Walk-ins get a stable guest id so the sale is still attributable,
            // and so a receipt lookup has something to match on.
            guestId: customer ? null : `pos:${walkIn!.phone}`,
            addressSnapshot,
            details,
            discount,
            couponDiscount: discount,
            tax,
            shippingTotal: shippingCost,
            grandTotal,
            currency,
            // Cash and card at the counter are both settled outside the app, so
            // they record as manual; wallet is the one that moves money here.
            paymentMethod: input.paymentType === "wallet" ? "wallet" : "manual",
            paymentStatus: "paid",
            inventoryStatus: "confirmed",
            status: "delivered",
            idempotencyKey: key,
          },
        ],
        { session },
      );

      createdOrder = order;
    });

    return createdOrder;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      const existing = await Order.findOne({ idempotencyKey: key });
      if (existing) return existing;
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

/** Counter lookup by name or scanned barcode. */
export async function searchPosProducts(query: string, sellerId: string | null, allowAnySeller: boolean) {
  const term = query.trim().slice(0, 80);
  if (!term) return [];

  const scope = { ...await publicProductFilter(), ...(allowAnySeller ? {} : { sellerId }) };
  const literal = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // An exact barcode match short-circuits: a scan should return one product, not
  // a list the operator has to pick from.
  const scanned = await Product.findOne({ ...scope, barcode: term, published: true });
  if (scanned) return decorateProductsPricing([scanned]);

  const products = await Product.find({
    ...scope,
    published: true,
    $or: [{ name: { $regex: literal, $options: "i" } }, { "variants.sku": { $regex: literal, $options: "i" } }],
  }).limit(20);
  return decorateProductsPricing(products);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
