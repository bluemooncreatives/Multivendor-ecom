import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { connectMongo, objectId } from "@/lib/mongodb";
import type { SessionUser } from "@/lib/types";
import { User } from "@/models";

export const SESSION_COOKIE = "v4local_session";
export const OAUTH_STATE_COOKIE = "v4local_oauth_state";

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET || (process.env.NODE_ENV === "production" ? "" : "development-only-change-this-secret");
  if (value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(value);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());
}

export async function readSessionToken(token?: string): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.sub),
      name: String(payload.name || "User"),
      email: String(payload.email || ""),
      role: (payload.role || "customer") as SessionUser["role"],
    };
  } catch {
    return null;
  }
}

export async function createOAuthStateToken(provider: "google" | "facebook", state: string, destination = "/dashboard"): Promise<string> {
  return new SignJWT({ provider, state, destination })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret());
}

export async function readOAuthStateToken(token?: string): Promise<{ provider: "google" | "facebook"; state: string; destination: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!(["google", "facebook"] as unknown[]).includes(payload.provider) || typeof payload.state !== "string") return null;
    const destination = typeof payload.destination === "string" && payload.destination.startsWith("/") && !payload.destination.startsWith("//") ? payload.destination : "/dashboard";
    return { provider: payload.provider as "google" | "facebook", state: payload.state, destination };
  } catch { return null; }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const session = await readSessionToken(store.get(SESSION_COOKIE)?.value);
  const id = session ? objectId(session.id) : null;
  if (!session || !id) return null;
  try {
    await connectMongo();
    const account = await User.findOne({ _id: id, status: "active" }).select("name email role").lean();
    return account ? { id: String(account._id), name: account.name, email: account.email, role: account.role as SessionUser["role"] } : null;
  } catch {
    return null;
  }
}

export function landingForRole(role: SessionUser["role"]): string {
  if (role === "admin" || role === "staff") return "/admin";
  if (role === "seller") return "/seller/dashboard";
  return "/dashboard";
}
