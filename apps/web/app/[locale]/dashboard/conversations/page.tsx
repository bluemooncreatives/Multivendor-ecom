"use client";

import { ConversationInbox } from "@/components/shared/conversation-inbox";
import { PageHeader } from "@/components/shared/page-header";

export default function CustomerConversationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Chat directly with sellers about products and orders." />
      <ConversationInbox />
    </div>
  );
}
