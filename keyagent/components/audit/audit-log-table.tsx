"use client";

import { useMemo, useState } from "react";
import type { AuditLogEntry } from "@/lib/types";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusPill, statusTone } from "@/components/ui/status-pill";

export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return entries.filter((entry) => Object.values(entry).join(" ").toLowerCase().includes(query));
  }, [entries, search]);

  return (
    <div className="space-y-3">
      <FilterBar search={search} onSearch={setSearch} placeholder="Filter by agent, property, action, entity, approval" />
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                {["Timestamp", "Actor", "Action", "Target", "Source", "Approval", "Status", "Risk"].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 text-zinc-500">{entry.timestamp}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{entry.actor}</td>
                  <td className="px-4 py-3">{entry.action}</td>
                  <td className="px-4 py-3 text-zinc-500">{entry.target}</td>
                  <td className="px-4 py-3 text-zinc-500">{entry.source}</td>
                  <td className="px-4 py-3 text-zinc-500">{entry.approvalRef}</td>
                  <td className="px-4 py-3"><StatusPill tone={statusTone(entry.status)}>{entry.status}</StatusPill></td>
                  <td className="px-4 py-3"><StatusPill tone={entry.risk === "High" ? "red" : entry.risk === "Medium" ? "amber" : "green"}>{entry.risk}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
