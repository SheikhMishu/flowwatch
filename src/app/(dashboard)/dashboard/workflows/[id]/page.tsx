import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Zap,
  Globe,
  RotateCcw,
  Hand,
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { cn, formatDuration } from "@/lib/utils";
import { getSession } from "@/lib/auth";
import { fetchWorkflowWithExecutions } from "@/lib/n8n-data";
import { mockWorkflows, mockExecutions } from "@/lib/mock-data";
import type { Execution, ExecutionStatus, Workflow } from "@/types";

// ─── Inline StatusBadge (server-safe) ────────────────────────────────────────

function StatusBadge({ status }: { status: ExecutionStatus }) {
  switch (status) {
    case "success":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
          <CheckCircle2 className="w-3 h-3" />
          Success
        </span>
      );
    case "error":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
          <XCircle className="w-3 h-3" />
          Error
        </span>
      );
    case "running":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
          Running
        </span>
      );
    case "waiting":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/20 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
          <Clock className="w-3 h-3" />
          Waiting
        </span>
      );
    case "canceled":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          <Ban className="w-3 h-3" />
          Canceled
        </span>
      );
  }
}

// ─── Inline ModeIcon (server-safe) ───────────────────────────────────────────

function ModeIcon({ mode }: { mode: Execution["mode"] }) {
  const props = { className: "w-3.5 h-3.5" };
  switch (mode) {
    case "trigger":
      return <Zap {...props} />;
    case "webhook":
      return <Globe {...props} />;
    case "retry":
      return <RotateCcw {...props} />;
    case "manual":
      return <Hand {...props} />;
  }
}

// ─── Success Rate color helper ────────────────────────────────────────────────

