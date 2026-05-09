import type { AgentRecord } from "@/lib/types";
import { AgentBadge } from "@/components/ui/agent-badge";
import { StatusPill } from "@/components/ui/status-pill";

export function AgentCard({ agent }: { agent: AgentRecord }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <AgentBadge agent={agent.name} />
        <StatusPill tone={agent.errorCount > 0 ? "amber" : "green"}>{agent.errorCount} errors</StatusPill>
      </div>
      <p className="mt-3 text-sm text-zinc-600">{agent.responsibility}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-zinc-50 p-2">
          <div className="text-xs text-zinc-500">Active tasks</div>
          <div className="text-lg font-semibold">{agent.activeTasks}</div>
        </div>
        <div className="rounded-md bg-zinc-50 p-2">
          <div className="text-xs text-zinc-500">Last run</div>
          <div className="text-sm font-semibold">{agent.lastRun}</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-xs font-semibold uppercase text-zinc-500">Tool scope</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {agent.toolScope.map((tool) => <span key={tool} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{tool}</span>)}
        </div>
      </div>
    </article>
  );
}
