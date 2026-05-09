"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ApprovalCard } from "@/components/approvals/approval-card";
import { approvals } from "@/lib/mock-data";
import type { Approval } from "@/lib/types";

export default function ApprovalsPage() {
  const liveApprovals = useQuery(api.dashboard.listApprovalsForDashboard, { orgSlug: "demo" });
  const rows = (liveApprovals ?? approvals) as Approval[];

  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-xl font-semibold tracking-tight">Approval queue</h2>
        <p className="mt-1 text-sm text-zinc-500">Review sensitive actions before agents send messages, schedule vendors, reimburse tenants, or publish relisting drafts.</p>
      </section>
      <div className="space-y-3">
        {rows.map((approval) => <ApprovalCard key={approval.id} approval={approval} />)}
      </div>
    </div>
  );
}
