import { cn } from "@/lib/utils";

export function ConfidenceMeter({ value, compact = false }: { value: number; compact?: boolean }) {
  const color = value >= 90 ? "bg-emerald-500" : value >= 75 ? "bg-blue-500" : value >= 65 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className={cn("min-w-28", compact && "min-w-20")}>
      <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
        <span>Confidence</span>
        <span className="font-medium text-zinc-700">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-100">
        <div className={cn("h-1.5 rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
