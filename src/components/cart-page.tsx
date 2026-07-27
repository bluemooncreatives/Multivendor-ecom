"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { Money } from "@/components/preferences-provider";
import { asset } from "@/lib/utils";

export function CartPage() {
  const { lines, total, update, remove } = useCart();
  if (!lines.length) return <main className="page-shell"><div className="empty-state"><span>🛍</span><h1>Your cart is empty</h1><p>Add something from a local seller to get started.</p><Link href="/products" className="button button-primary">Browse products</Link></div></main>;
  return <main className="page-shell"><div className="page-heading"><div><span className="eyebrow">Your selection</span><h1>Shopping cart</h1><p>{lines.length} unique items</p></div></div><div className="cart-layout"><section className="cart-lines">{lines.map((line)=><article className="cart-line" key={`${line.productId}-${line.variation||""}`}><img src={asset(line.image)} alt={line.name}/><div><h3><Link href={`/product/${encodeURIComponent(line.slug)}`}>{line.name}</Link></h3>{line.variation&&<small>{line.variation}</small>}<strong><Money value={line.price}/></strong></div><div className="quantity"><button onClick={()=>update(line.productId,line.quantity-1,line.variation)} aria-label="Decrease quantity">−</button><span>{line.quantity}</span><button onClick={()=>update(line.productId,line.quantity+1,line.variation)} aria-label="Increase quantity">+</button></div><button className="remove-button" onClick={()=>remove(line.productId,line.variation)}>Remove</button></article>)}</section><aside className="summary-card"><h2>Order summary</h2><div className="summary-row"><span>Subtotal</span><strong><Money value={total}/></strong></div><div className="summary-row"><span>Delivery</span><span>Calculated at checkout</span></div><div className="summary-row summary-total"><span>Total</span><strong><Money value={total}/></strong></div><Link className="button button-primary" href="/checkout">Continue to checkout</Link><Link className="button" href="/products">Keep shopping</Link></aside></div></main>;
}
