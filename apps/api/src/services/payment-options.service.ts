import type { ClientSession } from "mongoose";
import type { PaymentMethod } from "@ecommercemultivendor/types";
import { BusinessSetting, Addon, ManualPaymentMethod } from "../models/Settings.js";
import { PaymentGateway } from "../models/PaymentGateway.js";
import { env } from "../config/env.js";
import type { CartOwner } from "./cart.service.js";

export async function checkoutOptions(owner: CartOwner, session?: ClientSession) {
  const settings = await BusinessSetting.findOne({ key: "business" }).session(session ?? null);
  const activation = settings?.activation;
  const methods: PaymentMethod[] = [];
  if (activation?.cashOnDelivery !== false) methods.push("cod");
  if (owner.userId && activation?.walletSystem !== false) methods.push("wallet");
  const manual = await Addon.findOne({ key: "manual_payment", enabled: true }).session(session ?? null);
  if (manual && await ManualPaymentMethod.exists({ active: true }).session(session ?? null)) methods.push("manual");
  if (env.STRIPE_SECRET_KEY) methods.push("stripe");
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) methods.push("razorpay");
  if (env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET) methods.push("paypal");
  const gateways = await PaymentGateway.find({ enabled: true }).select("code").session(session ?? null);
  methods.push(...gateways.map((gateway) => gateway.code as PaymentMethod));
  return {
    paymentMethods: methods,
    guestCheckout: activation?.guestCheckout ?? true,
    coupons: activation?.couponSystem ?? true,
    pickupPoints: activation?.pickupPoint ?? true,
  };
}
