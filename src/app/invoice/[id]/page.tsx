import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { Money } from "@/components/preferences-provider";
import { getSession } from "@/lib/auth";
import { connectMongo, objectId } from "@/lib/mongodb";
import { OrderModel } from "@/models";

type InvoiceItem = { _id: unknown; seller: unknown; name: string; variation?: string; quantity: number; unitPrice: number; tax: number; shipping: number; total: number };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(); if (!session) redirect("/login");
  const id = objectId((await params).id); if (!id) notFound();
  await connectMongo();
  const order = await OrderModel.findById(id).lean(); if (!order) notFound();
  const administrative = session.role === "admin" || session.role === "staff";
  const customer = String(order.customer || "") === session.id;
  const orderItems = order.items as unknown as InvoiceItem[];
  const seller = session.role === "seller" && orderItems.some((item) => String(item.seller) === session.id);
  if (!administrative && !customer && !seller) notFound();
  const items = seller ? orderItems.filter((item) => String(item.seller) === session.id) : orderItems;
  const itemTotal = items.reduce((sum, item) => sum + item.total, 0);
  return <main className="page-shell"><section className="content-card"><div className="workspace-toolbar"><div><span className="eyebrow">Tax invoice / order receipt</span><h1>Invoice {order.code}</h1><p>Issued {new Date(order.createdAt).toLocaleString()}</p></div><PrintButton/></div><div className="detail-meta"><div><span>Customer</span><strong>{order.shippingAddress?.name || order.guestEmail}</strong></div><div><span>Email</span><strong>{order.shippingAddress?.email || order.guestEmail}</strong></div><div><span>Payment</span><strong>{order.payment.method} · {order.payment.status}</strong></div><div><span>Order status</span><strong>{order.status}</strong></div></div><div className="callout"><strong>Delivery address</strong><p>{order.shippingAddress?.address}<br/>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}<br/>{order.shippingAddress?.country} · {order.shippingAddress?.phone}</p></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Item</th><th>Option</th><th>Quantity</th><th>Unit price</th><th>Tax</th><th>Shipping</th><th>Total</th></tr></thead><tbody>{items.map((item) => <tr key={String(item._id)}><td>{item.name}</td><td>{item.variation || "—"}</td><td>{item.quantity}</td><td><Money value={item.unitPrice}/></td><td><Money value={item.tax}/></td><td><Money value={item.shipping}/></td><td><Money value={item.total}/></td></tr>)}</tbody></table></div><div className="summary-card" style={{marginLeft:"auto",marginTop:24}}>{seller ? <div className="summary-row summary-total"><span>Seller items</span><strong><Money value={itemTotal}/></strong></div> : <><div className="summary-row"><span>Subtotal</span><strong><Money value={order.subtotal}/></strong></div><div className="summary-row"><span>Tax</span><strong><Money value={order.tax}/></strong></div><div className="summary-row"><span>Shipping</span><strong><Money value={order.shipping}/></strong></div><div className="summary-row"><span>Discount</span><strong>−<Money value={order.discount}/></strong></div><div className="summary-row summary-total"><span>Total</span><strong><Money value={order.total}/></strong></div></>}</div></section></main>;
}
