"use client";

import { PosTerminal } from "@/components/pos/pos-terminal";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminPosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Point of sale"
        description="The admin till can sell any product in the catalog, including other sellers' stock. Vendor sales still credit that seller's ledger and deduct commission."
      />
      <PosTerminal scope="admin" />
    </div>
  );
}
