"use client";

import { useState } from "react";
import { Receipt, UploadCloud } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { AgentBadge } from "@/components/ui/agent-badge";
import { StatusPill } from "@/components/ui/status-pill";
import { properties } from "@/lib/mock-data";

type UploadState = "idle" | "processing" | "complete";

export function InvoiceUploadPanel() {
  const overview = useQuery(api.dashboard.getOverview, { orgSlug: "demo" });
  const liveProperties = useQuery(api.dashboard.listPropertiesForDashboard, { orgSlug: "demo" });
  const createFileRecord = useMutation(api.files.createFileRecord);
  const propertyRows = liveProperties ?? properties;
  const [propertyId, setPropertyId] = useState(properties[0].id);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const selectedProperty = propertyRows.find((property) => property.id === propertyId) ?? propertyRows[0] ?? properties[0];

  async function sendToInvoiceAgent() {
    if (file === null) return;
    setState("processing");
    if (overview?.orgId !== undefined && selectedProperty.id.length > 8) {
      const fileId = await createFileRecord({
        orgId: overview.orgId as never,
        propertyId: selectedProperty.id as never,
        storageId: `demo-local:${file.name}`,
        originalName: file.name,
        contentType: file.type || "image/png",
        sizeBytes: file.size,
        purpose: "invoice_receipt",
      });
      const agentBaseUrl = process.env.NEXT_PUBLIC_AGENT_SERVICE_URL ?? "http://localhost:8000";
      await fetch(`${agentBaseUrl}/agents/invoice/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: `evt_invoice_${Date.now()}`,
          orgId: "demo",
          propertyId: selectedProperty.id,
          source: "upload",
          receiptFileId: fileId,
          paidBy: selectedProperty.tenants[0] ?? "Demo tenant",
        }),
      });
    }
    setState("complete");
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <AgentBadge agent="InvoiceAgent" />
        <StatusPill tone={state === "complete" ? "green" : state === "processing" ? "blue" : "neutral"}>
          {state === "complete" ? "Receipt routed" : state === "processing" ? "Processing" : "Upload receipt"}
        </StatusPill>
      </div>
      <h3 className="mt-3 text-base font-semibold text-zinc-950">Invoice and receipt intake</h3>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <select
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
          >
            {propertyRows.map((property) => (
              <option key={property.id} value={property.id}>{property.address}</option>
            ))}
          </select>
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center transition-colors hover:bg-zinc-100">
            <UploadCloud className="size-6 text-zinc-400" />
            <span className="mt-2 text-sm font-medium text-zinc-900">{file ? file.name : "Choose receipt image or PDF"}</span>
            <input
              type="file"
              accept="image/*,application/pdf,.pdf"
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setState("idle");
              }}
            />
          </label>
        </div>
        <Button onClick={() => void sendToInvoiceAgent()} disabled={file === null || state === "processing"}>
          <Receipt className="size-4" />
          Send to InvoiceAgent
        </Button>
      </div>
    </section>
  );
}
