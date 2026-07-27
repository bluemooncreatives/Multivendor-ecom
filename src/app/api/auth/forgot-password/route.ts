import { NextResponse } from "next/server";
import { z } from "zod";
import { createAccountToken } from "@/lib/account-tokens";
import { connectMongo } from "@/lib/mongodb";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { User } from "@/models";

export const runtime = "nodejs";
const schema = z.object({ email: z.email().max(254).transform((value) => value.trim().toLowerCase()) });
const responseBody = { message: "If an active account matches that email, a reset link has been sent." };

export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json());
    await connectMongo();
    const user = await User.findOne({ email, status: "active" }).select("_id email").lean();
    if (user) {
      const token = await createAccountToken(user._id, user.email, "password-reset", 60);
      try { await sendPasswordResetEmail(user.email, token); }
      catch { /* Keep the response non-enumerating; operators see SMTP failures in health/log monitoring. */ }
    }
    return NextResponse.json(responseBody);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
    return NextResponse.json(responseBody);
  }
}
