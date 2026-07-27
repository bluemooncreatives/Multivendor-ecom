import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createOAuthStateToken, OAUTH_STATE_COOKIE } from "@/lib/auth";
import { oauthCallbackUrl, oauthCredentials, oauthProviderEnabled, type OAuthProvider } from "@/lib/oauth";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: rawProvider } = await params;
  if (rawProvider !== "google" && rawProvider !== "facebook") return NextResponse.redirect(new URL("/login?oauth=unsupported", request.url));
  const provider = rawProvider as OAuthProvider;
  try {
    if (!await oauthProviderEnabled(provider)) return NextResponse.redirect(new URL("/login?oauth=disabled", request.url));
    const { clientId } = oauthCredentials(provider);
    const state = crypto.randomBytes(32).toString("base64url");
    const destinationValue = new URL(request.url).searchParams.get("next");
    const destination = destinationValue?.startsWith("/") && !destinationValue.startsWith("//") ? destinationValue : "/dashboard";
    const callback = oauthCallbackUrl(provider);
    const authorization = provider === "google" ? new URL("https://accounts.google.com/o/oauth2/v2/auth") : new URL("https://www.facebook.com/dialog/oauth");
    authorization.search = new URLSearchParams(provider === "google" ? { client_id: clientId, redirect_uri: callback, response_type: "code", scope: "openid profile email", state, prompt: "select_account" } : { client_id: clientId, redirect_uri: callback, response_type: "code", scope: "email,public_profile", state }).toString();
    const response = NextResponse.redirect(authorization);
    response.cookies.set(OAUTH_STATE_COOKIE, await createOAuthStateToken(provider, state, destination), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
    return response;
  } catch { return NextResponse.redirect(new URL("/login?oauth=unavailable", request.url)); }
}
