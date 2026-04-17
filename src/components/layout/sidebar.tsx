"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  ListChecks,
  AlertTriangle,
  Bell,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Server,
  BarChart3,
  ScrollText,
  HelpCircle,
} from "lucide-react";
import { FlowMonixMark } from "@/components/brand/mark";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Workflows",
    href: "/dashboard/workflows",
    icon: Workflow,
  },
  {
    label: "Executions",
    href: "/dashboard/executions",
    icon: ListChecks,
  },
  {
    label: "Incidents",
    href: "/dashboard/incidents",
    icon: AlertTriangle,
    badge: true,
    tourId: "incidents-nav",
  },
  {
    label: "Logs",
    href: "/dashboard/logs",
    icon: ScrollText,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "Alerts",
    href: "/dashboard/alerts",
    icon: Bell,
    tourId: "alerts-nav",
  },
  {
    label: "Instances",
    href: "/dashboard/instances",
    icon: Server,
  },
];

const bottomItems = [
  { label: "Help", href: "/dashboard/help", icon: HelpCircle },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
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
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative hidden md:flex flex-col h-screen border-r border-border bg-card transition-all duration-200 ease-in-out shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-14 border-b border-border px-4 shrink-0",
          collapsed ? "justify-center" : "gap-2.5"
        )}>
          <div className="flex items-center justify-center w-7 h-7 rounded-lg gradient-primary shrink-0">
            <FlowMonixMark className="w-4 h-4" />
          </div>
          {!collapsed && (
            <span className="font-bold text-base tracking-tight">
              <span className="text-foreground">Flow</span>
              <span style={{
                background: "linear-gradient(135deg, #818CF8, #A78BFA)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>monix</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav data-tour="nav" className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            const linkContent = (
              <Link
                href={item.href + instanceSuffix}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-100",
                  "hover:bg-secondary hover:text-foreground",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon className={cn("shrink-0 w-4 h-4", isActive && "text-primary")} />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && openIncidents > 0 ? (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                    {openIncidents}
                  </Badge>
                ) : null}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {item.label}
                    {item.badge && openIncidents > 0 ? (
                      <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                        {openIncidents}
                      </Badge>
                    ) : null}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href} data-tour={item.tourId}>{linkContent}</div>;
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border py-3 px-2 space-y-0.5">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            const linkContent = (
              <Link
                href={item.href + instanceSuffix}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  "hover:bg-secondary hover:text-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon className="shrink-0 w-4 h-4" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </div>

        {/* Collapse toggle */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[60px] z-10 h-6 w-6 rounded-full border border-border bg-card shadow-card"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </aside>
    </TooltipProvider>
  );
}
