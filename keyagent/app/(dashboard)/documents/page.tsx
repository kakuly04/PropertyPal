import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentSourceCard } from "@/components/documents/document-source-card";
import { LeaseUploadPanel } from "@/components/documents/lease-upload-panel";
import { documents } from "@/lib/mock-data";

export default function DocumentsPage() {
  const categories = ["Lease PDFs", "Invoice PDFs/images", "Property photos", "Tenant correspondence", "Owner documents", "Contractor receipts"];

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Documents and source data</h2>
          <p className="mt-1 text-sm text-zinc-500">Property operations source management for extraction, OCR, evidence, and agent review.</p>
        </div>
        <Button>
          <Upload className="size-4" />
          Add source
        </Button>
      </section>
      <LeaseUploadPanel />
      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {categories.map((category) => (
          <div key={category} className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="text-sm font-medium text-zinc-900">{category}</div>
            <div className="mt-1 text-xs text-zinc-500">{documents.filter((document) => document.category === category).length} sources</div>
          </div>
        ))}
      </section>
      <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {documents.map((document) => <DocumentSourceCard key={document.id} document={document} />)}
      </section>
    </div>
  );
}
