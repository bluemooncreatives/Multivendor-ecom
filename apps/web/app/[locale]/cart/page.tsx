"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useCart, useRemoveCartItem, useSetCartItem, type CartLineDetail } from "@/lib/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckoutSteps } from "@/components/storefront/checkout-steps";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-state";
import { formatPrice } from "@/lib/format";

function CartRow({ item }: { item: CartLineDetail }) {
  const removeItem = useRemoveCartItem();
  const setItem = useSetCartItem();

  function changeQuantity(delta: number) {
    const next = item.quantity + delta;
    if (next < 1) return;
    setItem.mutate({ productId: item.productId, variantSku: item.variantSku, quantity: next });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b py-4 last:border-0">
      <div className="flex min-w-[200px] flex-1 items-center gap-3.5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {item.productImage ? (
            <Image src={item.productImage} alt={item.productName ?? ""} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">No img</div>
          )}
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-semibold">{item.productName}</p>
          {Object.keys(item.variantAttributes).length > 0 && (
            <p className="text-xs text-muted-foreground">{Object.values(item.variantAttributes).join(" / ")}</p>
          )}
          <p className="text-xs text-muted-foreground">Sold by {item.sellerName}</p>
        </div>
      </div>

      <div className="flex items-center rounded-lg border bg-background">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-e-none"
          onClick={() => changeQuantity(-1)}
          disabled={item.quantity <= 1 || setItem.isPending}
          aria-label="Decrease quantity"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-s-none"
          onClick={() => changeQuantity(1)}
          disabled={item.quantity >= item.available || setItem.isPending}
          aria-label="Increase quantity"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <p className="w-24 text-end font-semibold">{formatPrice(item.lineTotal, item.currency)}</p>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => removeItem.mutate({ productId: item.productId, variantSku: item.variantSku })}
        aria-label="Remove item"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function CartPage() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { data: cart, isLoading } = useCart();

  return (
    <div className="container space-y-6 py-6 lg:py-8">
      <CheckoutSteps current={1} />
      <PageHeader title={t("title")} />

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : !cart || cart.items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={t("empty")}
          description="Add items to your cart to review quantities and proceed to checkout."
          action={
            <Button asChild>
              <Link href={`/${locale}/products`}>Return to Shop</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <Card>
            <CardContent className="p-4 md:p-6">
              {cart.items.map((item) => (
                <CartRow key={`${item.productId}-${item.variantSku}`} item={item} />
              ))}
              <div className="pt-5">
                <Button asChild variant="outline">
                  <Link href={`/${locale}/products`}>Return to Shop</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="font-medium">{formatPrice(cart.subtotal ?? 0, cart.items[0]?.currency)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(cart.subtotal ?? 0, cart.items[0]?.currency)}</span>
              </div>
              <Button asChild size="lg" className="w-full">
                <Link href={`/${locale}/checkout`}>
                  {t("checkout")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
