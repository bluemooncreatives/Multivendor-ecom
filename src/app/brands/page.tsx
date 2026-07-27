import Link from "next/link";
import { getBrands } from "@/lib/catalog";
import { asset } from "@/lib/utils";

export default async function BrandsPage(){const brands=await getBrands();return <main className="page-shell"><div className="page-heading"><div><span className="eyebrow">Marketplace labels</span><h1>All brands</h1><p>Discover established and emerging names.</p></div></div><div className="brand-grid">{brands.map((item)=><Link href={`/brand/${encodeURIComponent(item.slug)}`} className="brand-tile" key={item.id}>{item.logo&&<img src={asset(item.logo)} alt=""/>}<span>{item.name}</span></Link>)}</div></main>}
