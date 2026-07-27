import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeAccountToken } from "@/lib/account-tokens";
import { connectMongo } from "@/lib/mongodb";
import { ApiTokenModel, User } from "@/models";

export const runtime = "nodejs";
const schema = z.object({ token: z.string().min(32).max(200), password: z.string().min(8).max(200), passwordConfirmation: z.string().max(200) }).refine((value) => value.password === value.passwordConfirmation, { message: "Passwords do not match.", path: ["passwordConfirmation"] });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    await connectMongo();
    const token = await consumeAccountToken(input.token, "password-reset");
    if (!token?.user) return NextResponse.json({ message: "This reset link is invalid or has expired." }, { status: 400 });
    const result = await User.updateOne({ _id: token.user, status: "active" }, { $set: { passwordHash: await bcrypt.hash(input.password, 12), provider: "password" } });
    if (!result.matchedCount) return NextResponse.json({ message: "This account is unavailable." }, { status: 409 });
    await ApiTokenModel.deleteMany({ user: token.user });
    return NextResponse.json({ message: "Your password has been updated. Sign in with the new password." });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ message: error.issues[0]?.message || "Check the new password." }, { status: 400 });
    return NextResponse.json({ message: "The password could not be reset." }, { status: 503 });
  }
}
