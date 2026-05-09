import { AuditLogTable } from "@/components/audit/audit-log-table";
import { auditLogs } from "@/lib/mock-data";

export default function AuditLogPage() {
  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-xl font-semibold tracking-tight">Audit log</h2>
        <p className="mt-1 text-sm text-zinc-500">Serious audit trail for human and agent actions, source channels, approval references, and risk levels.</p>
      </section>
      <AuditLogTable entries={auditLogs} />
    </div>
  );
}
