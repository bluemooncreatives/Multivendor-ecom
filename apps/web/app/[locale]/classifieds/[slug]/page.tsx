"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { MapPin, Phone, Tag } from "lucide-react";
import { useClassified } from "@/lib/hooks/useStorefront";
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { useAuthStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPageSkeleton } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

export default function ClassifiedDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const { data: item, isLoading } = useClassified(slug);
  const { display } = useDisplayCurrency();
  const isSignedIn = useAuthStore((s) => Boolean(s.accessToken));
  const [showPhone, setShowPhone] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) return <DetailPageSkeleton />;
  if (!item) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={Tag}
          title="Listing unavailable"
          description="That listing is no longer available."
          action={
            <Button asChild>
              <Link href={`/${locale}/classifieds`}>Back to classifieds</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const categoryName = typeof item.categoryId === "object" ? item.categoryId.name : null;

  return (
    <div className="container space-y-6 py-6 lg:py-8">
      <Card>
        <CardContent className="grid gap-8 p-5 md:grid-cols-2 md:p-8">
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
              {item.images[activeImage] ? (
                <Image src={item.images[activeImage]} alt={item.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
              )}
            </div>
            {item.images.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {item.images.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "relative h-16 w-16 overflow-hidden rounded-lg border-2",
                      i === activeImage ? "border-primary" : "border-transparent opacity-75 hover:opacity-100",
                    )}
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

            <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>
            <p className="text-2xl font-bold text-primary">{display(item.price, item.currency)}</p>

            {item.location && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary/70" />
                {item.location}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Listed {new Date(item.createdAt).toLocaleDateString()}</p>

            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="mb-2 text-sm font-semibold">Contact the seller</p>
              {!isSignedIn ? (
                <Button asChild variant="outline">
                  <Link href={`/${locale}/login`}>Sign in to see the phone number</Link>
                </Button>
              ) : showPhone ? (
                <p className="flex items-center gap-2 font-mono text-lg font-semibold">
                  <Phone className="h-4 w-4 text-primary" />
                  {item.contactPhone}
                </p>
              ) : (
                <Button variant="outline" onClick={() => setShowPhone(true)}>
                  Show phone number
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
