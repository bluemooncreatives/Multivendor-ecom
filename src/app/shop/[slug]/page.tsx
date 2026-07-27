import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product-card";
import { getProducts, getShop } from "@/lib/catalog";
import { asset } from "@/lib/utils";

export default async function ShopPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const shop=await getShop(slug);if(!shop)notFound();const products=await getProducts({sellerId:shop.userId,limit:40});return <main><section className="promo-banner"><div style={{display:"flex",alignItems:"center",gap:20}}><img src={asset(shop.logo)} alt="" style={{width:90,height:90,objectFit:"contain",background:"white",borderRadius:16}}/><div><span className="eyebrow">Verified marketplace shop</span><h2>{shop.name}</h2><p>{shop.description||shop.address||"Independent seller on V4Local"}</p></div></div></section><section className="home-section"><div className="section-heading"><div><h2>Products from {shop.name}</h2><p>{products.length} items available</p></div></div><ProductGrid products={products} empty="This shop has no published products right now."/></section></main>}
