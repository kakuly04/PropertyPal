"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Approval } from "@/lib/types";
import { AgentBadge } from "@/components/ui/agent-badge";
import { StatusPill, statusTone } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";

export function ApprovalCard({ approval }: { approval: Approval }) {
  const [status, setStatus] = useState(approval.status);
  const approveInvoice = useMutation(api.invoices.approveInvoice);
  const rejectInvoice = useMutation(api.invoices.rejectInvoice);
  const confirmLease = useMutation(api.leases.confirmLeaseExtraction);
  const approveRelisting = useMutation(api.leases.approveRelistingDraft);
  const approveGeneric = useMutation(api.approvals.approveRequest);
  const rejectGeneric = useMutation(api.approvals.rejectRequest);

  async function approve() {
    const target = approval as Approval & { targetTable?: string; targetId?: string };
    if (target.targetTable === "invoices" && target.targetId !== undefined) {
      await approveInvoice({ invoiceId: target.targetId as never, approvalId: approval.id as never });
    } else if (target.targetTable === "leases" && target.targetId !== undefined) {
      await confirmLease({ leaseId: target.targetId as never, approvalId: approval.id as never });
    } else if (target.targetTable === "relistingDrafts" && target.targetId !== undefined) {
      await approveRelisting({ relistingDraftId: target.targetId as never, approvalId: approval.id as never });
    } else {
      await approveGeneric({ approvalId: approval.id as never });
    }
    setStatus("Approved");
  }

  async function reject() {
    const target = approval as Approval & { targetTable?: string; targetId?: string };
    if (target.targetTable === "invoices" && target.targetId !== undefined) {
      await rejectInvoice({ invoiceId: target.targetId as never, approvalId: approval.id as never });
    } else {
      await rejectGeneric({ approvalId: approval.id as never });
    }
    setStatus("Rejected");
  }

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
          <Button size="sm" onClick={() => void approve()}>Approve</Button>
          <Button size="sm" variant="outline" onClick={() => void reject()}>Reject</Button>
          <Button size="sm" variant="outline" onClick={() => setStatus("Changes requested")}>Request Changes</Button>
        </div>
      </div>
    </article>
  );
}
