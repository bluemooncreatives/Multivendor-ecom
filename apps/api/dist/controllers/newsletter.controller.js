import { z } from "zod";
import { Subscriber } from "../models/Marketing.js";
import { sendNewsletterCampaign } from "../services/email.service.js";
export const subscribeSchema = z.object({ email: z.string().email() });
export async function subscribeHandler(req, res) {
    await Subscriber.findOneAndUpdate({ email: req.body.email }, { email: req.body.email }, { upsert: true });
    res.status(201).json({ subscribed: true });
}
export async function listSubscribersHandler(_req, res) {
    res.json({ items: await Subscriber.find().sort({ createdAt: -1 }) });
}
export const sendCampaignSchema = z.object({
    subject: z.string().min(1),
    body: z.string().min(1),
});
export async function sendCampaignHandler(req, res) {
    const subscribers = await Subscriber.find();
    await sendNewsletterCampaign(subscribers.map((s) => s.email), req.body.subject, req.body.body);
    res.json({ sent: subscribers.length });
}
//# sourceMappingURL=newsletter.controller.js.map