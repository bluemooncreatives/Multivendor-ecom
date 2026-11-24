import type { ClientSession } from "mongoose";
import { BusinessSetting } from "../models/Settings.js";
import { Shop } from "../models/Shop.js";
import { User } from "../models/User.js";

/** Legacy filter_products / verified_sellers_id, with current account bans. */
export async function publicSellerIds(session?: ClientSession) {
  const setting = await BusinessSetting.findOne({ key: "business" }, { activation: 1 }).session(session ?? null);
  if (setting?.activation?.vendorSystem === false) return [];
  const verified = await Shop.find({ verified: true }).distinct("sellerId").session(session ?? null);
  return User.find({ _id: { $in: verified }, role: "seller", banned: false }).distinct("_id").session(session ?? null);
}

export async function publicProductFilter(session?: ClientSession) {
  const sellers = await publicSellerIds(session);
  return { published: true, approvalStatus: "approved", $and: [{ sellerId: { $in: [null, ...sellers] } }] };
}

export const PUBLIC_SHOP_FIELDS = "sellerId name slug logoUrl bannerUrl description address socialLinks verified shippingCost createdAt";
