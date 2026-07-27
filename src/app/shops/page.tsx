import Link from "next/link";
import { getShops } from "@/lib/catalog";
import { asset } from "@/lib/utils";

export default async function ShopsPage(){const shops=await getShops();return <main className="page-shell"><div className="page-heading"><div><span className="eyebrow">Shop independently</span><h1>Local seller shops</h1><p>Meet the businesses behind the products.</p></div></div><div className="listing-grid">{shops.map((shop)=><Link href={`/shop/${encodeURIComponent(shop.slug)}`} className="image-card" key={shop.id}><img src={asset(shop.logo)} alt={shop.name}/><div><h2>{shop.name}</h2><p>{shop.address||"Independent marketplace seller"}</p></div></Link>)}</div></main>}
