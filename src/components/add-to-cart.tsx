"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "@/components/cart-provider";
import { Icon } from "@/components/icon";

export function AddToCart({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [variation, setVariation] = useState(product.variants.find((item) => item.stock > 0)?.name || "");
  const selected = useMemo(() => product.variants.find((item) => item.name === variation), [product.variants, variation]);
  const available = selected?.stock ?? product.stock;
  if (compact && product.variants.length) return <button className="icon-button" onClick={() => window.location.assign(`/product/${encodeURIComponent(product.slug)}`)} aria-label={`Choose options for ${product.name}`}><Icon name="bag"/></button>;
  const button = <button className={compact ? "icon-button" : "button button-primary"} disabled={available <= 0 || Boolean(product.variants.length && !selected)} onClick={() => { add(product, product.minQuantity, variation || undefined); setAdded(true); window.setTimeout(() => setAdded(false), 1200); }} aria-label={`Add ${product.name} to cart`}><Icon name="bag"/> {!compact && (available <= 0 ? "Out of stock" : added ? "Added to cart" : "Add to cart")}</button>;
  if (!product.variants.length || compact) return button;
  return <div className="form-grid"><div className="field"><label>Option</label><select className="form-control" value={variation} onChange={(event) => setVariation(event.target.value)}>{product.variants.map((item) => <option key={item.name} value={item.name} disabled={item.stock <= 0}>{item.name} · {item.stock} available</option>)}</select></div>{button}</div>;
}
