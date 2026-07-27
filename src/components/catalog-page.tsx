import Link from "next/link";
import { getBrands, getCategories, getProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-card";

export async function CatalogPage({ title = "Explore all products", query, category, brand, deal }: { title?: string; query?: string; category?: string; brand?: string; deal?: boolean }) {
  const [products, categories, brands] = await Promise.all([getProducts({ query, category, brand, deal, limit: 60 }), getCategories(), getBrands()]);
  return <main className="page-shell catalog-layout">
    <aside className="filters"><h2>Browse</h2><Link href="/products" className={!category && !brand ? "active" : ""}>All products</Link><h3>Categories</h3>{categories.map((item) => <Link className={category === item.slug ? "active" : ""} href={`/category/${encodeURIComponent(item.slug)}`} key={item.id}>{item.name}</Link>)}<h3>Brands</h3>{brands.slice(0, 12).map((item) => <Link className={brand === item.slug ? "active" : ""} href={`/brand/${encodeURIComponent(item.slug)}`} key={item.id}>{item.name}</Link>)}</aside>
    <section className="catalog-content"><div className="page-heading"><div><span className="eyebrow">Marketplace</span><h1>{title}</h1><p>{products.length} products available</p></div><form action="/search" className="sort-search"><input name="q" defaultValue={query} placeholder="Filter products" /><button className="button">Search</button></form></div><ProductGrid products={products} /></section>
  </main>;
}
