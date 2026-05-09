"use client";

import { X } from "lucide-react";
import type { Operation } from "@/lib/types";
import { AgentBadge } from "@/components/ui/agent-badge";
import { ConfidenceMeter } from "@/components/ui/confidence-meter";
import { StatusPill, statusTone } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { WorkflowTimeline } from "@/components/operations/workflow-timeline";

export function WorkflowDetailDrawer({ operation, onClose }: { operation: Operation | null; onClose: () => void }) {
  if (!operation) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-zinc-950/20" onClick={onClose} aria-label="Close drawer" />
      <section className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-zinc-200 bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-200 bg-white p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <AgentBadge agent={operation.agent} />
              <StatusPill tone={statusTone(operation.status)}>{operation.status}</StatusPill>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-zinc-950">{operation.workflowType}</h2>
            <p className="text-sm text-zinc-500">{operation.property}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
        <div className="space-y-5 p-5">
          <div className="rounded-lg border border-zinc-200 p-4">
            <div className="text-sm font-semibold text-zinc-950">Proposed action</div>
            <p className="mt-2 text-sm text-zinc-600">{operation.proposedAction}</p>
            <div className="mt-4">
              <ConfidenceMeter value={operation.confidence} />
            </div>
          </div>
          <WorkflowTimeline agents={operation.handoffChain} />
          <InfoBlock title="Source evidence" items={operation.evidence} />
          <InfoBlock title="Related documents and messages" items={operation.related} />
          <InfoBlock title="Audit history" items={operation.audit} />
          <div className="rounded-lg border border-zinc-200 p-4">
            <div className="text-sm font-semibold text-zinc-950">Approval status</div>
            <p className="mt-2 text-sm text-zinc-600">
              {operation.approvalRequired ? "Awaiting human approval before execution." : "No human approval required for the current step."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <div className="text-sm font-semibold text-zinc-950">{title}</div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm text-zinc-600">• {item}</li>
        ))}
      </ul>
    </div>
  );
}
