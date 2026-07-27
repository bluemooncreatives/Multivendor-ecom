"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function AccountRecoveryForm({ mode }: { mode: "forgot" | "reset" }) {
  const search = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body = mode === "reset" ? { ...values, token: search.get("token") || "" } : values;
    try {
      const response = await fetch(`/api/auth/${mode === "forgot" ? "forgot-password" : "reset-password"}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) setError(result.message || "The request could not be completed.");
      else setMessage(result.message || "Done.");
    } catch { setError("The request could not reach the server. Please try again."); }
    finally { setBusy(false); }
  }

  return <div className="auth-card"><span className="eyebrow">Account security</span><h1>{mode === "forgot" ? "Reset your password" : "Choose a new password"}</h1><p>{mode === "forgot" ? "Enter your account email and we’ll send a time-limited reset link." : "Use at least eight characters for your new password."}</p>{error && <div className="form-error">{error}</div>}{message && <div className="callout">{message}</div>}<form className="form-grid" onSubmit={submit}>{mode === "forgot" ? <div className="field"><label>Email address</label><input className="form-control" type="email" name="email" autoComplete="email" required maxLength={254}/></div> : <><div className="field"><label>New password</label><input className="form-control" type="password" name="password" autoComplete="new-password" minLength={8} maxLength={200} required/></div><div className="field"><label>Confirm new password</label><input className="form-control" type="password" name="passwordConfirmation" autoComplete="new-password" minLength={8} maxLength={200} required/></div></>}<button className="button button-primary" disabled={busy}>{busy ? "Please wait…" : mode === "forgot" ? "Send reset link" : "Update password"}</button></form><p className="auth-foot"><Link href="/login">Back to sign in</Link></p></div>;
}
