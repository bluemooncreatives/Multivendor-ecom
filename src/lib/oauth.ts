import "server-only";

import { connectMongo, isMongoDuplicate } from "@/lib/mongodb";
import { ExternalAccountModel, SettingModel, User } from "@/models";

export type OAuthProvider = "google" | "facebook";
export type OAuthProfile = { providerAccountId: string; email: string; name: string; avatar?: string };

export function oauthCredentials(provider: OAuthProvider) {
  const prefix = provider.toUpperCase();
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
  if (!clientId || !clientSecret) throw new Error(`${provider} login is not configured`);
  return { clientId, clientSecret };
}

export function oauthCallbackUrl(provider: OAuthProvider): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/social-login/${provider}/callback`;
}

export async function oauthProviderEnabled(provider: OAuthProvider): Promise<boolean> {
  await connectMongo();
  const setting = await SettingModel.findOne({ key: `business.${provider}_login` }).select("value").lean();
  return (setting?.value === true || String(setting?.value) === "1") && Boolean(oauthCredentials(provider));
}

async function exchangeGoogle(code: string): Promise<OAuthProfile> {
  const { clientId, clientSecret } = oauthCredentials("google");
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: oauthCallbackUrl("google"), grant_type: "authorization_code" }), signal: AbortSignal.timeout(15_000) });
  if (!tokenResponse.ok) throw new Error("Google code exchange failed");
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) throw new Error("Google did not return an access token");
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(15_000) });
  if (!profileResponse.ok) throw new Error("Google user profile failed");
  const profile = await profileResponse.json() as { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
  if (!profile.sub || !profile.email || profile.email_verified !== true) throw new Error("Google did not provide a verified email");
  return { providerAccountId: profile.sub, email: profile.email.toLowerCase(), name: profile.name || profile.email.split("@")[0], avatar: profile.picture };
}

async function exchangeFacebook(code: string): Promise<OAuthProfile> {
  const { clientId, clientSecret } = oauthCredentials("facebook");
  const tokenUrl = new URL("https://graph.facebook.com/oauth/access_token");
  tokenUrl.search = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, redirect_uri: oauthCallbackUrl("facebook"), code }).toString();
  const tokenResponse = await fetch(tokenUrl, { signal: AbortSignal.timeout(15_000) });
  if (!tokenResponse.ok) throw new Error("Facebook code exchange failed");
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) throw new Error("Facebook did not return an access token");
  const profileUrl = new URL("https://graph.facebook.com/me");
  profileUrl.search = new URLSearchParams({ fields: "id,name,email,picture.type(large)" }).toString();
  const profileResponse = await fetch(profileUrl, { headers: { authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(15_000) });
  if (!profileResponse.ok) throw new Error("Facebook user profile failed");
  const profile = await profileResponse.json() as { id?: string; email?: string; name?: string; picture?: { data?: { url?: string } } };
  if (!profile.id || !profile.email) throw new Error("Facebook did not provide an email address");
  return { providerAccountId: profile.id, email: profile.email.toLowerCase(), name: profile.name || profile.email.split("@")[0], avatar: profile.picture?.data?.url };
}

export function exchangeOAuthCode(provider: OAuthProvider, code: string): Promise<OAuthProfile> {
  return provider === "google" ? exchangeGoogle(code) : exchangeFacebook(code);
}

export async function profileFromAccessToken(provider: OAuthProvider, accessToken: string): Promise<OAuthProfile> {
  if (!accessToken || accessToken.length > 4096) throw new Error("Invalid provider token");
  const endpoint = provider === "google" ? new URL("https://openidconnect.googleapis.com/v1/userinfo") : new URL("https://graph.facebook.com/me");
  if (provider === "facebook") endpoint.searchParams.set("fields", "id,name,email,picture.type(large)");
  const response = await fetch(endpoint, { headers: { authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error("Provider token validation failed");
  if (provider === "google") {
    const profile = await response.json() as { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
    if (!profile.sub || !profile.email || profile.email_verified !== true) throw new Error("Google did not provide a verified email");
    return { providerAccountId: profile.sub, email: profile.email.toLowerCase(), name: profile.name || profile.email.split("@")[0], avatar: profile.picture };
  }
  const profile = await response.json() as { id?: string; email?: string; name?: string; picture?: { data?: { url?: string } } };
  if (!profile.id || !profile.email) throw new Error("Facebook did not provide an email address");
  return { providerAccountId: profile.id, email: profile.email.toLowerCase(), name: profile.name || profile.email.split("@")[0], avatar: profile.picture?.data?.url };
}

export async function resolveOAuthUser(provider: OAuthProvider, profile: OAuthProfile) {
  await connectMongo();
  const linked = await ExternalAccountModel.findOne({ provider, providerAccountId: profile.providerAccountId }).lean();
  if (linked) {
    const user = await User.findOne({ _id: linked.user, status: "active" });
    if (!user) throw new Error("The linked account is unavailable");
    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date(), emailVerifiedAt: user.emailVerifiedAt || new Date(), avatar: user.avatar || profile.avatar } });
    return user;
  }
  let user = await User.findOne({ email: profile.email });
  if (user && user.status !== "active") throw new Error("The account is not active");
  if (!user) user = await User.create({ name: profile.name, email: profile.email, role: "customer", status: "active", provider, providerId: profile.providerAccountId, emailVerifiedAt: new Date(), avatar: profile.avatar, lastLoginAt: new Date() });
  else await User.updateOne({ _id: user._id }, { $set: { emailVerifiedAt: user.emailVerifiedAt || new Date(), avatar: user.avatar || profile.avatar, lastLoginAt: new Date() } });
  try { await ExternalAccountModel.create({ user: user._id, provider, providerAccountId: profile.providerAccountId }); }
  catch (error) {
    if (!isMongoDuplicate(error)) throw error;
    const winner = await ExternalAccountModel.findOne({ provider, providerAccountId: profile.providerAccountId }).lean();
    if (!winner || String(winner.user) !== String(user._id)) throw new Error("This social account is already linked to another user");
  }
  return user;
}
