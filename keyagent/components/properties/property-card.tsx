import type { PropertyRecord } from "@/lib/types";
import { StatusPill, statusTone } from "@/components/ui/status-pill";

export function PropertyCard({ property }: { property: PropertyRecord }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">{property.address}</h3>
          <p className="mt-1 text-sm text-zinc-500">{property.units.length} units · Owner {property.owner}</p>
        </div>
        <StatusPill tone={statusTone(property.leaseStatus)}>{property.leaseStatus}</StatusPill>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2">
        <Metric label="Maintenance" value={String(property.openMaintenance)} />
        <Metric label="Invoices" value={String(property.pendingInvoices)} />
        <Metric label="Tenants" value={String(property.tenants.length)} />
      </dl>
      <p className="mt-4 text-sm text-zinc-600">{property.recentActivity}</p>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-50 p-2">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="text-lg font-semibold text-zinc-950">{value}</dd>
    </div>
  );
}
