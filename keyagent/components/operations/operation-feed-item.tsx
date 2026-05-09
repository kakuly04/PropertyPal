import type { Operation } from "@/lib/types";
import { AgentBadge } from "@/components/ui/agent-badge";
import { ConfidenceMeter } from "@/components/ui/confidence-meter";
import { StatusPill, statusTone } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";

export function OperationFeedItem({ operation, onOpen }: { operation: Operation; onOpen: (operation: Operation) => void }) {
  return (
    <button
      onClick={() => onOpen(operation)}
      className="w-full rounded-lg border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <AgentBadge agent={operation.agent} />
            <StatusPill tone={statusTone(operation.status)}>{operation.status}</StatusPill>
            {operation.approvalRequired ? <StatusPill tone="amber">Human review required</StatusPill> : null}
          </div>
          <h3 className="mt-3 text-sm font-semibold text-zinc-950">{operation.workflowType}</h3>
          <p className="mt-1 text-sm text-zinc-600">{operation.proposedAction}</p>
          <p className="mt-2 text-xs text-zinc-500">
            {operation.property} · {operation.person} · {operation.timestamp}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ConfidenceMeter value={operation.confidence} compact />
          <Button variant="outline" size="sm" type="button">Open</Button>
        </div>
      </div>
    </button>
  );
}
