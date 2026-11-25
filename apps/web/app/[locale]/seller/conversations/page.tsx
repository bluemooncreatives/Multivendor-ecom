"use client";

import { ConversationInbox } from "@/components/shared/conversation-inbox";
import { PageHeader } from "@/components/shared/page-header";

export default function SellerConversationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Respond to customer questions about your products and orders." />
      <ConversationInbox />
    </div>
  );
}
