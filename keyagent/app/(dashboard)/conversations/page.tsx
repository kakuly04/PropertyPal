"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConversationThread } from "@/components/conversations/conversation-thread";
import { conversations } from "@/lib/mock-data";
import type { Conversation } from "@/lib/types";

export default function ConversationsPage() {
  const liveConversations = useQuery(api.dashboard.listConversationsForDashboard, { orgSlug: "demo" });
  const rows = (liveConversations ?? conversations) as Conversation[];

  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-xl font-semibold tracking-tight">Omnichannel inbox</h2>
        <p className="mt-1 text-sm text-zinc-500">WhatsApp, email, and voice conversations linked to workflows, evidence, and AI-drafted replies.</p>
      </section>
      <ConversationThread conversations={rows} />
    </div>
  );
}
