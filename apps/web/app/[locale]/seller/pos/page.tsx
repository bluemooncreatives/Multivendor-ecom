"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useSellerProducts, useCreatePosSale } from "@/lib/hooks/useSeller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

interface Line {
  productId: string;
  variantSku: string;
  name: string;
  price: number;
  quantity: number;
}

export default function PosPage() {
  const { data: products } = useSellerProducts();
  const createSale = useCreatePosSale();
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  function addLine() {
    const product = products?.find((p) => p.id === selectedProductId);
    const variant = product?.variants[0];
    if (!product || !variant) return;
    setLines((prev) => [...prev, { productId: product.id, variantSku: variant.sku, name: product.name, price: variant.price, quantity: 1 }]);
  }

  async function handleCheckout() {
    try {
      const order = await createSale.mutateAsync(
        lines.map((l) => ({ productId: l.productId, variantSku: l.variantSku, quantity: l.quantity })),
      );
      toast.success(`Sale recorded: ${order.code}`);
      setLines([]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not record sale");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Point of sale</h1>
      <Card>
        <CardContent className="flex gap-2 pt-6">
          <select
            className="h-10 flex-1 rounded-md border bg-background px-3 text-sm"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">Select a product</option>
            {products?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button type="button" onClick={addLine}>
            Add
          </Button>
        </CardContent>
      </Card>

      {lines.length > 0 && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            {lines.map((line, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm">
                <span>{line.name}</span>
                <Input
                  type="number"
                  min={1}
                  className="w-20"
                  value={line.quantity}
                  onChange={(e) =>
                    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, quantity: Number(e.target.value) } : l)))
                  }
                />
                <span>{formatPrice(line.price * line.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-3 font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Button className="w-full" onClick={handleCheckout} disabled={createSale.isPending}>
              Complete sale
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
