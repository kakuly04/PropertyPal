import type { DocumentSource } from "@/lib/types";
import { AgentBadge } from "@/components/ui/agent-badge";
import { ConfidenceMeter } from "@/components/ui/confidence-meter";
import { StatusPill, statusTone } from "@/components/ui/status-pill";

export function DocumentSourceCard({ document }: { document: DocumentSource }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase text-zinc-500">{document.category}</div>
          <h3 className="mt-1 text-sm font-semibold text-zinc-950">{document.fileName}</h3>
          <p className="mt-1 text-sm text-zinc-500">{document.linkedEntity}</p>
        </div>
        <StatusPill tone={statusTone(document.reviewStatus)}>{document.reviewStatus}</StatusPill>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <AgentBadge agent={document.relatedAgent} />
        <StatusPill tone={statusTone(document.extractedStatus)}>{document.extractedStatus}</StatusPill>
      </div>
      <div className="mt-4">
        <ConfidenceMeter value={document.confidence} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2">
        {Object.entries(document.fields).map(([key, value]) => (
          <div key={key} className="rounded-md bg-zinc-50 p-2">
            <dt className="text-[11px] uppercase text-zinc-500">{key}</dt>
            <dd className="mt-0.5 truncate text-xs font-medium text-zinc-800">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
