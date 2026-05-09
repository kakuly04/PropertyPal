import { StatusPill } from "@/components/ui/status-pill";

const sections = [
  ["Organization", "Demo Property Management Pte Ltd", "Workspace name, billing profile, and org metadata."],
  ["Users and Roles", "8 active members", "Admins, managers, agents, viewers, and invited users."],
  ["Agent Permissions", "Approval-gated", "Tool scopes for CommsAgent, ContractAgent, InvoiceAgent, and MaintenanceAgent."],
  ["Approval Rules", "5 active rules", "Sensitive messages, reimbursements, relisting drafts, and vendor scheduling."],
  ["Channels", "WhatsApp, Email, Voice", "Inbound and outbound routing for property operations."],
  ["WhatsApp", "Twilio sandbox", "Sender, webhook, delivery status, and contact identity mapping."],
  ["Email", "Resend pending domain", "Inbound routing, templates, and agent-drafted replies."],
  ["Voice", "ElevenLabs ready", "Outbound call policy, transcript handling, and escalation rules."],
  ["SLA Windows", "Maintenance 24h, approvals 3d", "Reminder and escalation timing by workflow."],
  ["Timezone", "Asia/Singapore", "Default scheduling and lease-expiry timing."],
  ["Environment", "dev", "Development workspace with production-ready configuration shape."],
];

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-zinc-500">Organization, users, agent permissions, approval rules, channels, SLAs, timezone, and environment controls.</p>
      </section>
      <section className="grid gap-3 lg:grid-cols-2">
        {sections.map(([title, value, description]) => (
          <div key={title} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{description}</p>
              </div>
              <StatusPill tone={title === "Environment" ? "blue" : "neutral"}>{value}</StatusPill>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
