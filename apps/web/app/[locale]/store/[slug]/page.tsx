"use client";

import { use, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { CheckCircle2, MessageCircle, Store } from "lucide-react";
import { usePublicShop } from "@/lib/hooks/useSeller";
import { useProducts } from "@/lib/hooks/useProducts";
import { useStartConversation } from "@/lib/hooks/useConversations";
import { useAuthStore } from "@/lib/store";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SHOP_TABS = [
  { value: "all", label: "All products" },
  { value: "new", label: "New arrivals" },
  { value: "top", label: "Top rated" },
  { value: "cheapest", label: "Lowest price" },
] as const;

type ShopTab = (typeof SHOP_TABS)[number]["value"];

const TAB_SORT: Record<ShopTab, "newest" | "rating" | "price_asc"> = {
  all: "newest",
  new: "newest",
  top: "rating",
  cheapest: "price_asc",
};

export default function PublicShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: shop, isLoading } = usePublicShop(slug);
  const startConversation = useStartConversation();
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [message, setMessage] = useState("");

  // Legacy /shops/visit/{slug}/{type}: the same storefront, sorted differently.
  // Filters on `sellerId` (the vendor's user id), not the shop document id — the
  // latter matches nothing, so the grid was always empty.
  const [tab, setTab] = useState<ShopTab>("all");
  const { data: products } = useProducts({ sellerId: shop?.sellerId, sort: TAB_SORT[tab] });

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }
    if (!shop?.sellerId || !message.trim()) return;
    try {
      await startConversation.mutateAsync({ otherUserId: shop.sellerId, message });
      setMessage("");
      setShowMessageForm(false);
      toast.success("Message sent");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not send message");
    }
  }

  if (isLoading) return <div className="container py-10 text-muted-foreground">Loading…</div>;
  if (!shop) return <div className="container py-10">Shop not found.</div>;

  return (
    <div className="container space-y-6 py-6">
      <div className="overflow-hidden rounded-lg bg-card shadow-sm">
        <div className="relative h-40 bg-secondary sm:h-56">
          {shop.bannerUrl && <Image src={shop.bannerUrl} alt="" fill className="object-cover" />}
        </div>
        <div className="flex flex-col items-center gap-3 p-6 sm:flex-row">
          <div className="relative -mt-16 h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-card bg-muted">
            {shop.logoUrl ? (
              <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Store className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="flex items-center justify-center gap-2 text-xl font-bold sm:justify-start">
              {shop.name}
              {shop.verified && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </h1>
            {shop.description && <p className="mt-1 text-sm text-muted-foreground">{shop.description}</p>}
          </div>
          <Button variant="outline" className="sm:ms-auto" onClick={() => setShowMessageForm((v) => !v)}>
            <MessageCircle className="me-2 h-4 w-4" />
            Message seller
          </Button>
        </div>
        {showMessageForm && (
          <form className="flex gap-2 border-t p-4" onSubmit={handleSendMessage}>
            <Input
              placeholder="Ask the seller a question…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <Button type="submit" disabled={startConversation.isPending}>
              Send
            </Button>
          </form>
        )}
      </div>

      {!shop.verified && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          This seller has not completed verification yet. Take extra care before ordering.
        </p>
      )}

      <div className="rounded-lg bg-card p-4 shadow-sm md:p-6">
        <div className="mb-4 flex flex-wrap gap-4 border-b">
          {SHOP_TABS.map((shopTab) => (
            <button
              key={shopTab.value}
              type="button"
              onClick={() => setTab(shopTab.value)}
              className={`border-b-2 px-1 pb-2 text-sm font-semibold ${
                tab === shopTab.value ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              {shopTab.label}
            </button>
          ))}
        </div>
        {products && products.items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No products listed yet.</p>
        )}
      </div>
    </div>
  );
}
