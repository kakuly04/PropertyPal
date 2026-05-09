"use client";

import { useState } from "react";
import type { Approval } from "@/lib/types";
import { AgentBadge } from "@/components/ui/agent-badge";
import { StatusPill, statusTone } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";

export function ApprovalCard({ approval }: { approval: Approval }) {
  const [status, setStatus] = useState(approval.status);

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <AgentBadge agent={approval.agent} />
            <StatusPill tone={statusTone(status)}>{status}</StatusPill>
            <StatusPill tone={approval.risk === "High" ? "red" : approval.risk === "Medium" ? "amber" : "green"}>{approval.risk} risk</StatusPill>
          </div>
          <h3 className="mt-3 text-sm font-semibold text-zinc-950">{approval.action}</h3>
          <p className="mt-1 text-sm text-zinc-600">{approval.reason}</p>
          <p className="mt-2 text-xs text-zinc-500">{approval.property} · {approval.person} · SLA {approval.deadline}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {approval.evidence.map((item) => (
              <span key={item} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{item}</span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" onClick={() => setStatus("Approved")}>Approve</Button>
          <Button size="sm" variant="outline" onClick={() => setStatus("Rejected")}>Reject</Button>
          <Button size="sm" variant="outline" onClick={() => setStatus("Changes requested")}>Request Changes</Button>
        </div>
      </div>
    </article>
  );
}
