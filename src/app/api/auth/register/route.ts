import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, landingForRole, SESSION_COOKIE } from "@/lib/auth";
import { createAccountToken } from "@/lib/account-tokens";
import { sendVerificationEmail } from "@/lib/mailer";
import { connectMongo, isMongoDuplicate } from "@/lib/mongodb";
import type { SessionUser } from "@/lib/types";
import { AccountTokenModel, SettingModel, ShopModel, User } from "@/models";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(200),
  passwordConfirmation: z.string(),
  role: z.enum(["customer", "seller"]).default("customer"),
  shopName: z.string().trim().min(2).max(160).optional(),
}).refine((value) => value.password === value.passwordConfirmation, { message: "Passwords do not match.", path: ["passwordConfirmation"] })
  .refine((value) => value.role !== "seller" || Boolean(value.shopName), { message: "Shop name is required for sellers.", path: ["shopName"] });

function slugify(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "shop";
}

export async function POST(request: Request) {
  let createdUserId: string | null = null;
  try {
    const input = schema.parse(await request.json());
    await connectMongo();
    const verificationSetting = await SettingModel.findOne({ key: "business.email_verification" }).select("value").lean();
    const requiresVerification = verificationSetting?.value === true || String(verificationSetting?.value) === "1";
    const passwordHash = await bcrypt.hash(input.password, 12);
    const record = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      status: requiresVerification ? "pending" : "active",
      provider: "password",
      emailVerifiedAt: requiresVerification ? undefined : new Date(),
    });
    createdUserId = String(record._id);
    if (input.role === "seller") {
      const base = slugify(input.shopName!);
      const suffix = String(record._id).slice(-6);
      await ShopModel.create({
        owner: record._id,
        name: input.shopName,
        slug: `${base}-${suffix}`,
        verificationStatus: "pending",
        active: true,
      });
    }
    if (requiresVerification) {
      const token = await createAccountToken(record._id, record.email, "email-verification", 24 * 60);
      await sendVerificationEmail(record.email, token);
      return NextResponse.json({ requiresVerification: true, redirect: "/login?verification=sent" }, { status: 201 });
    }
    const user: SessionUser = { id: String(record._id), name: record.name, email: record.email, role: input.role };
    const response = NextResponse.json({ user, redirect: landingForRole(input.role) }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return response;
  } catch (error) {
    if (createdUserId) {
      await Promise.allSettled([ShopModel.deleteOne({ owner: createdUserId }), AccountTokenModel.deleteMany({ user: createdUserId }), User.deleteOne({ _id: createdUserId })]);
    }
    if (error instanceof z.ZodError) return NextResponse.json({ message: error.issues[0]?.message || "Check your registration details." }, { status: 400 });
    if (isMongoDuplicate(error)) return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    return NextResponse.json({ message: "Registration is temporarily unavailable." }, { status: 503 });
  }
}
