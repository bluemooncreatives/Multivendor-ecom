import { NextResponse } from "next/server";
import { consumeAccountToken } from "@/lib/account-tokens";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/models";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await connectMongo();
  const tokenValue = new URL(request.url).searchParams.get("token") || "";
  const token = await consumeAccountToken(tokenValue, "email-verification");
  if (!token?.user) return NextResponse.redirect(new URL("/login?verification=invalid", request.url));
  await User.updateOne({ _id: token.user, status: { $in: ["active", "pending"] } }, { $set: { emailVerifiedAt: new Date(), status: "active" } });
  return NextResponse.redirect(new URL("/login?verification=complete", request.url));
}
