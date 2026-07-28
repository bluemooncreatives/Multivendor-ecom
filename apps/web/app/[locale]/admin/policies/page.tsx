"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { usePolicy, useSavePolicy, type PolicyType } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPES: { value: PolicyType; label: string }[] = [
  { value: "privacy", label: "Privacy Policy" },
  { value: "terms", label: "Terms" },
  { value: "refund", label: "Refund Policy" },
  { value: "shipping", label: "Shipping Policy" },
  { value: "seller_agreement", label: "Seller Agreement" },
];

export default function AdminPoliciesPage() {
  const [active, setActive] = useState<PolicyType>("privacy");
  const { data: policy } = usePolicy(active);
  const savePolicy = useSavePolicy();
  const [body, setBody] = useState("");

  useEffect(() => {
    setBody(policy?.body ?? "");
  }, [policy]);

  async function handleSave() {
    try {
      await savePolicy.mutateAsync({ type: active, body });
      toast.success("Policy saved");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not save policy");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Policy pages</h1>
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setActive(t.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              active === t.value ? "bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{TYPES.find((t) => t.value === active)?.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="w-full rounded-md border p-2 text-sm"
            rows={14}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button onClick={handleSave} disabled={savePolicy.isPending}>
            Save
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
