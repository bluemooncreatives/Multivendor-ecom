"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  useAdminSellers,
  useSellerDetail,
  usePayToSeller,
  useSellerPayouts,
  usePendingShopVerifications,
  useVerifySeller,
} from "@/lib/hooks/useAdminPeople";
import { useBanUser } from "@/lib/hooks/useAdmin";
import { useImpersonateUser } from "@/lib/hooks/useAdminCatalogExtras";
import { downloadCsv } from "@/lib/hooks/useAdminCommerce";
import { useAuthStore } from "@/lib/store";
import { setAccessToken } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminSellersPage() {
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: sellers, isLoading } = useAdminSellers({ q: query || undefined });
  const { data: verifications } = usePendingShopVerifications();
  const verifySeller = useVerifySeller();
  const banUser = useBanUser();
  const impersonate = useImpersonateUser();
  const setSession = useAuthStore((s) => s.setSession);
  const [openSeller, setOpenSeller] = useState<string | null>(null);

  async function handleImpersonate(userId: string) {
    const result = await impersonate.mutateAsync(userId);
    setAccessToken(result.accessToken);
    setSession(result.user, result.accessToken, null);
    router.push(`/${locale}/seller`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Sellers</h1>
        <Button variant="outline" size="sm" onClick={() => downloadCsv("/catalog/admin/sellers/export", "sellers.csv")}>
          Export sellers CSV
        </Button>
      </div>

      {verifications && verifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shop verifications awaiting review ({verifications.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {verifications.map(
              (shop: {
                id: string;
                name: string;
                verificationDocs: string[];
                sellerId?: { id: string; name: string; email: string };
              }) => (
                <div key={shop.id} className="space-y-2 rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{shop.name}</p>
                      <p className="text-muted-foreground">
                        {shop.sellerId?.name} · {shop.sellerId?.email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => verifySeller.mutate({ sellerId: shop.sellerId!.id, approve: true })}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => verifySeller.mutate({ sellerId: shop.sellerId!.id, approve: false })}>
                        Reject
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {shop.verificationDocs.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="text-xs underline">
                        View document
                      </a>
                    ))}
                  </div>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">All sellers</CardTitle>
          <Input placeholder="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {sellers?.length === 0 && <p className="text-sm text-muted-foreground">No sellers match that search.</p>}
          {sellers?.map(({ seller, shop }) => (
            <div key={seller.id} className="space-y-2 rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{seller.name}</p>
                  <p className="text-muted-foreground">
                    {seller.email}
                    {shop && ` · ${shop.name}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {seller.banned && <Badge variant="destructive">Banned</Badge>}
                  {shop && <Badge variant={shop.verified ? "default" : "outline"}>{shop.verificationStatus}</Badge>}
                  <Button variant="ghost" size="sm" onClick={() => setOpenSeller(openSeller === seller.id ? null : seller.id)}>
                    {openSeller === seller.id ? "Close" : "Details & payouts"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleImpersonate(seller.id)} disabled={impersonate.isPending}>
                    Login as
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => banUser.mutate({ id: seller.id, banned: !seller.banned })}>
                    {seller.banned ? "Unban" : "Ban"}
                  </Button>
                </div>
              </div>
              {openSeller === seller.id && <SellerDetail sellerId={seller.id} />}
            </div>
          ))}
        </CardContent>
      </Card>

      <PayoutHistory />
    </div>
  );
}

function SellerDetail({ sellerId }: { sellerId: string }) {
  const { data, isLoading } = useSellerDetail(sellerId);
  const payToSeller = usePayToSeller();
  const [payout, setPayout] = useState({ amount: 0, method: "bank_transfer", reference: "", note: "" });

  if (isLoading || !data) return <p className="text-xs text-muted-foreground">Loading seller details…</p>;

  const balance = data.totals.balance as number;

  return (
    <div className="space-y-3 rounded bg-muted p-3">
      <div className="grid gap-2 text-xs sm:grid-cols-5">
        <Stat label="Products" value={data.productCount} />
        <Stat label="Sales" value={data.totals.sales} />
        <Stat label="Commission" value={data.totals.commission} />
        <Stat label="Paid out" value={data.totals.withdrawn} />
        <Stat label="Owed now" value={balance} highlight />
      </div>

      <form
        className="grid gap-2 sm:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          payToSeller.mutate(
            { sellerId, ...payout, reference: payout.reference || undefined, note: payout.note || undefined },
            { onSuccess: () => setPayout({ amount: 0, method: "bank_transfer", reference: "", note: "" }) },
          );
        }}
      >
        <div className="space-y-1">
          <Label htmlFor={`amount-${sellerId}`} className="text-xs">
            Amount
          </Label>
          <Input
            id={`amount-${sellerId}`}
            type="number"
            min={0.01}
            max={balance}
            step="0.01"
            value={payout.amount || ""}
            onChange={(e) => setPayout({ ...payout, amount: Number(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`method-${sellerId}`} className="text-xs">
            Method
          </Label>
          <select
            id={`method-${sellerId}`}
            className="h-10 w-full rounded-md border bg-background px-2 text-sm"
            value={payout.method}
            onChange={(e) => setPayout({ ...payout, method: e.target.value })}
          >
            <option value="bank_transfer">Bank transfer</option>
            <option value="wallet">Wallet</option>
            <option value="cash">Cash</option>
            <option value="manual">Other</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`ref-${sellerId}`} className="text-xs">
            Reference
          </Label>
          <Input id={`ref-${sellerId}`} value={payout.reference} onChange={(e) => setPayout({ ...payout, reference: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`note-${sellerId}`} className="text-xs">
            Note
          </Label>
          <Input id={`note-${sellerId}`} value={payout.note} onChange={(e) => setPayout({ ...payout, note: e.target.value })} />
        </div>
        <div className="flex items-end">
          <Button type="submit" size="sm" disabled={payToSeller.isPending || balance <= 0}>
            Pay seller
          </Button>
        </div>
      </form>
      {balance <= 0 && <p className="text-xs text-muted-foreground">Nothing is currently owed to this seller.</p>}
      {payToSeller.isError && <p className="text-xs text-destructive">Payout failed. Check the amount against the balance owed.</p>}

      {data.payouts.length > 0 && (
        <div className="space-y-1 text-xs">
          <p className="font-medium">Recent payouts</p>
          {data.payouts.map((p: { id: string; amount: number; method: string; createdAt: string }) => (
            <div key={p.id} className="flex justify-between">
              <span>
                {p.amount} via {p.method.replace("_", " ")}
              </span>
              <span className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded bg-background p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className={highlight ? "font-semibold" : ""}>{value}</p>
    </div>
  );
}

function PayoutHistory() {
  const { data: payouts } = useSellerPayouts();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">All payouts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {payouts?.length === 0 && <p className="text-sm text-muted-foreground">No payouts recorded yet.</p>}
        {payouts?.map(
          (p: {
            id: string;
            amount: number;
            method: string;
            createdAt: string;
            sellerId?: { name: string };
            paidBy?: { name: string };
          }) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
              <span>{p.sellerId?.name ?? "Unknown seller"}</span>
              <span className="font-medium">{p.amount}</span>
              <span className="text-muted-foreground">
                {p.method.replace("_", " ")} · by {p.paidBy?.name ?? "—"} · {new Date(p.createdAt).toLocaleDateString()}
              </span>
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}
