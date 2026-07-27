import { getSession } from "@/lib/auth";
import { connectMongo, objectId } from "@/lib/mongodb";
import { OrderModel } from "@/models";

interface TrackOrderRecord { code: string; status: string; payment?: { status?: string }; createdAt?: Date }

export default async function TrackOrder({ searchParams }: { searchParams: Promise<{ code?: string; contact?: string }> }) {
  const { code, contact } = await searchParams;
  let order: TrackOrderRecord | null = null;
  if (code?.trim() && contact?.trim()) {
    try {
      await connectMongo();
      const session = await getSession();
      const accountId = session ? objectId(session.id) : null;
      const identity = contact.trim().toLowerCase();
      order = await OrderModel.findOne({ code: code.trim().toUpperCase(), $or: [...(accountId ? [{ customer: accountId }] : []), { guestEmail: identity }, { "shippingAddress.email": identity }, { "shippingAddress.phone": contact.trim() }] }).select("code status payment.status createdAt").lean() as unknown as TrackOrderRecord | null;
    } catch {}
  }
  return <main className="page-shell policy"><span className="eyebrow">Order updates</span><h1>Track your order</h1><section className="content-card"><form className="form-grid"><div className="field"><label>Order reference</label><input className="form-control" name="code" defaultValue={code} placeholder="For example 20260727-A1B2C3D4" maxLength={40} required/></div><div className="field"><label>Order email or phone</label><input className="form-control" name="contact" defaultValue={contact} maxLength={254} required/></div><button className="button button-primary">Track order</button></form>{code && contact && (order ? <div className="callout" style={{marginTop:20}}>Order <strong>{order.code}</strong> is currently <strong>{order.status}</strong>. Payment: <strong>{order.payment?.status || "unpaid"}</strong>.</div> : <div className="form-error" style={{marginTop:20}}>No order matched those details.</div>)}</section></main>;
}
