import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { Money } from "@/components/preferences-provider";
import { ProductAccountActions } from "@/components/product-account-actions";
import { ProductGrid } from "@/components/product-card";
import { getProduct, getProducts } from "@/lib/catalog";
import { getSession } from "@/lib/auth";
import { asset, stripHtml } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const product = await getProduct(slug); return product ? { title: product.name, description: stripHtml(product.description).slice(0,155), openGraph: { images: product.thumbnail ? [asset(product.thumbnail)] : [] } } : { title: "Product not found" }; }
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; if(slug==="upload"){const user=await getSession();if(user?.role==="seller"||user?.role==="admin")redirect("/seller/products");redirect("/login?next=/seller/products")} const product = await getProduct(slug); if (!product) notFound();
  const related = (await getProducts({ limit: 8 })).filter((item) => item.id !== product.id && item.categoryId === product.categoryId).slice(0,4);
  return <main><section className="page-shell detail-grid"><div className="detail-gallery"><img src={asset(product.photos[0] || product.thumbnail)} alt={product.name}/></div><div className="detail-content"><span className="eyebrow">Local marketplace product</span><h1>{product.name}</h1><div className="rating"><span>★</span> {product.rating.toFixed(1)} · {product.sales} sold</div><div className="detail-price"><strong><Money value={product.salePrice}/></strong>{product.salePrice<product.price&&<del><Money value={product.price}/></del>}</div><p className="detail-description">{stripHtml(product.description) || "A quality product offered by a seller on the V4Local marketplace."}</p><div className="detail-actions"><AddToCart product={product}/><Link className="button" href="/cart">View cart</Link></div><ProductAccountActions productId={product.id} productName={product.name} sellerId={product.sellerId}/><div className="detail-meta"><div><span>Availability</span><strong>{product.stock>0?`${product.stock} in stock`:"Out of stock"}</strong></div><div><span>Minimum quantity</span><strong>{product.minQuantity}</strong></div><div><span>Unit</span><strong>{product.unit}</strong></div><div><span>Product type</span><strong>{product.digital?"Digital":"Physical"}</strong></div></div></div></section>{related.length>0&&<section className="home-section"><div className="section-heading"><div><span className="eyebrow">You may also like</span><h2>Related products</h2></div></div><ProductGrid products={related}/></section>}</main>;
}
