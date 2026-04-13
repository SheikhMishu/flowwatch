import React from "react";
import Link from "next/link";
import {
  Workflow,
  CheckCircle2,
  Activity,
  AlertCircle,
  Timer,
  Flame,
  Server,
  ArrowRight,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { fetchOrgStats, fetchOrgExecutions, fetchOrgWorkflows } from "@/lib/n8n-data";
import { getServerDb } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ExecutionChart } from "@/components/dashboard/execution-chart";
import { FailuresFeed } from "@/components/dashboard/failures-feed";
import { WorkflowHealth } from "@/components/dashboard/workflow-health";
import { IncidentsWidget } from "@/components/dashboard/incidents-widget";
import { mockStats, mockExecutions, mockWorkflows, mockIncidents } from "@/lib/mock-data";
import type { Incident } from "@/types";
import { formatDuration } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ instance?: string }>;
}) {
  const { instance: instanceId } = await searchParams;
  const session = await getSession();
  const isDemo = !session || session.orgId === "org_demo";

  // Check if this real org has any instances connected
  let hasInstances = isDemo; // demo always has "instances"
  if (!isDemo) {
    const db = getServerDb();
    const { data: instanceRows } = await db
      .from("n8n_instances")
      .select("id")
      .eq("org_id", session!.orgId)
      .eq("is_active", true)
      .limit(1);
    hasInstances = (instanceRows?.length ?? 0) > 0;
  }

  let stats = mockStats;
  let executions = mockExecutions;
  let workflows = mockWorkflows;
  let incidents: Incident[] = mockIncidents;

  if (!isDemo && hasInstances) {
    const db = getServerDb();
    const [realStats, realExecutions, realWorkflows, incidentRows] = await Promise.all([
      fetchOrgStats(session!.orgId, instanceId).catch(() => null),
      fetchOrgExecutions(session!.orgId, instanceId).catch(() => null),
      fetchOrgWorkflows(session!.orgId, instanceId).catch(() => null),
      db.from("incidents").select("*").eq("org_id", session!.orgId)
        .in("status", ["open", "investigating"])
        .order("status").order("last_seen_at", { ascending: false })
        .limit(5),
    ]);
    if (realStats) stats = realStats;
    if (realExecutions && realExecutions.length > 0) executions = realExecutions;
    if (realWorkflows && realWorkflows.length > 0) workflows = realWorkflows;
    if (incidentRows.data) incidents = incidentRows.data as unknown as Incident[];
  }

  const failedExecutions = executions.filter((e) => e.status === "error");

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Dashboard" />

      <div className="flex-1 p-4 md:p-6 space-y-6 animate-fade-in">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Overview</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isDemo ? (
                <span className="text-warning font-medium">Demo data</span>
              ) : (
                <>
                  Live data ·{" "}
                  <span className="text-success font-medium">Connected</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-success/10 border border-success/20 rounded-lg px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
            Live
          </div>
        </div>

        {/* Empty state: no instances connected */}
        {!isDemo && !hasInstances && (
          <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-12 flex flex-col items-center justify-center gap-4 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
              <Server className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Connect your first n8n instance</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Add your n8n instance URL and API key to start monitoring workflow health, executions, and alerts.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Link
                href="/dashboard/instances"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors shadow-card-hover"
              >
                <Server className="w-4 h-4" />
                Connect Instance
              </Link>
              <Link
                href="/dashboard/instances"
                className="inline-flex items-center gap-2 border border-border bg-card hover:bg-secondary rounded-lg px-5 py-2.5 text-sm font-medium text-foreground transition-colors shadow-card"
              >
                Learn more
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-4 max-w-sm w-full">
              {[
                { icon: Activity, label: "Real-time execution monitoring" },
                { icon: AlertCircle, label: "Failure alerts & incidents" },
                { icon: Workflow, label: "Workflow health overview" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 text-center">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stat Cards + main content (hidden when no instances) */}
        {(isDemo || hasInstances) && (<>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard
            title="Total Workflows"
            value={stats.total_workflows}
            subtitle={`${stats.active_workflows} active`}
            icon={Workflow}
            iconColor="text-primary"
            iconBg="bg-accent"
            className="col-span-1"
          />
          <StatCard
            title="Active Workflows"
            value={stats.active_workflows}
            subtitle={`${stats.total_workflows - stats.active_workflows} inactive`}
            icon={CheckCircle2}
            iconColor="text-success"
            iconBg="bg-success/10"
            trend={{ value: 3.2, label: "vs last week" }}
            className="col-span-1"
          />
          <StatCard
            title="Executions (24h)"
            value={stats.executions_24h.toLocaleString()}
            subtitle="across all workflows"
            icon={Activity}
            iconColor="text-primary"
            iconBg="bg-accent"
            trend={{ value: 12.4, label: "vs yesterday" }}
            className="col-span-1"
          />
          <StatCard
            title="Failures (24h)"
            value={stats.failures_24h}
            subtitle="needs attention"
            icon={AlertCircle}
            iconColor="text-destructive"
            iconBg="bg-destructive/10"
            trend={{ value: -8.3, label: "vs yesterday" }}
            className="col-span-1"
          />
          <StatCard
            title="Success Rate"
            value={`${stats.success_rate}%`}
            subtitle="last 24 hours"
            icon={CheckCircle2}
            iconColor="text-success"
            iconBg="bg-success/10"
            className="col-span-1"
          />
          <StatCard
            title="Avg Duration"
            value={formatDuration(stats.avg_duration_ms)}
            subtitle="per execution"
            icon={Timer}
            iconColor="text-warning"
            iconBg="bg-warning/10"
            trend={{ value: -2.1, label: "faster" }}
            className="col-span-1"
          />
        </div>

        {/* Incidents alert banner */}
        {stats.open_incidents > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <Flame className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">{stats.open_incidents} open incident{stats.open_incidents !== 1 ? "s" : ""}</span>
              {" "}— one or more workflows are failing repeatedly.{" "}
              <a href="/dashboard/incidents" className="text-destructive font-medium underline underline-offset-2">
                View incidents
              </a>
            </p>
          </div>
        )}

        <ExecutionChart data={stats.executions_trend} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FailuresFeed executions={failedExecutions.length > 0 ? failedExecutions : executions} />
          <IncidentsWidget incidents={incidents} />
        </div>

        <WorkflowHealth workflows={workflows} />
        </>)}
      </div>
    </div>
  );
}