function successRateColor(rate: number) {
  if (rate >= 99) return "text-success";
  if (rate >= 95) return "text-warning";
  return "text-destructive";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const compositeId = decodeURIComponent(rawId);

  const session = await getSession();
  const isDemo = !session || session.orgId === "org_demo";

  let workflow: Workflow | null = null;
  let executions: Execution[] = [];

  if (!isDemo) {
    const result = await fetchWorkflowWithExecutions(session!.orgId, compositeId);
    if (result) {
      workflow = result.workflow;
      executions = result.executions;
    }
  }

  // Fall back to mock data for demo orgs or failed fetches
  if (!workflow) {
    workflow = mockWorkflows.find((w) => w.id === compositeId) ?? null;
    if (workflow) {
      executions = mockExecutions.filter((e) => e.workflow_id === workflow!.id);
    }
  }

  // ── Not found state ──────────────────────────────────────────────────────────
  if (!workflow) {
    return (
      <>
        <Header title="Workflow Not Found" />
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="rounded-xl border border-border bg-card shadow-card p-10 text-center max-w-sm w-full animate-fade-in">
            <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">Workflow not found</h2>
            <p className="text-sm text-muted-foreground mb-6">
              The workflow <span className="font-mono text-xs bg-muted rounded px-1 py-0.5">{compositeId}</span> could not be found.
            </p>
            <Link
              href="/dashboard/workflows"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Workflows
            </Link>
          </div>
        </main>
      </>
    );
  }

  // Sort executions newest first, cap at 50
  const sortedExecutions = [...executions]
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, 50);

  const successRate = workflow.success_rate;

  return (
    <>
      <Header title={workflow.name} />

      <main className="flex-1 space-y-6 p-4 md:p-6 animate-fade-in">
        {/* Back link */}
        <Link
          href="/dashboard/workflows"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Workflows
        </Link>

        {/* ── Workflow header card ─────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card shadow-card p-5 animate-slide-in">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-lg font-semibold text-foreground truncate">
                  {workflow.name}
                </h1>
                {/* Workflow active/inactive badge */}
                {workflow.status === "active" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    Inactive
                  </span>
                )}
              </div>

              {/* Tags */}
              {workflow.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {workflow.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Dates */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Created {format(parseISO(workflow.created_at), "MMM d, yyyy")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Updated {formatDistanceToNow(parseISO(workflow.updated_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground shrink-0">
              <span className="font-mono bg-muted rounded px-2 py-1">{workflow.node_count} nodes</span>
            </div>
          </div>
        </div>

        {/* ── Stats row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Success Rate */}
          <div className="rounded-xl border border-border bg-card shadow-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Success Rate
            </p>
            <p className={cn("text-2xl font-bold tabular-nums", successRateColor(successRate))}>
              {successRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {successRate >= 99 ? "Excellent" : successRate >= 95 ? "Needs attention" : "Critical"}
            </p>
          </div>

          {/* Avg Duration */}
          <div className="rounded-xl border border-border bg-card shadow-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Avg Duration
            </p>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {formatDuration(workflow.avg_duration_ms)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">per execution</p>
          </div>

          {/* Executions 24h */}
          <div className="rounded-xl border border-border bg-card shadow-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Executions (24h)
            </p>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {workflow.executions_24h.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">last 24 hours</p>
          </div>

          {/* Failures 24h */}
          <div className="rounded-xl border border-border bg-card shadow-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Failures (24h)
            </p>
            <p className={cn(
              "text-2xl font-bold tabular-nums",
              workflow.failures_24h === 0 ? "text-success" : workflow.failures_24h <= 3 ? "text-warning" : "text-destructive"
            )}>
              {workflow.failures_24h}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {workflow.failures_24h === 0 ? "No failures" : "last 24 hours"}
            </p>
          </div>
        </div>

        {/* ── Execution history ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Execution History</h2>
            <span className="text-xs text-muted-foreground">
              Last {sortedExecutions.length} execution{sortedExecutions.length !== 1 ? "s" : ""}
            </span>
          </div>

          {sortedExecutions.length === 0 ? (
            <div className="rounded-xl border border-border bg-card shadow-card p-16 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No executions yet</p>
              <p className="text-xs text-muted-foreground">
                Executions will appear here once this workflow runs.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        #ID
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Mode
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Started
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Duration
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedExecutions.map((exec) => (
                      <tr key={exec.id} className="group hover:bg-muted/30 transition-colors">
                        {/* ID — linked */}
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/dashboard/executions/${encodeURIComponent(exec.id)}`}
                            className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            #{exec.n8n_execution_id}
                          </Link>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/dashboard/executions/${encodeURIComponent(exec.id)}`}
                            className="inline-flex"
                          >
                            <StatusBadge status={exec.status} />
                          </Link>
                        </td>
                        {/* Mode */}
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/dashboard/executions/${encodeURIComponent(exec.id)}`}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground capitalize hover:text-foreground transition-colors"
                          >
                            <ModeIcon mode={exec.mode} />
                            {exec.mode}
                          </Link>
                        </td>
                        {/* Started */}
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/dashboard/executions/${encodeURIComponent(exec.id)}`}
                            className="text-sm text-muted-foreground whitespace-nowrap hover:text-foreground transition-colors"
                            title={format(parseISO(exec.started_at), "MMM d, yyyy HH:mm:ss")}
                          >
                            {formatDistanceToNow(parseISO(exec.started_at), { addSuffix: true })}
                          </Link>
                        </td>
                        {/* Duration */}
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/dashboard/executions/${encodeURIComponent(exec.id)}`}
                            className="text-sm text-muted-foreground tabular-nums hover:text-foreground transition-colors"
                          >
                            {exec.duration_ms !== null ? formatDuration(exec.duration_ms) : "—"}
                          </Link>
                        </td>
                        {/* Error */}
                        <td className="px-4 py-3.5 max-w-xs">
                          <Link
                            href={`/dashboard/executions/${encodeURIComponent(exec.id)}`}
                            className="block"
                          >
                            {exec.error_message ? (
                              <span className="text-xs text-destructive/80 font-mono truncate block">
                                {exec.error_message.slice(0, 60)}
                                {exec.error_message.length > 60 ? "…" : ""}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
