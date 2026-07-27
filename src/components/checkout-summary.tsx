"use client";
import { useCart } from "@/components/cart-provider";
import { Money } from "@/components/preferences-provider";
export function CheckoutSummary(){const{lines,total}=useCart();return <aside className="summary-card"><h2>Your order</h2>{lines.map(line=><div className="summary-row" key={line.productId}><span>{line.name} × {line.quantity}</span><strong><Money value={line.price*line.quantity}/></strong></div>)}<div className="summary-row"><span>Delivery</span><span>At applicable rate</span></div><div className="summary-row summary-total"><span>Total</span><strong><Money value={total}/></strong></div></aside>}
