"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AgentBadge } from "@/components/ui/agent-badge";
import { StatusPill } from "@/components/ui/status-pill";
import { StatCard } from "@/components/shared/stat-card";
import { agents, operations } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function OverviewPage() {
  const overview = useQuery(api.dashboard.getOverview, { orgSlug: "demo" });
  const liveOperations = useQuery(api.dashboard.listOperations, { orgSlug: "demo", limit: 5 });
  const liveAgents = useQuery(api.dashboard.listAgentsForDashboard, { orgSlug: "demo" });
  const seedDemo = useMutation(api.demoSeed.ensureDemoData);
  const latest = liveOperations ?? operations.slice(0, 5);
  const agentRows = liveAgents ?? agents;
  const stats = overview?.stats;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Operations overview</h2>
          <p className="mt-1 text-sm text-zinc-500">Live control panel for agent-led property workflows and human approval gates.</p>
        </div>
        <Button variant="outline" onClick={() => void seedDemo({})}>Seed demo data</Button>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active workflows" value={String(stats?.activeWorkflows ?? 14)} detail="Lease, invoice, maintenance, and comms tasks" status="Running" />
        <StatCard label="Pending approvals" value={String(stats?.pendingApprovals ?? 5)} detail="Reimbursements, extraction checks, and relisting reviews" status="Awaiting approval" />
        <StatCard label="Open maintenance jobs" value={String(stats?.openMaintenance ?? 3)} detail="Contractor matching and vendor scheduling" status="SLA at risk" />
        <StatCard label="Expiring leases" value={String(stats?.expiringLeases ?? 4)} detail="Queued for CommsAgent calendar scheduling" status="Human review required" />
        <StatCard label="Unread conversations" value={String(stats?.unreadConversations ?? 8)} detail="WhatsApp, email, and voice transcripts" status="Ready to send" />
        <StatCard label="Invoice claims pending" value={String(stats?.pendingInvoices ?? 5)} detail="OCR results waiting for review" status="OCR confidence low" />
        <StatCard label="Agent health" value={`${stats?.agentHealth ?? 96.2}%`} detail="Success rate across recent runs" status="Online" />
        <StatCard label="SLA risks" value={String(stats?.slaRisks ?? 1)} detail="High-priority tasks requiring attention" status="SLA at risk" />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 p-4">
            <h3 className="text-sm font-semibold">Active workflow feed</h3>
          </div>
          <div className="divide-y divide-zinc-100">
            {latest.map((operation) => (
              <div key={operation.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <AgentBadge agent={operation.agent} />
                    {operation.approvalRequired ? <StatusPill tone="amber">Human review required</StatusPill> : null}
                  </div>
                  <p className="mt-2 text-sm font-medium text-zinc-950">{operation.proposedAction}</p>
                  <p className="mt-1 text-xs text-zinc-500">{operation.property} · {operation.timestamp}</p>
                </div>
                <StatusPill tone={operation.status.includes("risk") ? "red" : "blue"}>{operation.status}</StatusPill>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Agent health summary</h3>
          <div className="mt-4 space-y-3">
            {agentRows.map((agent) => (
              <div key={agent.name} className="flex items-center justify-between gap-3 rounded-md bg-zinc-50 p-3">
                <div>
                  <AgentBadge agent={agent.name} />
                  <p className="mt-1 text-xs text-zinc-500">{agent.activeTasks} active tasks · last run {agent.lastRun}</p>
                </div>
                <StatusPill tone={agent.errorCount > 0 ? "amber" : "green"}>{agent.errorCount} errors</StatusPill>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
