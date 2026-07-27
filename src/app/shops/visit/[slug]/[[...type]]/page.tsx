import { redirect } from "next/navigation";
export default async function LegacyShopVisit({params}:{params:Promise<{slug:string}>}){const{slug}=await params;redirect(`/shop/${encodeURIComponent(slug)}`)}
