"use client";

import { PosTerminal } from "@/components/pos/pos-terminal";

export default function AdminPosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Point of sale</h1>
        <p className="text-sm text-muted-foreground">
          The admin till can sell any product in the catalog, including other sellers' stock. Vendor sales still credit
          that seller's ledger and deduct commission.
        </p>
      </div>
      <PosTerminal scope="admin" />
    </div>
  );
}
