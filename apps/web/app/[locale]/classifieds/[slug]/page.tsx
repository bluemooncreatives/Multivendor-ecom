"use client";

import { use, useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { useClassified } from "@/lib/hooks/useStorefront";
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { useAuthStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ClassifiedDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const { data: item, isLoading } = useClassified(slug);
  const { display } = useDisplayCurrency();
  const isSignedIn = useAuthStore((s) => Boolean(s.accessToken));
  const [showPhone, setShowPhone] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) return <div className="container py-10 text-muted-foreground">Loading…</div>;
  if (!item) return <div className="container py-10">That listing is no longer available.</div>;

  const categoryName = typeof item.categoryId === "object" ? item.categoryId.name : null;

  return (
    <div className="container space-y-6 py-6">
      <div className="grid gap-8 rounded-lg bg-card p-4 shadow-sm md:grid-cols-2 md:p-6">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            {item.images[activeImage] && <Image src={item.images[activeImage]} alt={item.title} fill className="object-cover" />}
          </div>
          {item.images.length > 1 && (
            <div className="flex gap-2">
              {item.images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative h-16 w-16 overflow-hidden rounded-md border-2 ${i === activeImage ? "border-primary" : "border-transparent"}`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {item.condition}
            </Badge>
            {categoryName && <Badge variant="outline">{categoryName}</Badge>}
          </div>

          <h1 className="text-2xl font-bold">{item.title}</h1>
          <p className="text-2xl font-bold text-primary">{display(item.price, item.currency)}</p>

          {item.location && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {item.location}
            </p>
          )}
          <p className="text-xs text-muted-foreground">Listed {new Date(item.createdAt).toLocaleDateString()}</p>

          <div className="rounded-md border p-4">
            <p className="mb-2 text-sm font-medium">Contact the seller</p>
            {/* Hidden behind sign-in and a click, so the number is not scrapeable
                from the page source by anyone crawling the listings. */}
            {!isSignedIn ? (
              <Button asChild variant="outline">
                <Link href={`/${locale}/login`}>Sign in to see the phone number</Link>
              </Button>
            ) : showPhone ? (
              <p className="flex items-center gap-2 font-mono text-lg">
                <Phone className="h-4 w-4" />
                {item.contactPhone}
              </p>
            ) : (
              <Button variant="outline" onClick={() => setShowPhone(true)}>
                Show phone number
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-card p-4 shadow-sm md:p-6">
        <h2 className="mb-2 font-semibold">Description</h2>
        <p className="whitespace-pre-line text-sm text-muted-foreground">{item.description}</p>
      </div>
    </div>
  );
}
