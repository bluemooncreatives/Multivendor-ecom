import Link from "next/link";
import type { Product } from "@/lib/types";
import { asset } from "@/lib/utils";
import { AddToCart } from "@/components/add-to-cart";
import { Money } from "@/components/preferences-provider";

export function ProductCard({ product }: { product: Product }) {
  const discount = product.price > product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0;
  return <article className="product-card">
    <div className="product-media">
      <Link href={`/product/${encodeURIComponent(product.slug)}`}><img src={asset(product.thumbnail)} alt={product.name} loading="lazy" /></Link>
      {discount > 0 && <span className="discount-badge">-{discount}%</span>}
      <div className="product-quick"><AddToCart product={product} compact /></div>
    </div>
    <div className="product-info">
      <div className="rating" aria-label={`${product.rating} out of 5 stars`}><span>★</span> {product.rating.toFixed(1)} <small>({product.sales})</small></div>
      <h3><Link href={`/product/${encodeURIComponent(product.slug)}`}>{product.name}</Link></h3>
      <div className="price-row"><strong><Money value={product.salePrice}/></strong>{product.salePrice < product.price && <del><Money value={product.price}/></del>}</div>
      <p className={product.stock > 0 ? "stock in-stock" : "stock out-stock"}>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
    </div>
  </article>;
}

export function ProductGrid({ products, empty = "No products matched your filters." }: { products: Product[]; empty?: string }) {
  if (!products.length) return <div className="empty-state"><span>⌕</span><h2>Nothing here yet</h2><p>{empty}</p><Link className="button button-primary" href="/products">Browse all products</Link></div>;
  return <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id} />)}</div>;
}
