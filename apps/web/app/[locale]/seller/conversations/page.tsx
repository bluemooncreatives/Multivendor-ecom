"use client";

import { ConversationInbox } from "@/components/shared/conversation-inbox";

export default function SellerConversationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Messages</h1>
      <ConversationInbox />
    </div>
  );
}
