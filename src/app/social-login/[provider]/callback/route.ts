import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionToken, landingForRole, OAUTH_STATE_COOKIE, readOAuthStateToken, SESSION_COOKIE } from "@/lib/auth";
import { exchangeOAuthCode, resolveOAuthUser, type OAuthProvider } from "@/lib/oauth";
import type { Role, SessionUser } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: rawProvider } = await params;
  const provider = rawProvider === "google" || rawProvider === "facebook" ? rawProvider as OAuthProvider : null;
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  const store = await cookies();
  const statePayload = await readOAuthStateToken(store.get(OAUTH_STATE_COOKIE)?.value);
  const failure = (reason: string) => { const response = NextResponse.redirect(new URL(`/login?oauth=${reason}`, request.url)); response.cookies.delete(OAUTH_STATE_COOKIE); return response; };
  if (!provider || !code || !statePayload || statePayload.provider !== provider || statePayload.state !== state) return failure("invalid_state");
  try {
    const profile = await exchangeOAuthCode(provider, code);
    const record = await resolveOAuthUser(provider, profile);
    const role = record.role as Role;
    const user: SessionUser = { id: String(record._id), name: record.name, email: record.email, role };
    const response = NextResponse.redirect(new URL(statePayload.destination || landingForRole(role), request.url));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.set(SESSION_COOKIE, await createSessionToken(user), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 14 });
    return response;
  } catch { return failure("failed"); }
}
