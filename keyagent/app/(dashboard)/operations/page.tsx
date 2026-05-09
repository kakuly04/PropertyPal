"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OperationFeedItem } from "@/components/operations/operation-feed-item";
import { WorkflowDetailDrawer } from "@/components/operations/workflow-detail-drawer";
import { FilterBar } from "@/components/shared/filter-bar";
import { operations } from "@/lib/mock-data";
import type { Operation } from "@/lib/types";

export default function OperationsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Operation | null>(null);
  const liveOperations = useQuery(api.dashboard.listOperations, { orgSlug: "demo", limit: 50 });
  const rows = (liveOperations ?? operations) as Operation[];
  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return rows.filter((operation) => Object.values(operation).join(" ").toLowerCase().includes(query));
  }, [rows, search]);

  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-xl font-semibold tracking-tight">Operations feed</h2>
        <p className="mt-1 text-sm text-zinc-500">Central timeline of agent handoffs, proposed actions, confidence, and approvals.</p>
      </section>
      <FilterBar search={search} onSearch={setSearch} placeholder="Search operations, agents, people, properties" />
      <section className="space-y-3">
        {filtered.map((operation) => (
          <OperationFeedItem key={operation.id} operation={operation} onOpen={setSelected} />
        ))}
      </section>
      <WorkflowDetailDrawer operation={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
