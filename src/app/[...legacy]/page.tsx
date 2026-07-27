import mongoose from "mongoose";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspacePage } from "@/components/workspace-page";
import { getSession } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { stripHtml, titleFromSlug } from "@/lib/utils";
import { SettingModel } from "@/models";

const customerRoutes: Record<string,string> = { profile:"profile", addresses:"profile", purchase_history:"purchase_history", digital_purchase_history:"digital_purchase_history", wishlists:"wishlists", wallet:"wallet", support_ticket:"support_ticket", conversations:"conversations", messages:"conversations", customer_products:"customer_products", affiliate:"affiliate" };
const sellerRoutes: Record<string,string> = { orders:"orders", reviews:"reviews", withdraw_requests:"withdraw_requests", withdraw_requests_all:"withdraw_requests", payments:"payments", digitalproducts:"digitalproducts", "product-bulk-upload/index":"products", "product-bulk-export":"products", "shop/apply_for_verification":"shop" };
const policyRoutes: Record<string,string> = { sellerpolicy:"Seller policy", returnpolicy:"Return policy", supportpolicy:"Support policy", terms:"Terms and conditions", privacypolicy:"Privacy policy" };

export default async function LegacyPage({ params, searchParams }: { params: Promise<{legacy:string[]}>; searchParams: Promise<{q?:string}> }) {
  const [{legacy},{q}] = await Promise.all([params,searchParams]); const route=legacy.join("/");
  if(route==="users/login")redirect("/login"); if(route==="users/registration")redirect("/register");
  if(route.startsWith("shops/visit/"))redirect(`/shop/${encodeURIComponent(legacy[2])}`);
  if(route.startsWith("flash-deal/"))redirect("/products?deal=1");
  if(/^invoice\/(customer|seller)\/[^/]+$/.test(route))redirect(`/invoice/${encodeURIComponent(legacy[2])}`);
  if(/^product\/[^/]+\/edit$/.test(route))redirect("/seller/products");
  if(/^digitalproducts\/download\/[^/]+$/.test(route))redirect(`/api/downloads/${encodeURIComponent(legacy[2])}`);
  if(route==="customer-products"){
    await connectMongo(); const setting=await SettingModel.findOne({key:"business.classified_product"}).select("value").lean();
    if(!(setting?.value===true||String(setting?.value)==="1"))notFound();
    const products=await mongoose.connection.db!.collection("classifiedproducts").find({published:{$ne:false},status:{$nin:["deleted","rejected"]}}).sort({createdAt:-1}).limit(100).toArray();
    return <main className="page-shell"><div className="page-heading"><div><span className="eyebrow">Community listings</span><h1>Classified products</h1></div></div><div className="product-grid">{products.map((product)=><article className="product-card" key={String(product._id)}><div className="product-info"><h3>{String(product.name||"Listing")}</h3><p>{stripHtml(String(product.description||""))}</p></div></article>)}</div></main>;
  }
  if(route.startsWith("customer-product/")){await connectMongo();const setting=await SettingModel.findOne({key:"business.classified_product"}).select("value").lean();if(!(setting?.value===true||String(setting?.value)==="1"))notFound();const product=await mongoose.connection.db!.collection("classifiedproducts").findOne({$or:[{slug:legacy[1]},...(mongoose.isValidObjectId(legacy[1])?[{_id:new mongoose.Types.ObjectId(legacy[1])}]:[])]});if(!product)notFound();return <main className="page-shell policy"><span className="eyebrow">Classified listing</span><h1>{String(product.name)}</h1><article><p>{stripHtml(String(product.description||""))}</p></article></main>}
  if(customerRoutes[route])return <WorkspacePage workspace="customer" path={customerRoutes[route]} search={q||""}/>;
  if(sellerRoutes[route]){const session=await getSession();if(session?.role==="seller"||session?.role==="admin")return <WorkspacePage workspace="seller" path={sellerRoutes[route]} search={q||""}/>;if(route==="orders")return <WorkspacePage workspace="customer" path="purchase_history" search={q||""}/>;redirect(`/login?next=/${encodeURIComponent(route)}`)}
  if(policyRoutes[route]){let content="";try{await connectMongo();const setting=await SettingModel.findOne({key:`policy.${route.replace("policy","")}`,public:true}).lean();content=typeof setting?.value==="string"?setting.value:""}catch{}return <main className="page-shell policy"><span className="eyebrow">Marketplace information</span><h1>{policyRoutes[route]}</h1><article>{content?<p>{stripHtml(content)}</p>:<p>This policy is managed from the administration workspace.</p>}</article></main>}
  if(legacy.length===1){try{await connectMongo();const page=await mongoose.connection.db!.collection("pages").findOne({slug:route,published:{$ne:false}});if(page)return <main className="page-shell policy"><span className="eyebrow">Marketplace information</span><h1>{String(page.title||titleFromSlug(route))}</h1><article><p>{stripHtml(String(page.content||""))}</p></article></main>}catch{}}
  return <main className="not-found"><h1>404</h1><h2>{titleFromSlug(route)} is not available</h2><p>The requested route is unavailable or its legacy feature is disabled.</p><Link className="button button-primary" href="/">Return home</Link></main>;
}
