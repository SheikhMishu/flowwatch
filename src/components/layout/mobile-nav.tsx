"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  ListChecks,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workflows", href: "/dashboard/workflows", icon: Workflow },
  { label: "Executions", href: "/dashboard/executions", icon: ListChecks },
  { label: "Incidents", href: "/dashboard/incidents", icon: AlertTriangle, badge: true },
  { label: "Help", href: "/dashboard/help", icon: HelpCircle },
];

export function MobileNav() {
  const [openIncidents, setOpenIncidents] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const instanceId = searchParams.get("instance");
  const instanceSuffix = instanceId ? `?instance=${instanceId}` : "";

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/incidents/count");
        if (!res.ok) return;
        const { open } = await res.json();
        setOpenIncidents(open);
      } catch {}
    }
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="flex items-center justify-around px-2 py-1 safe-area-pb">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href + instanceSuffix}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-0",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5 shrink-0" />
                {item.badge && openIncidents > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex items-center justify-center min-w-[14px] h-3.5 rounded-full bg-destructive px-0.5 text-[9px] font-bold text-white leading-none">
                    {openIncidents > 9 ? "9+" : openIncidents}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium truncate">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
