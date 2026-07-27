import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, landingForRole, SESSION_COOKIE } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import type { Role, SessionUser } from "@/lib/types";
import { User } from "@/models";

export const runtime = "nodejs";

const schema = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) });
const DUMMY_PASSWORD_HASH = "$2b$12$p2i1w43nvDntqyJp36gMHODR56vuNv0GQXb.QF4/tfRWza8ctACA.";

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    await connectMongo();
    const record = await User.findOne({ email: input.email.trim().toLowerCase() }).select("+passwordHash");
    const passwordHash = record?.passwordHash?.replace(/^\$2y\$/, "$2a$") || DUMMY_PASSWORD_HASH;
    const valid = await bcrypt.compare(input.password, passwordHash).catch(() => false);
    if (!record || !valid || record.status !== "active") {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }
    if (record.provider === "password" && !record.emailVerifiedAt) return NextResponse.json({ message: "Verify your email before signing in." }, { status: 403 });
    const role = record.role as Role;
    const user: SessionUser = { id: String(record._id), name: record.name, email: record.email, role };
    await User.updateOne({ _id: record._id }, { $set: { lastLoginAt: new Date() } });
    const response = NextResponse.json({ user, redirect: landingForRole(role) });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ message: "Enter a valid email address and password." }, { status: 400 });
    return NextResponse.json({ message: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
