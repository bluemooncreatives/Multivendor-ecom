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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      <h1 className="text-2xl font-bold">Refund requests</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Refund policy</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveConfig.mutate({ ...form, stickerUrl: form.stickerUrl || undefined });
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="window">Request window (days after delivery)</Label>
              <Input
                id="window"
                type="number"
                min={0}
                max={365}
                value={form.requestWindowDays}
                onChange={(e) => setForm({ ...form, requestWindowDays: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Set to 0 to allow requests at any time.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sticker">Sticker image URL</Label>
              <Input id="sticker" value={form.stickerUrl} onChange={(e) => setForm({ ...form, stickerUrl: e.target.value })} />
            </div>
            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.showSticker} onChange={(e) => setForm({ ...form, showSticker: e.target.checked })} />
                Show the refundable badge to shoppers
              </label>
              <Button type="submit" disabled={saveConfig.isPending}>
                Save policy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Requests</CardTitle>
          <select className="h-9 rounded-md border bg-background px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Awaiting seller review</option>
            <option value="approved">Seller approved — awaiting payout</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded</option>
          </select>
        </CardHeader>
        <CardContent className="space-y-2">
          {requests?.length === 0 && <p className="text-sm text-muted-foreground">Nothing in this queue.</p>}
          {requests?.map((request) => (
            <RefundCard
              key={request.id}
              request={request}
              onResolve={(approve, note) => resolve.mutate({ id: request.id, approve, resolutionNote: note })}
              busy={resolve.isPending}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paid refunds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {paid?.length === 0 && <p className="text-sm text-muted-foreground">No refunds paid yet.</p>}
          {paid?.map((request) => (
            <div key={request.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{request.userId?.name ?? "Unknown customer"}</span>
              <span className="font-medium">{request.amount}</span>
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
  onResolve: (approve: boolean, note?: string) => void;
  busy: boolean;
}) {
  const [note, setNote] = useState("");
  const settled = request.status === "refunded" || request.status === "rejected";

  return (
    <div className="space-y-2 rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">
            {request.userId?.name ?? "Unknown customer"} — {request.amount}
          </p>
          <p className="text-muted-foreground">Seller: {request.sellerId?.name ?? "Unknown"}</p>
        </div>
        <Badge variant={request.status === "refunded" ? "default" : "outline"}>{request.status}</Badge>
      </div>

      <p className="rounded bg-muted p-2 text-xs">{request.reason}</p>

      {request.images.length > 0 && (
        <div className="flex gap-2">
          {request.images.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="Refund evidence" className="h-16 w-16 rounded object-cover" />
          ))}
        </div>
      )}

      {!settled && (
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Resolution note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="max-w-sm" />
          <Button size="sm" disabled={busy} onClick={() => onResolve(true, note || undefined)}>
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
