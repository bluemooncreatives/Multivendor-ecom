import type { Request, Response } from "express";
import { z } from "zod";
import { Subscriber } from "../models/Marketing.js";
import { sendNewsletterCampaign, isMailConfigured } from "../services/email.service.js";
import { User } from "../models/User.js";
import { logger } from "../config/logger.js";
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
  /**
   * Who to send to. The legacy screen offered newsletter subscribers *and*
   * registered users as two separate recipient lists, and this version could only
   * ever send to every subscriber.
   */
  audience: z.enum(["subscribers", "customers", "both"]).default("subscribers"),
  /** Explicit addresses, which must be on the chosen audience's list. */
  emails: z.array(z.string().email()).optional(),
});

export async function sendCampaignHandler(req: Request, res: Response) {
  // Refused up front rather than reporting a send that silently delivered nothing.
  if (!(await isMailConfigured())) {
    throw new ApiError(400, "Configure SMTP in Admin > Settings before sending a newsletter");
  }

  const { audience, emails, subject, body } = req.body as {
    audience: "subscribers" | "customers" | "both";
    emails?: string[];
    subject: string;
    body: string;
  };

  const recipients = new Set<string>();
  if (audience === "subscribers" || audience === "both") {
    for (const subscriber of await Subscriber.find({}, { email: 1 })) recipients.add(subscriber.email);
  }
  if (audience === "customers" || audience === "both") {
    // Banned accounts are excluded: they are not customers the store wants to mail.
    for (const user of await User.find({ role: "customer", banned: false }, { email: 1 })) {
      if (user.email) recipients.add(user.email);
    }
  }

  // An explicit selection narrows the audience; an address that is not on the list
  // is dropped rather than mailed, so this endpoint cannot be used to send mail to
  // arbitrary addresses.
  let targets = [...recipients];
  if (emails && emails.length > 0) {
    const allowed = new Set(targets.map((email) => email.toLowerCase()));
    targets = emails.filter((email) => allowed.has(email.toLowerCase()));
    if (targets.length === 0) throw new ApiError(400, "None of those addresses are on the selected list");
  }
  if (targets.length === 0) throw new ApiError(400, "There is nobody to send this to");

  // Sending happens after the response: a few thousand addresses, one connection
  // at a time, outlasts any request timeout. Failures are logged per address.
  void sendNewsletterCampaign(targets, subject, body)
    .then((sent) => logger.info(`Newsletter "${subject}" sent to ${sent} recipient(s)`))
    .catch((err) => logger.error(`Newsletter "${subject}" failed: ${String(err)}`));

  res.json({ queued: targets.length, audience });
}
