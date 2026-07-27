"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { Money } from "@/components/preferences-provider";

export function CheckoutForm({ defaultName = "", defaultEmail = "", walletEnabled = false, couponsEnabled = true }: { defaultName?: string; defaultEmail?: string; walletEnabled?: boolean; couponsEnabled?: boolean }) {
  const { lines, total, clear } = useCart();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lines.length) { router.push("/cart"); return; }
    setBusy(true);
    setError("");
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
        body: JSON.stringify({ ...data, lines, idempotencyKey }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.message || "Checkout could not be completed."); return; }
      clear();
      router.push(`/checkout/order-confirmed?code=${encodeURIComponent(result.code)}`);
    } catch {
      setError("The response was interrupted. Retry safely—the same checkout key prevents a duplicate order.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="checkout-form" onSubmit={submit}><h2>Delivery information</h2>{error&&<div className="form-error">{error}</div>}<div className="form-columns"><div className="field"><label>Full name</label><input className="form-control" required name="name" defaultValue={defaultName} maxLength={120}/></div><div className="field"><label>Email address</label><input className="form-control" type="email" required name="email" defaultValue={defaultEmail} maxLength={254}/></div><div className="field span-two"><label>Street address</label><input className="form-control" required name="address" autoComplete="street-address" maxLength={500}/></div><div className="field"><label>City</label><input className="form-control" required name="city" maxLength={120}/></div><div className="field"><label>Postal code</label><input className="form-control" required name="postal_code" maxLength={20}/></div><div className="field"><label>Country</label><input className="form-control" required name="country" defaultValue="India" maxLength={120}/></div><div className="field"><label>Phone number</label><input className="form-control" required name="phone" type="tel" maxLength={30}/></div>{couponsEnabled&&<div className="field span-two"><label>Coupon code</label><input className="form-control" name="couponCode" maxLength={80} placeholder="Optional" autoComplete="off"/></div>}<div className="field span-two"><label>Payment method</label><div className="radio-cards"><label className="radio-card"><input type="radio" name="payment" value="cod" defaultChecked/> Cash on delivery</label>{walletEnabled&&<label className="radio-card"><input type="radio" name="payment" value="wallet"/> Marketplace wallet</label>}</div></div></div><button disabled={busy||!lines.length} className="button button-primary" style={{width:"100%",marginTop:22}}>{busy?"Placing order…":<>Place order · <Money value={total}/></>}</button></form>;
}
