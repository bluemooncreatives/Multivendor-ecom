import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";
const ticketReplySchema = new Schema({
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    attachments: { type: [String], default: [] },
}, { timestamps: true });
const ticketSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ["open", "answered", "closed"], default: "open", index: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    replies: { type: [ticketReplySchema], default: [] },
}, { timestamps: true });
withJsonId(ticketSchema);
export const Ticket = model("Ticket", ticketSchema);
const messageSchema = new Schema({
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    attachments: { type: [String], default: [] },
    readAt: Date,
}, { timestamps: true });
// Customer <-> Seller pre-sale chat, scoped to a participant pair.
const conversationSchema = new Schema({
    participantIds: {
        type: [Schema.Types.ObjectId],
        ref: "User",
        required: true,
        validate: (v) => v.length === 2,
    },
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    messages: { type: [messageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });
conversationSchema.index({ participantIds: 1 });
withJsonId(conversationSchema);
export const Conversation = model("Conversation", conversationSchema);
//# sourceMappingURL=Support.js.map