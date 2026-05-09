"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  CheckSquare,
  FileSearch,
  Home,
  ListChecks,
  MessageSquare,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/overview", label: "Overview", icon: Home },
  { href: "/operations", label: "Operations", icon: Activity },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/documents", label: "Documents", icon: FileSearch },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/audit-log", label: "Audit Log", icon: ListChecks },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-zinc-50/80 lg:flex lg:flex-col">
      <div className="border-b border-zinc-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-950">Estate</div>
            <div className="text-xs text-zinc-500">AI operations control</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-white hover:text-zinc-950",
                active && "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-3">
          <div className="text-xs font-medium text-zinc-500">Environment</div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-900">dev</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Convex-ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
