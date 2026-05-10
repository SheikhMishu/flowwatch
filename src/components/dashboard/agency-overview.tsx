"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, AlertCircle, CheckCircle2, Server, ArrowRight, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceHealth {
  id: string;
  name: string;
  slug: string;
  instanceCount: number;
  memberCount: number;
  openIncidents: number;
  lastSyncedAt: string | null;
  status: "healthy" | "degraded" | "no_instances";
}

const MAX_VISIBLE = 5;

const statusDot: Record<WorkspaceHealth["status"], string> = {
  healthy: "bg-success",
  degraded: "bg-destructive animate-pulse",
  no_instances: "bg-muted-foreground",
};

export function AgencyOverview() {
  const [workspaces, setWorkspaces] = useState<WorkspaceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/org/workspaces")
      .then((r) => r.ok ? r.json() : { workspaces: [] })
      .then((d) => setWorkspaces(d.workspaces ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Nothing to show for non-agency users
  if (!loading && workspaces.length === 0) return null;

  const degraded = workspaces.filter((w) => w.status === "degraded");
  const healthy = workspaces.filter((w) => w.status === "healthy");
  const noInstances = workspaces.filter((w) => w.status === "no_instances");
  const totalIncidents = workspaces.reduce((sum, w) => sum + w.openIncidents, 0);

  // Sort: degraded first, then no_instances, then healthy
  const sorted = [
    ...workspaces.filter((w) => w.status === "degraded"),
    ...workspaces.filter((w) => w.status === "no_instances"),
    ...workspaces.filter((w) => w.status === "healthy"),
  ];
  const visible = sorted.slice(0, MAX_VISIBLE);
  const overflow = sorted.length - MAX_VISIBLE;

  async function handleSwitch(orgId: string) {
    setSwitching(orgId);
    try {
      const res = await fetch("/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
      if (res.ok) window.location.href = "/dashboard";
      else setSwitching(null);
    } catch {
      setSwitching(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        Loading client workspaces…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">Client Workspaces</span>
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {workspaces.length}
            </span>
            {degraded.length > 0 && (
              <span className="rounded-full bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[11px] font-medium text-destructive">
                {degraded.length} need attention
              </span>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/workspaces"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Manage all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Alert banner — only when there are incidents */}
      {totalIncidents > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-destructive/5 border-b border-destructive/10">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-semibold text-destructive">
              {degraded.length} of {workspaces.length} client {workspaces.length === 1 ? "workspace" : "workspaces"}
            </span>
            {" "}
            {degraded.length === 1 ? "has" : "have"} open incidents
            {totalIncidents > 0 && (
              <span className="text-muted-foreground"> — {totalIncidents} total</span>
            )}
          </p>
        </div>
      )}

      {/* Summary pills */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          <span>{healthy.length} healthy</span>
        </div>
        <span className="text-border">·</span>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          <span>{degraded.length} degraded</span>
        </div>
        <span className="text-border">·</span>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Server className="w-3.5 h-3.5" />
          <span>{noInstances.length} no instances</span>
        </div>
      </div>

      {/* Workspace rows */}
      <div className="divide-y divide-border/50">
        {visible.map((ws) => (
          <div
            key={ws.id}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary/50 transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={cn("w-2 h-2 rounded-full shrink-0", statusDot[ws.status])} />
              <span className="text-sm text-foreground truncate font-medium">{ws.name}</span>
              {ws.openIncidents > 0 && (
                <span className="shrink-0 rounded-full bg-destructive/10 border border-destructive/20 px-1.5 py-0.5 text-[10px] font-semibold text-destructive leading-none">
                  {ws.openIncidents}
                </span>
              )}
            </div>
            <button
              onClick={() => handleSwitch(ws.id)}
              disabled={switching !== null}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40 shrink-0 ml-3"
            >
              {switching === ws.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <><ExternalLink className="w-3 h-3" /> Open</>
              )}
            </button>
          </div>
        ))}

        {overflow > 0 && (
          <div className="px-4 py-2.5">
            <Link
              href="/dashboard/workspaces"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              + {overflow} more workspace{overflow !== 1 ? "s" : ""} — view all
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
