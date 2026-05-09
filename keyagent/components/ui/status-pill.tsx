import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/types";

const toneClass: Record<StatusTone, string> = {
  neutral: "border-zinc-200 bg-zinc-50 text-zinc-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-red-200 bg-red-50 text-red-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", toneClass[tone], className)}>
      {children}
    </span>
  );
}

export function statusTone(status: string): StatusTone {
  if (/approved|completed|confirmed|online|ready/i.test(status)) return "green";
  if (/running|scheduling|processing|sent/i.test(status)) return "blue";
  if (/approval|review|risk|pending|awaiting/i.test(status)) return "amber";
  if (/failed|rejected|breach|low/i.test(status)) return "red";
  return "neutral";
}
