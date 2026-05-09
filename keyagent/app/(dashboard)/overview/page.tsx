import { AgentBadge } from "@/components/ui/agent-badge";
import { StatusPill } from "@/components/ui/status-pill";
import { StatCard } from "@/components/shared/stat-card";
import { agents, operations } from "@/lib/mock-data";

export default function OverviewPage() {
  const latest = operations.slice(0, 5);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold tracking-tight">Operations overview</h2>
        <p className="mt-1 text-sm text-zinc-500">Live control panel for agent-led property workflows and human approval gates.</p>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active workflows" value="14" detail="Lease, invoice, maintenance, and comms tasks" status="Running" />
        <StatCard label="Pending approvals" value="5" detail="3 due today across reimbursements and scheduling" status="Awaiting approval" />
        <StatCard label="Open maintenance jobs" value="3" detail="1 SLA at risk for AC leak" status="SLA at risk" />
        <StatCard label="Expiring leases" value="4" detail="2 queued for CommsAgent calendar scheduling" status="Human review required" />
        <StatCard label="Unread conversations" value="8" detail="WhatsApp, email, and voice transcripts" status="Ready to send" />
        <StatCard label="Invoice claims pending" value="5" detail="2 low-confidence OCR results" status="OCR confidence low" />
        <StatCard label="Agent health" value="96.2%" detail="Success rate across recent runs" status="Online" />
        <StatCard label="SLA risks" value="1" detail="Vendor confirmation due by 18:00" status="SLA at risk" />
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
            {agents.map((agent) => (
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
