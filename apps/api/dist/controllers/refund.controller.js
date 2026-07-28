import { z } from "zod";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { RefundRequest } from "../models/Refund.js";
import { Wallet, WalletTransaction } from "../models/Wallet.js";
import { SellerLedger } from "../models/Ledger.js";
import { ApiError } from "../middleware/errorHandler.js";
export const refundRequestSchema = z.object({
    orderId: z.string(),
    sellerId: z.string(),
    reason: z.string().min(1),
    amount: z.number().min(0),
    images: z.array(z.string().url()).default([]),
});
export async function createRefundRequestHandler(req, res) {
    const order = await Order.findOne({ _id: req.body.orderId, userId: req.user.id });
    if (!order)
        throw new ApiError(404, "Order not found");
    const request = await RefundRequest.create({ ...req.body, userId: req.user.id });
    res.status(201).json(request);
}
export async function listMyRefundRequestsHandler(req, res) {
    const items = await RefundRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ items });
}
export async function listSellerRefundRequestsHandler(req, res) {
    const items = await RefundRequest.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ items });
}
export const resolveRefundSchema = z.object({
    approve: z.boolean(),
    resolutionNote: z.string().optional(),
});
// Refunding credits the customer's wallet and reverses the seller's ledger entry
// for that portion — the same reversal pattern used by order cancellation.
export async function resolveRefundRequestHandler(req, res) {
    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            const request = await RefundRequest.findById(req.params.id).session(session);
            if (!request)
                throw new ApiError(404, "Refund request not found");
            if (request.status !== "pending")
                throw new ApiError(409, "This request has already been resolved");
            if (req.body.approve) {
                const wallet = await Wallet.findOneAndUpdate({ userId: request.userId }, { $inc: { balance: request.amount } }, { session, new: true, upsert: true });
                await WalletTransaction.create([
                    {
                        userId: request.userId,
                        amount: request.amount,
                        balanceAfter: wallet?.balance ?? request.amount,
                        reason: "Refund approved",
                        refType: "refund",
                        refId: request._id,
                        idempotencyKey: `refund:${request._id}`,
                    },
                ], { session });
                await SellerLedger.create([{ sellerId: request.sellerId, orderId: request.orderId, type: "refund", amount: -request.amount, note: "Refund approved" }], { session });
                request.status = "refunded";
            }
            else {
                request.status = "rejected";
            }
            request.resolutionNote = req.body.resolutionNote;
            request.resolvedBy = req.user.id;
            await request.save({ session });
            result = request;
        });
        res.json(result);
    }
    finally {
        await session.endSession();
    }
}
//# sourceMappingURL=refund.controller.js.map