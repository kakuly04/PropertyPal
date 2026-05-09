import type { AgentName } from "@/lib/types";
import { AgentBadge } from "@/components/ui/agent-badge";

export function WorkflowTimeline({ agents }: { agents: (AgentName | "Human Approval")[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <div className="text-sm font-semibold text-zinc-950">Agent handoff chain</div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {agents.map((agent, index) => (
          <div key={`${agent}-${index}`} className="flex items-center gap-2">
            {agent === "Human Approval" ? (
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">Human Approval</span>
            ) : (
              <AgentBadge agent={agent} />
            )}
            {index < agents.length - 1 ? <span className="text-zinc-300">→</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
