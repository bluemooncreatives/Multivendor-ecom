"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Download } from "lucide-react";
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
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormField } from "@/components/shared/form-field";
import { SearchInput } from "@/components/shared/search-input";
import { TableSkeleton } from "@/components/shared/loading-state";

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
      <PageHeader
        title="Sellers"
        description="Verify vendor storefronts, inspect ledger balances, and record seller payouts."
        actions={
          <Button variant="outline" size="sm" onClick={() => downloadCsv("/catalog/admin/sellers/export", "sellers.csv")}>
            <Download className="h-4 w-4" />
            Export sellers CSV
          </Button>
        }
      />

      {verifications && verifications.length > 0 && (
        <Card>
          <CardHeader className="border-b bg-muted/20 pb-3.5">
            <CardTitle className="text-base">Shop verifications awaiting review ({verifications.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {verifications.map(
              (shop: {
                id: string;
                name: string;
                verificationDocs: string[];
                sellerId?: { id: string; name: string; email: string };
              }) => (
                <div key={shop.id} className="space-y-2 rounded-lg border bg-muted/10 p-3.5 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{shop.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {shop.sellerId?.name} · {shop.sellerId?.email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => verifySeller.mutate({ sellerId: shop.sellerId!.id, approve: true })}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => verifySeller.mutate({ sellerId: shop.sellerId!.id, approve: false })}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {shop.verificationDocs.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
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
        <CardHeader className="flex-col gap-3 border-b bg-muted/20 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">All sellers</CardTitle>
          <SearchInput placeholder="Search name or email" value={query} onChange={setQuery} className="w-full sm:w-72" />
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {isLoading && <TableSkeleton rows={4} />}
          {sellers?.length === 0 && <p className="text-sm text-muted-foreground">No sellers match that search.</p>}
          {sellers?.map(({ seller, shop }) => (
            <div key={seller.id} className="space-y-3 rounded-lg border p-3.5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{seller.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {seller.email}
                    {shop && ` · ${shop.name}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {seller.banned && <Badge variant="destructive">Banned</Badge>}
                  {shop && <StatusBadge status={shop.verificationStatus ?? (shop.verified ? "verified" : "pending")} />}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenSeller(openSeller === seller.id ? null : seller.id)}
                  >
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
    <div className="space-y-3 rounded-lg border bg-muted/40 p-3.5">
      <div className="grid gap-2 text-xs sm:grid-cols-5">
        <Stat label="Products" value={data.productCount} />
        <Stat label="Sales" value={data.totals.sales} />
        <Stat label="Commission" value={data.totals.commission} />
        <Stat label="Paid out" value={data.totals.withdrawn} />
        <Stat label="Owed now" value={balance} highlight />
      </div>

      <form
        className="grid gap-3 sm:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          payToSeller.mutate(
            { sellerId, ...payout, reference: payout.reference || undefined, note: payout.note || undefined },
            { onSuccess: () => setPayout({ amount: 0, method: "bank_transfer", reference: "", note: "" }) },
          );
        }}
      >
        <FormField label="Amount" htmlFor={`amount-${sellerId}`}>
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
        </FormField>
        <FormField label="Method" htmlFor={`method-${sellerId}`}>
          <NativeSelect
            id={`method-${sellerId}`}
            value={payout.method}
            onChange={(e) => setPayout({ ...payout, method: e.target.value })}
          >
            <option value="bank_transfer">Bank transfer</option>
            <option value="wallet">Wallet</option>
            <option value="cash">Cash</option>
            <option value="manual">Other</option>
          </NativeSelect>
        </FormField>
        <FormField label="Reference" htmlFor={`ref-${sellerId}`}>
          <Input id={`ref-${sellerId}`} value={payout.reference} onChange={(e) => setPayout({ ...payout, reference: e.target.value })} />
        </FormField>
        <FormField label="Note" htmlFor={`note-${sellerId}`}>
          <Input id={`note-${sellerId}`} value={payout.note} onChange={(e) => setPayout({ ...payout, note: e.target.value })} />
        </FormField>
        <div className="flex items-end">
          <Button type="submit" size="sm" className="w-full" disabled={payToSeller.isPending || balance <= 0}>
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
    <div className="rounded-md border bg-background p-2.5">
      <p className="text-muted-foreground">{label}</p>
      <p className={highlight ? "font-bold text-primary" : "font-semibold"}>{value}</p>
    </div>
  );
}

function PayoutHistory() {
  const { data: payouts } = useSellerPayouts();

  return (
    <Card>
      <CardHeader className="border-b bg-muted/20 pb-3.5">
        <CardTitle className="text-base">All payouts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
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
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
              <span className="font-medium">{p.sellerId?.name ?? "Unknown seller"}</span>
              <span className="font-semibold">{p.amount}</span>
              <span className="text-xs text-muted-foreground">
                {p.method.replace("_", " ")} · by {p.paidBy?.name ?? "—"} · {new Date(p.createdAt).toLocaleDateString()}
              </span>
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}
