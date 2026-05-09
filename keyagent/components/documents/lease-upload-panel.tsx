"use client";

import { useState } from "react";
import { CheckCircle2, FileUp, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { AgentBadge } from "@/components/ui/agent-badge";
import { properties } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type UploadState = "idle" | "ready" | "processing" | "complete";

const tenantsByProperty: Record<string, string[]> = {
  p1: ["Priya Menon", "Daniel Ho"],
  p2: ["Nora Tan", "Hafiz Rahman"],
  p3: ["Mei Wong"],
};

export function LeaseUploadPanel({ compact = false }: { compact?: boolean }) {
  const [propertyId, setPropertyId] = useState(properties[0].id);
  const [tenant, setTenant] = useState(tenantsByProperty[properties[0].id][0]);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");

  const selectedProperty = properties.find((property) => property.id === propertyId) ?? properties[0];
  const leaseFileId = file ? `convex_file_${file.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 28)}` : "convex_file_id";
  const eventId = file ? `evt_lease_${selectedProperty.id}_${leaseFileId.slice(-8)}` : `evt_lease_${selectedProperty.id}`;

  function handlePropertyChange(nextPropertyId: string) {
    setPropertyId(nextPropertyId);
    setTenant(tenantsByProperty[nextPropertyId][0]);
  }

  function handleFile(nextFile: File | null) {
    setFile(nextFile);
    setState(nextFile ? "ready" : "idle");
  }

  function simulateUpload() {
    if (!file) return;
    setState("processing");
    window.setTimeout(() => setState("complete"), 900);
  }

  return (
    <section className={cn("rounded-lg border border-zinc-200 bg-white", compact ? "p-4" : "p-5")}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <AgentBadge agent="ContractAgent" />
            <StatusPill tone={state === "complete" ? "green" : state === "processing" ? "blue" : "neutral"}>
              {state === "complete" ? "Lease extraction queued" : state === "processing" ? "Processing upload" : "Upload lease PDF"}
            </StatusPill>
          </div>
          <h3 className="mt-3 text-base font-semibold text-zinc-950">Lease PDF intake</h3>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Upload a signed lease PDF, attach it to the property and tenant, then hand it to ContractAgent for extraction, review, expiry monitoring, and CommsAgent renewal scheduling.
          </p>
        </div>
        <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
          Backend flow: `files:createFileRecord` → `/agents/contract/upload`
        </div>
      </div>

      <div className={cn("mt-5 grid gap-4", compact ? "lg:grid-cols-1" : "xl:grid-cols-[1fr_0.9fr]")}>
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium uppercase text-zinc-500">Property</span>
            <select
              value={propertyId}
              onChange={(event) => handlePropertyChange(event.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.address}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase text-zinc-500">Tenant</span>
            <select
              value={tenant}
              onChange={(event) => setTenant(event.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            >
              {tenantsByProperty[propertyId].map((tenantName) => (
                <option key={tenantName} value={tenantName}>
                  {tenantName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center transition-colors hover:bg-zinc-100">
            <UploadCloud className="size-7 text-zinc-400" />
            <span className="mt-3 text-sm font-medium text-zinc-900">{file ? file.name : "Choose lease PDF"}</span>
            <span className="mt-1 text-xs text-zinc-500">{file ? `${Math.max(file.size / 1024 / 1024, 0.01).toFixed(2)} MB · application/pdf` : "PDF files are routed to ContractAgent"}</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button onClick={simulateUpload} disabled={!file || state === "processing"}>
              {state === "processing" ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
              Send to ContractAgent
            </Button>
            <Button variant="outline" onClick={() => handleFile(null)} disabled={!file || state === "processing"}>
              Clear
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <FlowStep done={Boolean(file)} label="Create file record" detail={`purpose: lease_pdf · originalName: ${file?.name ?? "lease.pdf"}`} />
          <FlowStep done={state === "processing" || state === "complete"} label="Start ContractAgent run" detail="source: upload · inputSummary references leaseFileId" />
          <FlowStep done={state === "complete"} label="Extract and update lease" detail="startDate, endDate, rentAmount, tenant, property address, confidence" />
          <FlowStep done={state === "complete"} label="Review or activate" detail="Low confidence creates approval; high confidence confirms extraction" />
          <FlowStep done={state === "complete"} label="Monitor expiry" detail="Daily cron can queue schedule_lease_renewal_meeting for CommsAgent" />
          <div className="rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100">
            <div className="mb-2 flex items-center gap-2 font-medium">
              {state === "complete" ? <CheckCircle2 className="size-4 text-emerald-300" /> : null}
              Contract upload payload
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap leading-5 text-zinc-300">{JSON.stringify({
              eventId,
              orgId: "demo",
              propertyId: selectedProperty.id,
              source: "upload",
              leaseFileId,
              tenantId: tenant.toLowerCase().replaceAll(" ", "_"),
            }, null, 2)}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowStep({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-zinc-200 p-3">
      <div className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border", done ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-zinc-300 text-zinc-400")}>
        <CheckCircle2 className="size-3.5" />
      </div>
      <div>
        <div className="text-sm font-medium text-zinc-950">{label}</div>
        <div className="mt-0.5 text-xs text-zinc-500">{detail}</div>
      </div>
    </div>
  );
}
