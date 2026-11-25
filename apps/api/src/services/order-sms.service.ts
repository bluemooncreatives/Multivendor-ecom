import { randomUUID } from "node:crypto";
import type { ClientSession } from "mongoose";
import type { Order } from "../models/Order.js";
import { OtpSetting, Addon } from "../models/Settings.js";
import { SmsOutbox } from "../models/SmsOutbox.js";
import { getSmsSender } from "./sms.service.js";
import { logger } from "../config/logger.js";

type Kind = "placed" | "delivery" | "payment";
const flags = { placed: "otpOnOrderPlacement", delivery: "smsOnDeliveryStatus", payment: "smsOnPaymentStatus" } as const;

/** Queue alongside the order write when a transaction is provided; never send inside it. */
export async function queueOrderSms(order: InstanceType<typeof Order>, kind: Kind, session?: ClientSession, detailIndex?: number) {
  const phone = String((order.addressSnapshot as { phone?: unknown } | null)?.phone ?? "");
  if (!phone) return;
  const settings = await OtpSetting.findOne({ key: "otp" }).session(session ?? null);
  if (!settings?.[flags[kind]] || settings.provider === "none") return;
  const addon = await Addon.findOne({ key: "otp", enabled: true }).session(session ?? null);
  if (!addon) return;
  const detail = detailIndex === undefined ? undefined : order.details[detailIndex];
  if (kind === "delivery" && !detail) throw new Error("A shipment is required for a delivery notification");
  const state = kind === "payment" ? order.paymentStatus : kind === "delivery" ? detail!.status : "placed";
  const shipment = detail ? String(detail.sellerId ?? "in-house") : "all";
  const message = kind === "placed" ? `Your order ${order.code} has been placed.`
    : kind === "payment" ? `Payment status for order ${order.code}: ${state}.`
    : `The shipment containing ${String(detail!.items[0]?.name ?? "your items").slice(0, 150)} for order ${order.code} is ${state}.`;
  await SmsOutbox.updateOne({ _id: `${order._id}:${kind}:${shipment}:${state}` }, { $setOnInsert: {
    orderId: order._id, kind, state, shipmentKey: shipment, phone, message, status: "queued", attempts: 0, nextAttemptAt: new Date(), leaseUntil: new Date(0),
  } }, { upsert: true, session });
}

/** A bounded batch with expiring per-message leases; provider acceptance is not a delivery receipt. */
export async function processOrderSmsQueue(limit = 20) {
  const result = { accepted: 0, failed: 0, cancelled: 0 };
  let remaining = Math.max(0, Math.min(100, Math.floor(limit)));
  if (!remaining) return result;
  // A process can die after claiming its last attempt. Such a row cannot be
  // claimed again; leave an explicit uncertain/failed record instead of an
  // immortal "sending" state.
  await SmsOutbox.updateMany({ status: { $in: ["queued", "sending"] }, attempts: { $gte: 5 }, leaseUntil: { $lte: new Date() } },
    { $set: { status: "failed", owner: null, leaseUntil: new Date(0), lastError: "The worker stopped after its final attempt; delivery is uncertain" } });
  await Promise.all(Array.from({ length: Math.min(4, remaining) }, async () => {
    while (remaining > 0) {
      remaining -= 1;
      const owner = randomUUID();
      const now = new Date();
      const item = await SmsOutbox.findOneAndUpdate({ status: { $in: ["queued", "sending"] },
        nextAttemptAt: { $lte: now }, leaseUntil: { $lte: now }, attempts: { $lt: 5 },
      }, { $set: { owner, status: "sending", leaseUntil: new Date(now.getTime() + 60000) }, $inc: { attempts: 1 } },
      { new: true, sort: { createdAt: 1, _id: 1 } });
      if (!item) return;
      const finish = (fields: Record<string, unknown>) => SmsOutbox.updateOne({ _id: item._id, owner },
        { $set: { ...fields, owner: null, leaseUntil: new Date(0) } });
      try {
        const [settings, addon] = await Promise.all([OtpSetting.findOne({ key: "otp" }), Addon.findOne({ key: "otp" })]);
        if (!addon?.enabled || settings?.provider === "none" || !settings?.[flags[item.kind as Kind]]) {
          await finish({ status: "cancelled", lastError: "Order SMS notification was disabled before sending" });
          result.cancelled += 1;
          continue;
        }
        const { Order } = await import("../models/Order.js");
        const current = await Order.findById(item.orderId).select("status paymentStatus details.sellerId details.status");
        const state = item.state ?? item._id.split(":").at(-1);
        const detail = current?.details.find((shipment) => String(shipment.sellerId ?? "in-house") === item.shipmentKey);
        const obsolete = !current || (item.kind === "placed" && !["pending", "confirmed"].includes(current.status)) ||
          (item.kind === "payment" && current.paymentStatus !== state) || (item.kind === "delivery" && detail?.status !== state);
        if (obsolete) {
          await finish({ status: "cancelled", lastError: "A newer order state superseded this notification" });
          result.cancelled += 1;
          continue;
        }
        await (await getSmsSender())(item.phone, item.message);
        await finish({ status: "sent", acceptedAt: new Date(), lastError: null });
        result.accepted += 1;
      } catch (error) {
        const permanent = (error as { status?: number }).status === 422;
        await finish({ status: permanent || item.attempts >= 5 ? "failed" : "queued",
          nextAttemptAt: new Date(Date.now() + Math.min(3600000, 60000 * 2 ** (item.attempts - 1))),
          lastError: permanent ? "The recipient phone number is invalid for this provider" : "The SMS provider did not accept the message",
        });
        result.failed += 1;
      }
    }
  }));
  return result;
}

export function startOrderSmsWorker() {
  let stopped = false;
  let running: Promise<unknown> | null = null;
  const tick = () => {
    if (stopped || running) return;
    running = processOrderSmsQueue().catch(() => logger.error("Order SMS worker failed; queued messages remain retryable"))
      .finally(() => { running = null; });
  };
  const timer = setInterval(tick, 5000);
  timer.unref();
  tick();
  return async () => { stopped = true; clearInterval(timer); await running; };
}
