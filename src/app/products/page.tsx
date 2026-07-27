import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog-page";

export const metadata: Metadata = { title: "All products" };
export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <CatalogPage title={params.deal === "1" ? "Today's deals" : "Explore all products"} query={typeof params.q === "string" ? params.q : undefined} category={typeof params.category === "string" ? params.category : undefined} brand={typeof params.brand === "string" ? params.brand : undefined} deal={params.deal === "1"} />;
}
