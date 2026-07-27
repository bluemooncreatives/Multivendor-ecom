import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { connectMongo, objectId } from "@/lib/mongodb";
import { AddressModel, ApiTokenModel, ConversationModel, OrderModel, ProductModel, ReviewModel, SellerLedgerModel, ShopModel, TicketModel, User, WithdrawRequestModel } from "@/models";

export const runtime = "nodejs";
type OrderItemRecord = { _id: unknown; seller: unknown; product: unknown; variation?: string; quantity: number; deliveryStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned" };

async function account() {
  const session = await getSession();
  const userId = session ? objectId(session.id) : null;
  return session && userId ? { session, userId } : null;
}

function unauthorized() { return NextResponse.json({ message: "Unauthorized" }, { status: 401 }); }
function invalid(error: unknown) { return NextResponse.json({ message: error instanceof z.ZodError ? error.issues[0]?.message || "Invalid request" : "The request could not be completed." }, { status: error instanceof z.ZodError ? 400 : 500 }); }

export async function GET(_request: Request, { params }: { params: Promise<{ resource: string[] }> }) {
  const auth = await account(); if (!auth) return unauthorized();
  const { resource } = await params; const route = resource.join("/");
  await connectMongo();
  if (route === "profile") { const user = await User.findById(auth.userId).select("name email phone avatar role emailVerifiedAt").lean(); return NextResponse.json({ data: user }); }
  if (route === "addresses") return NextResponse.json({ data: await AddressModel.find({ user: auth.userId }).sort({ isDefault: -1, createdAt: -1 }).lean() });
  if (route === "tickets") return NextResponse.json({ data: await TicketModel.find({ user: auth.userId }).sort({ updatedAt: -1 }).lean() });
  if (route === "conversations") return NextResponse.json({ data: await ConversationModel.find({ participants: auth.userId }).sort({ updatedAt: -1 }).lean() });
  if (route === "orders") {
    const filter = auth.session.role === "admin" || auth.session.role === "staff" ? {} : auth.session.role === "seller" ? { "items.seller": auth.userId } : { customer: auth.userId };
    const orders = await OrderModel.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    const data = auth.session.role === "seller" ? orders.map((order) => ({ ...order, items: order.items.filter((item: OrderItemRecord) => String(item.seller) === String(auth.userId)) })) : orders;
    return NextResponse.json({ data });
  }
  if (route === "withdrawals") { const filter = auth.session.role === "admin" || auth.session.role === "staff" ? {} : { seller: auth.userId }; return NextResponse.json({ data: await WithdrawRequestModel.find(filter).sort({ createdAt: -1 }).lean() }); }
  return NextResponse.json({ message: "Unknown account resource" }, { status: 404 });
}

export async function POST(request: Request, { params }: { params: Promise<{ resource: string[] }> }) {
  const auth = await account(); if (!auth) return unauthorized();
  const { resource } = await params; const route = resource.join("/");
  try {
    await connectMongo();
    if (route === "addresses") {
      const body = z.object({ label: z.string().trim().max(50).optional(), recipient: z.string().trim().max(120).optional(), address: z.string().trim().min(3).max(500), country: z.string().trim().min(2).max(120), state: z.string().trim().max(120).optional(), city: z.string().trim().min(2).max(120), postalCode: z.string().trim().min(3).max(20), phone: z.string().trim().min(5).max(30), isDefault: z.coerce.boolean().optional() }).parse(await request.json());
      if (await AddressModel.countDocuments({ user: auth.userId }) >= 20) return NextResponse.json({ message: "Address limit reached." }, { status: 409 });
      const shouldDefault = body.isDefault || !await AddressModel.exists({ user: auth.userId });
      if (shouldDefault) await AddressModel.updateMany({ user: auth.userId }, { $set: { isDefault: false } });
      const address = await AddressModel.create({ ...body, user: auth.userId, isDefault: shouldDefault });
      return NextResponse.json({ data: address }, { status: 201 });
    }
    if (route === "tickets") {
      const body = z.object({ subject: z.string().trim().min(3).max(240), message: z.string().trim().min(3).max(5000) }).parse(await request.json());
      const ticket = await TicketModel.create({ code: `TKT-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`, user: auth.userId, subject: body.subject, status: "open", messages: [{ author: auth.userId, message: body.message }] });
      return NextResponse.json({ data: ticket }, { status: 201 });
    }
    if (route === "conversations") {
      const body = z.object({ receiverId: z.string(), title: z.string().trim().min(2).max(240), message: z.string().trim().min(1).max(5000) }).parse(await request.json());
      const receiver = objectId(body.receiverId);
      if (!receiver || String(receiver) === String(auth.userId) || !await User.exists({ _id: receiver, status: "active" })) return NextResponse.json({ message: "Recipient is unavailable." }, { status: 404 });
      const conversation = await ConversationModel.create({ participants: [auth.userId, receiver], title: body.title, messages: [{ sender: auth.userId, body: body.message, readBy: [auth.userId] }] });
      return NextResponse.json({ data: conversation }, { status: 201 });
    }
    if (route === "orders/review") {
      const body = z.object({ orderId: z.string(), productId: z.string(), rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().max(2000).optional() }).parse(await request.json());
      const orderId = objectId(body.orderId); const productId = objectId(body.productId);
      if (!orderId || !productId) return NextResponse.json({ message: "Invalid order or product." }, { status: 400 });
      const order = await OrderModel.findOne({ _id: orderId, customer: auth.userId, items: { $elemMatch: { product: productId, paymentStatus: "paid", deliveryStatus: "delivered" } } }).select("_id").lean();
      if (!order) return NextResponse.json({ message: "Reviews are available after this paid item is delivered." }, { status: 409 });
      const review = await ReviewModel.findOneAndUpdate({ user: auth.userId, product: productId }, { $set: { order: orderId, rating: body.rating, comment: body.comment, published: true } }, { upsert: true, new: true, runValidators: true });
      const summary = await ReviewModel.aggregate<{ average: number; count: number }>([{ $match: { product: productId, published: true } }, { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }]);
      await ProductModel.updateOne({ _id: productId }, { $set: { rating: Math.round((summary[0]?.average || 0) * 10) / 10 } });
      return NextResponse.json({ data: review }, { status: 201 });
    }
    if (route === "withdrawals") {
      if (auth.session.role !== "seller") return NextResponse.json({ message: "Only sellers can request a withdrawal." }, { status: 403 });
      const body = z.object({ amount: z.coerce.number().min(1).max(10_000_000), message: z.string().trim().max(2000).optional() }).parse(await request.json());
      const shop = await ShopModel.findOne({ owner: auth.userId, active: true }).select("adminToPay").lean(); if (!shop) return NextResponse.json({ message: "Seller shop not found." }, { status: 404 });
      const pending = await WithdrawRequestModel.aggregate<{ total: number }>([{ $match: { seller: auth.userId, status: { $in: ["pending", "approved"] } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
      if (body.amount > Number(shop.adminToPay || 0) - Number(pending[0]?.total || 0)) return NextResponse.json({ message: "The requested amount exceeds the available settlement balance." }, { status: 409 });
      const record = await WithdrawRequestModel.create({ seller: auth.userId, shop: shop._id, amount: body.amount, message: body.message, status: "pending" }); return NextResponse.json({ data: record }, { status: 201 });
    }
    return NextResponse.json({ message: "Unknown account resource" }, { status: 404 });
  } catch (error) { return invalid(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ resource: string[] }> }) {
  const auth = await account(); if (!auth) return unauthorized();
  const { resource } = await params; const route = resource.join("/");
  try {
    await connectMongo();
    if (route === "profile") {
      const body = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().trim().max(30).optional(), currentPassword: z.string().max(200).optional(), newPassword: z.string().min(8).max(200).optional() }).refine((value) => !value.newPassword || Boolean(value.currentPassword), { message: "Current password is required." }).parse(await request.json());
      const changes: Record<string, unknown> = { name: body.name, phone: body.phone };
      if (body.newPassword) {
        const user = await User.findById(auth.userId).select("+passwordHash");
        const valid = user?.passwordHash && await bcrypt.compare(body.currentPassword!, user.passwordHash.replace(/^\$2y\$/, "$2a$")).catch(() => false);
        if (!valid) return NextResponse.json({ message: "Current password is incorrect." }, { status: 409 });
        changes.passwordHash = await bcrypt.hash(body.newPassword, 12);
        await ApiTokenModel.deleteMany({ user: auth.userId });
      }
      await User.updateOne({ _id: auth.userId }, { $set: changes });
      return NextResponse.json({ success: true });
    }
    if (route === "addresses") {
      const body = z.object({ id: z.string(), label: z.string().trim().max(50).optional(), recipient: z.string().trim().max(120).optional(), address: z.string().trim().min(3).max(500), country: z.string().trim().min(2).max(120), state: z.string().trim().max(120).optional(), city: z.string().trim().min(2).max(120), postalCode: z.string().trim().min(3).max(20), phone: z.string().trim().min(5).max(30), isDefault: z.coerce.boolean().optional() }).parse(await request.json());
      const id = objectId(body.id); if (!id) return NextResponse.json({ message: "Invalid address." }, { status: 400 });
      if (body.isDefault) await AddressModel.updateMany({ user: auth.userId, _id: { $ne: id } }, { $set: { isDefault: false } });
      const result = await AddressModel.updateOne({ _id: id, user: auth.userId }, { $set: { ...body, id: undefined } }, { runValidators: true });
      return result.matchedCount ? NextResponse.json({ success: true }) : NextResponse.json({ message: "Address not found." }, { status: 404 });
    }
    if (route === "tickets") {
      const body = z.object({ id: z.string(), message: z.string().trim().min(1).max(5000) }).parse(await request.json()); const id = objectId(body.id);
      const result = id ? await TicketModel.updateOne({ _id: id, user: auth.userId, status: { $ne: "closed" } }, { $push: { messages: { author: auth.userId, message: body.message, createdAt: new Date() } }, $set: { status: "open", updatedAt: new Date() } }) : null;
      return result?.matchedCount ? NextResponse.json({ success: true }) : NextResponse.json({ message: "Ticket not found or closed." }, { status: 404 });
    }
    if (route === "conversations") {
      const body = z.object({ id: z.string(), message: z.string().trim().min(1).max(5000) }).parse(await request.json()); const id = objectId(body.id);
      const result = id ? await ConversationModel.updateOne({ _id: id, participants: auth.userId }, { $push: { messages: { sender: auth.userId, body: body.message, readBy: [auth.userId], createdAt: new Date() } }, $set: { updatedAt: new Date() } }) : null;
      return result?.matchedCount ? NextResponse.json({ success: true }) : NextResponse.json({ message: "Conversation not found." }, { status: 404 });
    }
    if (route === "orders/status") {
      const body = z.object({ orderId: z.string(), itemId: z.string().optional(), status: z.enum(["confirmed", "processing", "shipped", "delivered", "cancelled"]) }).parse(await request.json());
      const orderId = objectId(body.orderId); const itemId = body.itemId ? objectId(body.itemId) : null;
      if (!orderId) return NextResponse.json({ message: "Invalid order." }, { status: 400 });
      const order = await OrderModel.findById(orderId);
      if (!order) return NextResponse.json({ message: "Order not found." }, { status: 404 });
      const administrative = auth.session.role === "admin" || auth.session.role === "staff";
      const customerCancellation = auth.session.role === "customer" && String(order.customer || "") === String(auth.userId) && body.status === "cancelled" && order.status === "pending" && order.payment.status === "unpaid";
      const mutableItems = order.items as unknown as OrderItemRecord[];
      const candidates = customerCancellation ? mutableItems.filter((item) => item.deliveryStatus !== "cancelled") : mutableItems.filter((item) => (!itemId || String(item._id) === String(itemId)) && (administrative || auth.session.role === "seller" && String(item.seller) === String(auth.userId)));
      if (!candidates.length || (!administrative && !customerCancellation && auth.session.role !== "seller")) return NextResponse.json({ message: "This order action is not permitted." }, { status: 403 });
      const progression = ["pending", "confirmed", "processing", "shipped", "delivered"];
      for (const item of candidates) {
        if (!administrative && !customerCancellation && body.status !== "cancelled" && progression.indexOf(body.status) !== progression.indexOf(item.deliveryStatus) + 1) return NextResponse.json({ message: "Complete delivery statuses in order." }, { status: 409 });
        if (body.status === "cancelled" && item.deliveryStatus !== "cancelled") {
          const ledger = await SellerLedgerModel.findOneAndUpdate({ order: order._id, orderItem: item._id, status: "completed" }, { $set: { status: "reversed" } }, { new: true });
          if (ledger) await ShopModel.updateOne({ _id: ledger.shop }, { $inc: { adminToPay: -ledger.balanceDelta } });
          const stockUpdate: Record<string, number> = { stock: item.quantity, sales: -item.quantity };
          if (item.variation) stockUpdate["variants.$[variant].stock"] = item.quantity;
          try { await ProductModel.updateOne({ _id: item.product }, { $inc: stockUpdate }, item.variation ? { arrayFilters: [{ "variant.name": item.variation }] } : {}); }
          catch (error) { if (ledger) { await ShopModel.updateOne({ _id: ledger.shop }, { $inc: { adminToPay: ledger.balanceDelta } }); await SellerLedgerModel.updateOne({ _id: ledger._id }, { $set: { status: "completed" } }); } throw error; }
        }
        item.deliveryStatus = body.status;
      }
      const states = mutableItems.map((item) => item.deliveryStatus);
      order.status = states.every((state) => state === "cancelled") ? "cancelled" : states.every((state) => state === "delivered") ? "delivered" : states.includes("shipped") ? "shipped" : states.includes("processing") ? "processing" : states.includes("confirmed") ? "confirmed" : "pending";
      order.statusHistory.push({ status: order.status, at: new Date(), note: `${auth.session.role} updated ${candidates.length} item(s)` });
      await order.save();
      return NextResponse.json({ success: true, status: order.status });
    }
    if (route === "withdrawals") {
      if (!(auth.session.role === "admin" || auth.session.role === "staff")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      const body = z.object({ id: z.string(), status: z.enum(["approved", "rejected", "paid"]) }).parse(await request.json()); const id=objectId(body.id);if(!id)return NextResponse.json({message:"Invalid request"},{status:400});
      const record=await WithdrawRequestModel.findById(id);if(!record)return NextResponse.json({message:"Request not found"},{status:404});
      if(record.status==="paid"||record.status==="rejected")return NextResponse.json({message:"This request is already final."},{status:409});
      if(body.status==="paid"){if(record.status!=="approved")return NextResponse.json({message:"Approve the request before marking it paid."},{status:409});const shop=await ShopModel.findOneAndUpdate({_id:record.shop,adminToPay:{$gte:record.amount}},{$inc:{adminToPay:-record.amount}},{new:true});if(!shop)return NextResponse.json({message:"The seller balance is no longer sufficient."},{status:409});try{record.status="paid";record.processedBy=auth.userId;record.processedAt=new Date();await record.save()}catch(error){await ShopModel.updateOne({_id:record.shop},{$inc:{adminToPay:record.amount}});throw error}}
      else{record.status=body.status;record.processedBy=auth.userId;record.processedAt=new Date();await record.save()}
      return NextResponse.json({success:true});
    }
    if (route === "orders/payment") {
      if (!(auth.session.role === "admin" || auth.session.role === "staff")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      const body=z.object({orderId:z.string(),status:z.literal("paid")}).parse(await request.json());const orderId=objectId(body.orderId);if(!orderId)return NextResponse.json({message:"Invalid order"},{status:400});
      const result=await OrderModel.updateOne({_id:orderId,"payment.status":{$in:["unpaid","pending"]}},{$set:{"payment.status":"paid","payment.paidAt":new Date(),"items.$[item].paymentStatus":"paid"}},{arrayFilters:[{"item.deliveryStatus":{$ne:"cancelled"}}]});
      return result.matchedCount?NextResponse.json({success:true}):NextResponse.json({message:"Order is already paid or unavailable."},{status:409});
    }
    return NextResponse.json({ message: "Unknown account resource" }, { status: 404 });
  } catch (error) { return invalid(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ resource: string[] }> }) {
  const auth = await account(); if (!auth) return unauthorized();
  const { resource } = await params; if (resource.join("/") !== "addresses") return NextResponse.json({ message: "Unknown account resource" }, { status: 404 });
  const id = objectId(new URL(request.url).searchParams.get("id") || ""); if (!id) return NextResponse.json({ message: "Invalid address." }, { status: 400 });
  await connectMongo();
  const address = await AddressModel.findOne({ _id: id, user: auth.userId }).lean();
  if (!address) return NextResponse.json({ message: "Address not found." }, { status: 404 });
  await AddressModel.deleteOne({ _id: id, user: auth.userId });
  if (address.isDefault) { const next = await AddressModel.findOne({ user: auth.userId }).sort({ createdAt: -1 }).select("_id").lean(); if (next) await AddressModel.updateOne({ _id: next._id }, { $set: { isDefault: true } }); }
  return NextResponse.json({ success: true });
}
