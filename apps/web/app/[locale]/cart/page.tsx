"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight, ShoppingCart } from "lucide-react";
import { useCart, useRemoveCartItem, useSetCartItem, type CartLineDetail } from "@/lib/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckoutSteps } from "@/components/storefront/checkout-steps";
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
    <div className="flex flex-wrap items-center gap-4 py-5 last:pb-0">
      {/* Product image */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-muted">
        {item.productImage ? (
          <Image
            src={item.productImage}
            alt={item.productName ?? ""}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No img
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="min-w-[180px] flex-1 space-y-1">
        <p className="font-semibold leading-snug">{item.productName}</p>
        {Object.keys(item.variantAttributes).length > 0 && (
          <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-xs font-normal">
            {Object.values(item.variantAttributes).join(" / ")}
          </Badge>
        )}
        <p className="text-xs text-muted-foreground">
          Sold by{" "}
          <span className="font-medium text-foreground/80">{item.sellerName}</span>
        </p>
      </div>

      {/* Quantity control */}
      <div className="flex items-center overflow-hidden rounded-xl border bg-background">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-none rounded-s-xl"
          onClick={() => changeQuantity(-1)}
          disabled={item.quantity <= 1 || setItem.isPending}
          aria-label="Decrease quantity"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-9 text-center text-sm font-bold">{item.quantity}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-none rounded-e-xl"
          onClick={() => changeQuantity(1)}
          disabled={item.quantity >= item.available || setItem.isPending}
          aria-label="Increase quantity"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Line total */}
      <p className="w-28 text-end text-base font-black text-primary">
        {formatPrice(item.lineTotal, item.currency)}
      </p>

      {/* Remove */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => removeItem.mutate({ productId: item.productId, variantSku: item.variantSku })}
        aria-label="Remove item"
        className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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

      {/* Page title */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t("title")}</h1>
          {cart && cart.items.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {cart.items.length} item{cart.items.length !== 1 ? "s" : ""} in your cart
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : !cart || cart.items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={t("empty")}
          description="Add items to your cart to review quantities and proceed to checkout."
          action={
            <Button asChild size="lg" className="rounded-2xl">
              <Link href={`/${locale}/products`}>
                <ShoppingBag className="h-4 w-4" />
                Start Shopping
              </Link>
            </Button>
          }
          size="lg"
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* Cart items */}
          <Card className="rounded-3xl shadow-xs">
            <CardContent className="divide-y p-5 md:p-7">
              {cart.items.map((item) => (
                <CartRow key={`${item.productId}-${item.variantSku}`} item={item} />
              ))}
            </CardContent>
            <div className="border-t px-7 py-4">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/${locale}/products`}>← Continue Shopping</Link>
              </Button>
            </div>
          </Card>

          {/* Order summary */}
          <div className="space-y-4">
            <Card className="rounded-3xl shadow-xs">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-black">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                {/* Items */}
                {cart.items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantSku}`}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate text-muted-foreground">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="shrink-0 font-semibold">
                      {formatPrice(item.lineTotal, item.currency)}
                    </span>
                  </div>
                ))}

                <Separator />

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t("subtotal")}</span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(cart.subtotal ?? 0, cart.items[0]?.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-semibold text-success">Calculated at checkout</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-lg font-black">Total</span>
                  <span className="text-2xl font-black text-primary">
                    {formatPrice(cart.subtotal ?? 0, cart.items[0]?.currency)}
                  </span>
                </div>

                <Button asChild size="lg" className="w-full rounded-2xl font-bold shadow-colored shadow-sm">
                  <Link href={`/${locale}/checkout`}>
                    {t("checkout")}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Taxes and shipping calculated at checkout
                </p>
              </CardContent>
            </Card>

            {/* Trust badges */}
            <div className="rounded-2xl border bg-card p-4">
              <div className="space-y-2.5 text-xs text-muted-foreground">
                {["🔒 Secure 256-bit SSL encryption", "✓ 30-day hassle-free returns", "⚡ Fast & free shipping on eligible orders"].map(
                  (item) => (
                    <p key={item}>{item}</p>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
