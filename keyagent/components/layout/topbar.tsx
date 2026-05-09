"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Command, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const labels: Record<string, string> = {
  "/overview": "Overview",
  "/operations": "Operations",
  "/properties": "Properties",
  "/conversations": "Conversations",
  "/approvals": "Approvals",
  "/documents": "Documents",
  "/agents": "Agents",
  "/analytics": "Analytics",
  "/audit-log": "Audit Log",
  "/settings": "Settings",
};

export function Topbar() {
  const pathname = usePathname();
  const title = labels[pathname] ?? "Overview";

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-3 px-3 sm:px-4 lg:px-5">
        <Link href="/overview" className="flex items-center gap-2 lg:hidden">
          <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <ShieldCheck className="size-4" />
          </div>
          <span className="text-sm font-semibold">Estate</span>
        </Link>
        <div className="hidden lg:block">
          <h1 className="text-sm font-semibold text-zinc-950">{title}</h1>
          <p className="text-xs text-zinc-500">Demo workspace · orgId demo · Asia/Singapore</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden h-8 w-64 min-w-0 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-sm text-zinc-500 md:flex lg:w-72">
            <Search className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">Search workflows, properties, evidence</span>
            <kbd className="shrink-0 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] leading-none text-zinc-500">
              <Command className="inline size-3" /> K
            </kbd>
          </div>
          <Button variant="outline" size="icon-sm" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
          <div className="flex size-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">T</div>
        </div>
      </div>
    </header>
  );
}
