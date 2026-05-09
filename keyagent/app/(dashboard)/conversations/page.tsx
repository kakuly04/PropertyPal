import { ConversationThread } from "@/components/conversations/conversation-thread";
import { conversations } from "@/lib/mock-data";

export default function ConversationsPage() {
  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-xl font-semibold tracking-tight">Omnichannel inbox</h2>
        <p className="mt-1 text-sm text-zinc-500">WhatsApp, email, and voice conversations linked to workflows, evidence, and AI-drafted replies.</p>
      </section>
      <ConversationThread conversations={conversations} />
    </div>
  );
}
