"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { CheckCircle2, MessageCircle, Store, AlertTriangle } from "lucide-react";
import { usePublicShop } from "@/lib/hooks/useSeller";
import { useProducts } from "@/lib/hooks/useProducts";
import { useStartConversation } from "@/lib/hooks/useConversations";
import { useAuthStore } from "@/lib/store";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailPageSkeleton } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { getApiErrorMessage } from "@/lib/utils";

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

  const [tab, setTab] = useState<ShopTab>("all");
  const { data: products, isLoading: loadingProducts } = useProducts({ sellerId: shop?.sellerId, sort: TAB_SORT[tab] });

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
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not send message"));
    }
  }

  if (isLoading) return <DetailPageSkeleton />;
  if (!shop) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={Store}
          title="Shop not found"
          description="This storefront does not exist or has been closed."
          action={
            <Button asChild>
              <Link href={`/${locale}/products`}>Browse products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container space-y-6 py-6 lg:py-8">
      <Card className="overflow-hidden">
        <div className="relative h-44 bg-gradient-to-r from-secondary to-muted sm:h-60">
          {shop.bannerUrl && <Image src={shop.bannerUrl} alt="" fill className="object-cover" />}
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <div className="relative -mt-16 h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-card bg-muted shadow-md">
              {shop.logoUrl ? (
                <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Store className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-start">
              <h1 className="flex items-center justify-center gap-2 text-2xl font-bold sm:justify-start">
                {shop.name}
                {shop.verified && <CheckCircle2 className="h-5 w-5 text-primary" />}
              </h1>
              {shop.description && <p className="mt-1 text-sm text-muted-foreground">{shop.description}</p>}
            </div>
            <Button variant="outline" onClick={() => setShowMessageForm((v) => !v)}>
              <MessageCircle className="h-4 w-4" />
              Message seller
            </Button>
          </div>

          {showMessageForm && (
            <form className="mt-5 flex gap-2 border-t pt-4" onSubmit={handleSendMessage}>
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
        </CardContent>
      </Card>

      {!shop.verified && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This seller has not completed verification yet. Take extra care before ordering.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="space-y-5 p-5 md:p-6">
          <div className="flex flex-wrap gap-2 border-b pb-3">
            {SHOP_TABS.map((shopTab) => (
              <Button
                key={shopTab.value}
                type="button"
                variant={tab === shopTab.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setTab(shopTab.value)}
              >
                {shopTab.label}
              </Button>
            ))}
          </div>

          <ProductGrid
            products={products?.items}
            isLoading={loadingProducts}
            emptyTitle="No products listed yet"
            emptyDescription="Check back soon for new listings from this shop."
          />
        </CardContent>
      </Card>
    </div>
  );
}
