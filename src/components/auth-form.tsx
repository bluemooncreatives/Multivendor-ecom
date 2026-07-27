"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function safeDestination(value: unknown, fallback: string): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : fallback;
}

export function AuthForm({ mode, role = "customer", socialProviders = [] }: { mode: "login" | "register"; role?: "customer" | "seller"; socialProviders?: ("google" | "facebook")[] }) {
  const search = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, role }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.message || "Please check your details."); return; }
      window.location.assign(safeDestination(search.get("next"), safeDestination(result.redirect, "/dashboard")));
    } catch { setError("The request could not reach the server. Please try again."); }
    finally { setBusy(false); }
  }

  return <div className="auth-card"><span className="eyebrow">{mode === "login" ? "Welcome back" : role === "seller" ? "Grow your business" : "Join the marketplace"}</span><h1>{mode === "login" ? "Sign in to your account" : role === "seller" ? "Create a seller account" : "Create your account"}</h1><p>{mode === "login" ? "Manage orders, products, and your marketplace profile." : "One account for a complete local shopping experience."}</p>{search.get("verification") === "complete" && <div className="callout">Email verified. You can now sign in.</div>}{search.get("verification") === "sent" && <div className="callout">Check your email to verify the new account before signing in.</div>}{search.get("verification") === "invalid" && <div className="form-error">That verification link is invalid or expired.</div>}{error && <div className="form-error">{error}</div>}{socialProviders.length > 0 && <div className="form-grid">{socialProviders.map((provider) => <a className="button" key={provider} href={`/social-login/redirect/${provider}`}>Continue with {provider === "google" ? "Google" : "Facebook"}</a>)}</div>}<form className="form-grid" onSubmit={submit}>{mode === "register" && <div className="field"><label>Full name</label><input className="form-control" name="name" minLength={2} maxLength={120} required/></div>}{mode === "register" && role === "seller" && <div className="field"><label>Shop name</label><input className="form-control" name="shopName" minLength={2} maxLength={160} required/></div>}<div className="field"><label>Email address</label><input className="form-control" type="email" name="email" autoComplete="email" maxLength={254} required/></div><div className="field"><label>Password</label><input className="form-control" type="password" name="password" minLength={8} maxLength={200} autoComplete={mode === "login" ? "current-password" : "new-password"} required/></div>{mode === "register" && <div className="field"><label>Confirm password</label><input className="form-control" type="password" name="passwordConfirmation" minLength={8} maxLength={200} autoComplete="new-password" required/></div>}{mode === "login" && <div><Link href="/forgot-password">Forgot password?</Link></div>}<button className="button button-primary" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button></form><p className="auth-foot">{mode === "login" ? <>New to V4Local? <Link href="/register">Create an account</Link></> : <>Already registered? <Link href="/login">Sign in</Link></>}</p></div>;
}
