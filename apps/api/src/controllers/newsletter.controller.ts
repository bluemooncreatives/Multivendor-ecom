import type { Request, Response } from "express";
import { z } from "zod";
import { Subscriber } from "../models/Marketing.js";
import { sendNewsletterCampaign } from "../services/email.service.js";
import { ApiError } from "../middleware/errorHandler.js";

export const subscribeSchema = z.object({ email: z.string().email() });

export async function subscribeHandler(req: Request, res: Response) {
  await Subscriber.findOneAndUpdate({ email: req.body.email }, { email: req.body.email }, { upsert: true });
  res.status(201).json({ subscribed: true });
}

export async function listSubscribersHandler(_req: Request, res: Response) {
  res.json({ items: await Subscriber.find().sort({ createdAt: -1 }) });
}

// Admin-side subscriber management, so a list can be curated by hand rather than
// only ever growing from the storefront signup box.
export const subscriberSchema = z.object({ email: z.string().email() });

export async function createSubscriberHandler(req: Request, res: Response) {
  const existing = await Subscriber.findOne({ email: req.body.email });
  if (existing) throw new ApiError(409, "That address is already subscribed");
  res.status(201).json(await Subscriber.create({ email: req.body.email }));
}

export async function updateSubscriberHandler(req: Request, res: Response) {
  const subscriber = await Subscriber.findByIdAndUpdate(req.params.id, { email: req.body.email }, { new: true });
  if (!subscriber) throw new ApiError(404, "Subscriber not found");
  res.json(subscriber);
}

export async function deleteSubscriberHandler(req: Request, res: Response) {
  const deleted = await Subscriber.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "Subscriber not found");
  res.status(204).send();
}

export const sendCampaignSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function sendCampaignHandler(req: Request, res: Response) {
  const subscribers = await Subscriber.find();
  await sendNewsletterCampaign(
    subscribers.map((s) => s.email),
    req.body.subject,
    req.body.body,
  );
  res.json({ sent: subscribers.length });
}
