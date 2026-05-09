"use client";

import { useState } from "react";
import { AgentCard } from "@/components/agents/agent-card";
import { AgentBadge } from "@/components/ui/agent-badge";
import { StatusPill } from "@/components/ui/status-pill";
import { agents, operations } from "@/lib/mock-data";

export default function AgentsPage() {
  const [selectedName, setSelectedName] = useState(agents[0].name);
  const selected = agents.find((agent) => agent.name === selectedName) ?? agents[0];

  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-xl font-semibold tracking-tight">Agents</h2>
        <p className="mt-1 text-sm text-zinc-500">Configure responsibilities, tool scope, approval requirements, handoffs, and recent execution evidence.</p>
      </section>
      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-3 lg:grid-cols-2">
          {agents.map((agent) => (
            <button key={agent.name} onClick={() => setSelectedName(agent.name)} className="block text-left">
              <AgentCard agent={agent} />
            </button>
          ))}
        </div>
        <aside className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <AgentBadge agent={selected.name} />
            <StatusPill tone="green">Online</StatusPill>
          </div>
          <p className="mt-3 text-sm text-zinc-600">{selected.responsibility}</p>
          <Section title="Approval requirements" items={selected.approvalRequirements} />
          <Section title="Recent handoffs" items={selected.recentHandoffs} />
          <div className="mt-5">
            <h3 className="text-sm font-semibold">Recent runs and tool calls</h3>
            <div className="mt-3 space-y-2">
              {operations.filter((operation) => operation.agent === selected.name || operation.handoffChain.includes(selected.name)).slice(0, 4).map((operation) => (
                <div key={operation.id} className="rounded-md bg-zinc-50 p-3">
                  <div className="text-sm font-medium">{operation.workflowType}</div>
                  <div className="mt-1 text-xs text-zinc-500">{operation.proposedAction}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => <span key={item} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{item}</span>)}
      </div>
    </div>
  );
}
