import { Bot, CalendarCheck, FileText, MessageSquare, ReceiptText, Route } from "lucide-react";
import type { AgentName } from "@/lib/types";
import { cn } from "@/lib/utils";

const iconMap = {
  OrchestratorAgent: Route,
  MaintenanceAgent: Bot,
  ContractAgent: FileText,
  CommsAgent: MessageSquare,
  InvoiceAgent: ReceiptText,
} satisfies Record<AgentName, React.ComponentType<{ className?: string }>>;

export function AgentBadge({ agent, className }: { agent: AgentName; className?: string }) {
  const Icon = agent === "CommsAgent" ? CalendarCheck : iconMap[agent];

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700", className)}>
      <Icon className="size-3.5 text-zinc-500" />
      {agent}
    </span>
  );
}
