"use client";

import { useMemo, useState } from "react";
import type { Conversation } from "@/lib/types";
import { AgentBadge } from "@/components/ui/agent-badge";
import { StatusPill, statusTone } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ConversationThread({ conversations }: { conversations: Conversation[] }) {
  const [selectedId, setSelectedId] = useState(conversations[0]?.id);
  const selected = useMemo(() => conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0], [conversations, selectedId]);
  const [sent, setSent] = useState(false);

  if (!selected) return null;

  return (
    <div className="grid min-h-[640px] overflow-hidden rounded-lg border border-zinc-200 bg-white lg:grid-cols-[360px_1fr]">
      <aside className="border-b border-zinc-200 lg:border-b-0 lg:border-r">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => {
              setSelectedId(conversation.id);
              setSent(false);
            }}
            className={`block w-full border-b border-zinc-100 p-4 text-left hover:bg-zinc-50 ${selected.id === conversation.id ? "bg-zinc-50" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-zinc-950">{conversation.contact}</span>
              <span className="text-xs text-zinc-500">{conversation.channel}</span>
            </div>
            <p className="mt-1 truncate text-sm text-zinc-500">{conversation.latest}</p>
            <div className="mt-2 flex items-center gap-2">
              <StatusPill tone={statusTone(conversation.status)}>{conversation.status}</StatusPill>
              {conversation.humanRequired ? <StatusPill tone="amber">Human review required</StatusPill> : null}
            </div>
          </button>
        ))}
      </aside>
      <section className="flex min-w-0 flex-col">
        <div className="border-b border-zinc-200 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <AgentBadge agent={selected.assignedAgent} />
            <StatusPill tone={statusTone(selected.status)}>{selected.status}</StatusPill>
          </div>
          <h2 className="mt-3 text-base font-semibold text-zinc-950">{selected.contact}</h2>
          <p className="text-sm text-zinc-500">{selected.role} · {selected.property} · {selected.linkedWorkflow}</p>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 p-4">
          {selected.messages.map((message, index) => (
            <div key={`${message.author}-${index}`} className={`max-w-[82%] rounded-lg border p-3 ${message.kind === "inbound" ? "bg-white" : "ml-auto bg-zinc-950 text-white"}`}>
              <div className={`text-xs font-medium ${message.kind === "inbound" ? "text-zinc-500" : "text-zinc-300"}`}>{message.author} · {message.time}</div>
              <p className="mt-1 text-sm">{message.body}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-zinc-200 p-4">
          <div className="mb-3 rounded-lg bg-zinc-50 p-3">
            <div className="text-xs font-semibold uppercase text-zinc-500">Source context</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.sourceContext.map((item) => <span key={item} className="rounded-md bg-white px-2 py-1 text-xs text-zinc-600 ring-1 ring-zinc-200">{item}</span>)}
            </div>
          </div>
          <Textarea value={sent ? "Message sent." : selected.draftReply} readOnly className="min-h-24" />
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm">Edit draft</Button>
            <Button size="sm" onClick={() => setSent(true)}>{sent ? "Sent" : "Approve / Send"}</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
