import Link from "next/link";
import { getCategories } from "@/lib/catalog";
import { asset } from "@/lib/utils";

export default async function CategoriesPage(){const categories=await getCategories();return <main className="page-shell"><div className="page-heading"><div><span className="eyebrow">Shop your way</span><h1>All categories</h1><p>Browse every marketplace department.</p></div></div><div className="listing-grid">{categories.map((item)=><Link href={`/category/${encodeURIComponent(item.slug)}`} className="image-card" key={item.id}><img src={asset(item.banner)} alt={item.name}/><div><h2>{item.name}</h2><p>Explore products →</p></div></Link>)}</div></main>}
