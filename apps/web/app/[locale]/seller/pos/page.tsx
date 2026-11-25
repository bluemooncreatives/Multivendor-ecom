"use client";

import { PosTerminal } from "@/components/pos/pos-terminal";
import { PageHeader } from "@/components/shared/page-header";

export default function SellerPosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Point of sale"
        description="Ring up an in-person sale. Stock is deducted immediately and the sale appears in your ledger."
      />
      <PosTerminal scope="seller" />
    </div>
  );
}
