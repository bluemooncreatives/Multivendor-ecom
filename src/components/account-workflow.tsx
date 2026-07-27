"use client";

import { useEffect, useState } from "react";

type RecordData = Record<string, any>;

function messageText(record: RecordData, kind: "tickets" | "conversations"): string {
  const messages = Array.isArray(record.messages) ? record.messages : [];
  const last = messages.at(-1);
  return String(kind === "tickets" ? last?.message || "" : last?.body || "");
}

export function AccountWorkflow({ kind, initialRecords = [] }: { kind: "profile" | "tickets" | "conversations"; initialRecords?: RecordData[] }) {
  const resource = kind === "profile" ? "addresses" : kind;
  const [records, setRecords] = useState(initialRecords);
  const [profile, setProfile] = useState<RecordData>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (kind === "profile") fetch("/api/account/profile").then((response) => response.json()).then((result) => setProfile(result.data || {})).catch(() => undefined); }, [kind]);

  async function request(path: string, method: string, body?: RecordData) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/account/${path}`, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.message || "The request could not be completed."); return null; }
      setMessage(result.message || "Saved successfully.");
      return result;
    } catch { setError("The request could not reach the server."); return null; }
    finally { setBusy(false); }
  }

  async function refresh() { const response = await fetch(`/api/account/${resource}`); const result = await response.json(); if (response.ok) setRecords(result.data || []); }
  async function submitProfile(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); const result = await request("profile", "PATCH", values); if (result) setProfile((current) => ({ ...current, ...values })); }
  async function submitAddress(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); if (await request("addresses", "POST", values)) { event.currentTarget.reset(); await refresh(); } }
  async function submitNew(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); if (await request(resource, "POST", values)) { event.currentTarget.reset(); await refresh(); } }
  async function reply(event: React.FormEvent<HTMLFormElement>, id: string) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); if (await request(resource, "PATCH", { id, ...values })) { event.currentTarget.reset(); await refresh(); } }
  async function removeAddress(id: string) { if (!confirm("Remove this address?")) return; if (await request(`addresses?id=${encodeURIComponent(id)}`, "DELETE")) await refresh(); }

  if (kind === "profile") return <div className="form-grid"><section className="content-card"><span className="eyebrow">Account</span><h2>Profile and password</h2>{error && <div className="form-error">{error}</div>}{message && <div className="callout">{message}</div>}<form className="record-form" onSubmit={submitProfile}><div className="field"><label>Name</label><input className="form-control" name="name" defaultValue={profile.name || ""} minLength={2} maxLength={120} required/></div><div className="field"><label>Email</label><input className="form-control" value={profile.email || ""} disabled/></div><div className="field"><label>Phone</label><input className="form-control" name="phone" defaultValue={profile.phone || ""} maxLength={30}/></div><div className="field"><label>Current password</label><input className="form-control" name="currentPassword" type="password" autoComplete="current-password" maxLength={200}/></div><div className="field"><label>New password</label><input className="form-control" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={200}/></div><button className="button button-primary" disabled={busy}>Save profile</button></form></section><section className="content-card"><span className="eyebrow">Delivery</span><h2>Saved addresses</h2><div className="form-grid">{records.map((address) => <div className="callout" key={address._id}><strong>{address.label || "Address"}{address.isDefault ? " · Default" : ""}</strong><p>{address.recipient}<br/>{address.address}, {address.city}, {address.state} {address.postalCode}<br/>{address.country} · {address.phone}</p><button className="mini-button danger" onClick={() => removeAddress(String(address._id))}>Remove</button></div>)}</div><h3>Add an address</h3><form className="record-form" onSubmit={submitAddress}><div className="field"><label>Label</label><input className="form-control" name="label" defaultValue="Home" maxLength={50}/></div><div className="field"><label>Recipient</label><input className="form-control" name="recipient" maxLength={120}/></div><div className="field"><label>Address</label><textarea className="form-control" name="address" minLength={3} maxLength={500} required/></div><div className="field"><label>City</label><input className="form-control" name="city" minLength={2} maxLength={120} required/></div><div className="field"><label>State</label><input className="form-control" name="state" maxLength={120}/></div><div className="field"><label>Postal code</label><input className="form-control" name="postalCode" minLength={3} maxLength={20} required/></div><div className="field"><label>Country</label><input className="form-control" name="country" defaultValue="India" minLength={2} maxLength={120} required/></div><div className="field"><label>Phone</label><input className="form-control" name="phone" minLength={5} maxLength={30} required/></div><label><input type="checkbox" name="isDefault" value="true"/> Make default</label><button className="button button-primary" disabled={busy}>Add address</button></form></section></div>;

  return <section className="content-card"><span className="eyebrow">{kind === "tickets" ? "Help center" : "Messages"}</span><h2>{kind === "tickets" ? "Support tickets" : "Conversations"}</h2>{error && <div className="form-error">{error}</div>}{message && <div className="callout">{message}</div>}<div className="form-grid">{records.map((record) => <div className="callout" key={record._id}><strong>{record.subject || record.title}</strong><small>{record.code || record.status}</small><p>{messageText(record, kind)}</p><form className="toolbar-actions" onSubmit={(event) => reply(event, String(record._id))}><input className="form-control" name="message" placeholder="Write a reply" minLength={1} maxLength={5000} required/><button className="button" disabled={busy}>Reply</button></form></div>)}</div><h3>{kind === "tickets" ? "Open a ticket" : "Start a conversation"}</h3><form className="record-form" onSubmit={submitNew}>{kind === "conversations" && <div className="field"><label>Recipient account ID</label><input className="form-control" name="receiverId" required/></div>}<div className="field"><label>{kind === "tickets" ? "Subject" : "Title"}</label><input className="form-control" name={kind === "tickets" ? "subject" : "title"} minLength={2} maxLength={240} required/></div><div className="field"><label>Message</label><textarea className="form-control" name="message" minLength={1} maxLength={5000} rows={4} required/></div><button className="button button-primary" disabled={busy}>{kind === "tickets" ? "Open ticket" : "Start conversation"}</button></form></section>;
}
