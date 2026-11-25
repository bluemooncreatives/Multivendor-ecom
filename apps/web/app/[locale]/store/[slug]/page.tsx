"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  MessageCircle,
  Store,
  AlertTriangle,
  ShoppingBag,
  MapPin,
  Star,
  Package,
  X,
} from "lucide-react";
import { usePublicShop } from "@/lib/hooks/useSeller";
import { useProducts } from "@/lib/hooks/useProducts";
import { useStartConversation } from "@/lib/hooks/useConversations";
import { useAuthStore } from "@/lib/store";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { DetailPageSkeleton } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { getApiErrorMessage } from "@/lib/utils";
import { cn } from "@/lib/utils";

const SHOP_TABS = [
  { value: "all", label: "All Products" },
  { value: "new", label: "New Arrivals" },
  { value: "top", label: "Top Rated" },
  { value: "cheapest", label: "Lowest Price" },
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
  const { data: products, isLoading: loadingProducts } = useProducts({
    sellerId: shop?.sellerId,
    sort: TAB_SORT[tab],
  });

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
      toast.success("Message sent! 📨");
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
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="container space-y-6 py-6 lg:py-8">
      {/* Verification warning */}
      {!shop.verified && (
        <Alert variant="warning" className="rounded-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This seller has not completed verification yet. Take extra care before ordering.
          </AlertDescription>
        </Alert>
      )}

      {/* Store hero */}
      <div className="overflow-hidden rounded-3xl border bg-card shadow-xs">
        {/* Banner */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-secondary via-muted to-secondary sm:h-64">
          {shop.bannerUrl && (
            <Image src={shop.bannerUrl} alt="" fill className="object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Store info */}
        <div className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            {/* Avatar */}
            <div className="-mt-14 flex items-end gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl border-4 border-card bg-muted shadow-lg">
                {shop.logoUrl ? (
                  <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Store className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="mb-1 space-y-1">
                <h1 className="flex flex-wrap items-center gap-2 text-display text-3xl font-bold leading-tight">
                  {shop.name}
                  {shop.verified && (
                    <CheckCircle2 className="h-6 w-6 text-foreground" />
                  )}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {shop.description && (
                    <span className="max-w-sm truncate">{shop.description}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant={showMessageForm ? "default" : "outline"}
                className="rounded-xl"
                onClick={() => setShowMessageForm((v) => !v)}
              >
                <MessageCircle className="h-4 w-4" />
                {showMessageForm ? "Cancel" : "Message Seller"}
              </Button>
            </div>
          </div>

          {/* Message form */}
          {showMessageForm && (
            <form
              className="mt-5 flex gap-2 border-t pt-5"
              onSubmit={handleSendMessage}
            >
              <Input
                placeholder="Ask the seller a question…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="h-11 flex-1 rounded-xl"
              />
              <Button type="submit" disabled={startConversation.isPending} className="rounded-xl">
                Send
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Products section */}
      <div className="overflow-hidden rounded-3xl border bg-card shadow-xs">
        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto border-b bg-muted/20 p-3">
          {SHOP_TABS.map((shopTab) => (
            <Button
              key={shopTab.value}
              type="button"
              variant={tab === shopTab.value ? "default" : "ghost"}
              size="sm"
              className="shrink-0"
              onClick={() => setTab(shopTab.value)}
            >
              {shopTab.label}
            </Button>
          ))}
        </div>

        <div className="p-5 md:p-6">
          <ProductGrid
            products={products?.items}
            isLoading={loadingProducts}
            emptyTitle="No products listed yet"
            emptyDescription="Check back soon for new listings from this shop."
            columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          />
        </div>
      </div>
    </div>
  );
}
