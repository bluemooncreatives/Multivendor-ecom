"use client";

import { PosTerminal } from "@/components/pos/pos-terminal";

export default function SellerPosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Point of sale</h1>
        <p className="text-sm text-muted-foreground">
          Ring up an in-person sale. Stock is deducted immediately and the sale appears in your ledger.
        </p>
      </div>
      <PosTerminal scope="seller" />
    </div>
  );
}
