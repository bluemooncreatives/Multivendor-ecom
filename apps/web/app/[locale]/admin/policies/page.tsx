"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { usePolicy, useSavePolicy, type PolicyType } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { getApiErrorMessage } from "@/lib/utils";

const TYPES: { value: PolicyType; label: string }[] = [
  { value: "privacy", label: "Privacy Policy" },
  { value: "terms", label: "Terms" },
  { value: "refund", label: "Refund Policy" },
  { value: "return", label: "Return Policy" },
  { value: "shipping", label: "Shipping Policy" },
  { value: "support", label: "Support Policy" },
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
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save policy"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Policy pages" description="Edit legal, shipping, return, and seller policy documents." />

      <div className="flex flex-wrap gap-2 border-b pb-3">
        {TYPES.map((t) => (
          <Button
            key={t.value}
            type="button"
            size="sm"
            variant={active === t.value ? "default" : "ghost"}
            onClick={() => setActive(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">{TYPES.find((t) => t.value === active)?.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <Textarea rows={14} value={body} onChange={(e) => setBody(e.target.value)} />
          <Button onClick={handleSave} disabled={savePolicy.isPending}>
            Save
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
