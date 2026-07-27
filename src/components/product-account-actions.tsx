"use client";

import { useState } from "react";

export function ProductAccountActions({ productId, productName, sellerId }: { productId: string; productName: string; sellerId: string }) {
  const [message, setMessage] = useState("");
  const [contactOpen, setContactOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function authenticatedRequest(path: string, body: Record<string, unknown>) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) { window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`); return false; }
      setMessage(response.ok ? result.message || "Saved." : result.message || "The request could not be completed.");
      return response.ok;
    } catch { setMessage("The request could not reach the server."); return false; }
    finally { setBusy(false); }
  }

  async function addWishlist() { await authenticatedRequest("/api/v1/wishlists", { product_id: productId }); }
  function addCompare(){let ids:string[]=[];try{const value=JSON.parse(localStorage.getItem("v4local_compare")||"[]");if(Array.isArray(value))ids=value.map(String)}catch{}ids=[productId,...ids.filter((id)=>id!==productId)].slice(0,4);localStorage.setItem("v4local_compare",JSON.stringify(ids));setMessage("Added to comparison.");}
  async function contact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("message") || "");
    if (await authenticatedRequest("/api/account/conversations", { receiverId: sellerId, title: `Question about ${productName}`, message: text })) { event.currentTarget.reset(); setContactOpen(false); }
  }

  return <div className="form-grid"><div className="detail-actions"><button className="button" disabled={busy} onClick={addWishlist}>Save to wishlist</button><button className="button" onClick={addCompare}>Add to compare</button><button className="button" disabled={busy} onClick={() => setContactOpen((value) => !value)}>Contact seller</button></div>{contactOpen && <form className="toolbar-actions" onSubmit={contact}><input className="form-control" name="message" placeholder="Ask the seller a question" minLength={1} maxLength={5000} required/><button className="button button-primary" disabled={busy}>Send</button></form>}{message && <div className={/saved|success|started|comparison/i.test(message) ? "callout" : "form-error"}>{message}</div>}</div>;
}
