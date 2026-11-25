"use client";

import { useEffect, useState } from "react";
import {
  useAdminRefunds,
  usePaidRefunds,
  useResolveRefund,
  useRefundConfig,
  useSaveRefundConfig,
  type RefundRow,
} from "@/lib/hooks/useAdminAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormField } from "@/components/shared/form-field";

export default function AdminRefundsPage() {
  const [status, setStatus] = useState("pending");
  const { data: requests } = useAdminRefunds(status || undefined);
  const { data: paid } = usePaidRefunds();
  const resolve = useResolveRefund();

  const { data: config } = useRefundConfig();
  const saveConfig = useSaveRefundConfig();
  const [form, setForm] = useState({ requestWindowDays: 7, showSticker: true, stickerUrl: "" });

  useEffect(() => {
    if (config) {
      setForm({
        requestWindowDays: config.requestWindowDays,
        showSticker: config.showSticker,
        stickerUrl: config.stickerUrl ?? "",
      });
    }
  }, [config]);

  return (
    <div className="space-y-6">
      <PageHeader title="Refund requests" description="Configure refund windows and review or settle customer refund claims." />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Refund policy</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveConfig.mutate({ ...form, stickerUrl: form.stickerUrl || undefined });
            }}
          >
            <FormField
              label="Request window (days after delivery)"
              htmlFor="window"
              hint="Set to 0 to allow requests at any time."
            >
              <Input
                id="window"
                type="number"
                min={0}
                max={365}
                value={form.requestWindowDays}
                onChange={(e) => setForm({ ...form, requestWindowDays: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Sticker image URL" htmlFor="sticker">
              <Input id="sticker" value={form.stickerUrl} onChange={(e) => setForm({ ...form, stickerUrl: e.target.value })} />
            </FormField>
            <div className="flex flex-col justify-end gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={form.showSticker}
                  onCheckedChange={(checked) => setForm({ ...form, showSticker: checked === true })}
                />
                <span>Show the refundable badge to shoppers</span>
              </label>
              <Button type="submit" disabled={saveConfig.isPending}>
                Save policy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Requests</CardTitle>
          <div className="w-64">
            <NativeSelect className="h-9" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="pending">Awaiting seller review</option>
              <option value="approved">Seller approved — awaiting payout</option>
              <option value="rejected">Rejected</option>
              <option value="refunded">Refunded</option>
            </NativeSelect>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {requests?.length === 0 && <p className="text-sm text-muted-foreground">Nothing in this queue.</p>}
          {requests?.map((request) => (
            <RefundCard
              key={request.id}
              request={request}
              onResolve={(approve, note, restock) => resolve.mutate({ id: request.id, approve, resolutionNote: note, restock })}
              busy={resolve.isPending}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Paid refunds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          {paid?.length === 0 && <p className="text-sm text-muted-foreground">No refunds paid yet.</p>}
          {paid?.map((request) => (
            <div key={request.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span className="font-medium">{request.userId?.name ?? "Unknown customer"}</span>
              <span className="font-semibold">{request.amount}</span>
              <span className="text-muted-foreground">{new Date(request.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function RefundCard({
  request,
  onResolve,
  busy,
}: {
  request: RefundRow;
  onResolve: (approve: boolean, note?: string, restock?: boolean) => void;
  busy: boolean;
}) {
  const [note, setNote] = useState("");
  const [restock, setRestock] = useState(true);
  const settled = request.status === "refunded" || request.status === "rejected";

  return (
    <div className="space-y-3 rounded-lg border p-3.5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">
            {request.userId?.name ?? "Unknown customer"} — {request.amount}
          </p>
          <p className="text-xs text-muted-foreground">Seller: {request.sellerId?.name ?? "Unknown"}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <p className="rounded-md bg-muted/50 p-2.5 text-xs">{request.reason}</p>

      {request.images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {request.images.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="Refund evidence" className="h-16 w-16 rounded-md border object-cover" />
          ))}
        </div>
      )}

      {!settled && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Input
            placeholder="Resolution note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="max-w-sm"
          />
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <Checkbox checked={restock} onCheckedChange={(checked) => setRestock(checked === true)} />
            <span>Return items to stock (sellable condition)</span>
          </label>
          <Button size="sm" disabled={busy} onClick={() => onResolve(true, note || undefined, restock)}>
            Approve &amp; refund to wallet
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onResolve(false, note || undefined)}>
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
