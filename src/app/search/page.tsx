import { CatalogPage } from "@/components/catalog-page";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const brand = typeof params.brand === "string" ? params.brand : undefined;
  return <CatalogPage title={query ? `Results for “${query}”` : category ? "Category products" : brand ? "Brand products" : "Search products"} query={query} category={category} brand={brand} />;
}
