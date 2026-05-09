import { cn } from "@/lib/utils";
import { StatusPill, statusTone } from "@/components/ui/status-pill";

export function StatCard({
  label,
  value,
  detail,
  status,
  className,
}: {
  label: string;
  value: string;
  detail: string;
  status?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-zinc-200 bg-white p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-600">{label}</p>
        {status ? <StatusPill tone={statusTone(status)}>{status}</StatusPill> : null}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{value}</div>
      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
    </div>
  );
}
