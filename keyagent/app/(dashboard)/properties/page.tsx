"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PropertyCard } from "@/components/properties/property-card";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusPill } from "@/components/ui/status-pill";
import { LeaseUploadPanel } from "@/components/documents/lease-upload-panel";
import { properties, operations } from "@/lib/mock-data";
import type { PropertyRecord } from "@/lib/types";

const tabs = ["Overview", "Units", "Tenants", "Leases", "Maintenance", "Invoices", "Messages", "Documents", "Audit"];

export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const liveProperties = useQuery(api.dashboard.listPropertiesForDashboard, { orgSlug: "demo" });
  const rows = (liveProperties ?? properties) as PropertyRecord[];
  const [selectedId, setSelectedId] = useState(properties[0].id);
  const [tab, setTab] = useState(tabs[0]);
  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return rows.filter((property) => Object.values(property).join(" ").toLowerCase().includes(query));
  }, [rows, search]);
  const selected = rows.find((property) => property.id === selectedId) ?? rows[0] ?? properties[0];

  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-xl font-semibold tracking-tight">Properties</h2>
        <p className="mt-1 text-sm text-zinc-500">Portfolio view with units, tenants, leases, invoices, messages, documents, and audit context.</p>
      </section>
      <FilterBar search={search} onSearch={setSearch} placeholder="Search properties, owners, tenants" />
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {filtered.map((property) => (
            <button key={property.id} onClick={() => setSelectedId(property.id)} className="block w-full text-left">
              <PropertyCard property={property} />
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 p-4">
            <h3 className="text-base font-semibold">{selected.address}</h3>
            <p className="mt-1 text-sm text-zinc-500">Owner {selected.owner} · {selected.units.length} units · {selected.tenants.join(", ")}</p>
          </div>
          <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 p-2">
            {tabs.map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`h-8 rounded-md px-3 text-sm font-medium ${tab === item ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Summary label="Open maintenance" value={String(selected.openMaintenance)} />
              <Summary label="Pending invoices" value={String(selected.pendingInvoices)} />
              <Summary label="Lease status" value={selected.leaseStatus} />
            </div>
            {tab === "Leases" ? (
              <div className="mt-4">
                <LeaseUploadPanel compact />
              </div>
            ) : null}
            <div className="mt-4 rounded-lg bg-zinc-50 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{tab}</h4>
                <StatusPill tone="blue">Source evidence attached</StatusPill>
              </div>
              <div className="mt-3 space-y-2">
                {operations.filter((operation) => operation.property.includes(selected.address.split(" #")[0])).slice(0, 3).map((operation) => (
                  <div key={operation.id} className="rounded-md bg-white p-3 text-sm ring-1 ring-zinc-200">
                    <div className="font-medium text-zinc-950">{operation.workflowType}</div>
                    <div className="mt-1 text-zinc-500">{operation.proposedAction}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-zinc-950">{value}</div>
    </div>
  );
}
