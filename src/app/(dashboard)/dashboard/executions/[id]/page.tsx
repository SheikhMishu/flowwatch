import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle2,
  Circle,
  Clock,
  Globe,
  Hand,
  RotateCcw,
  XCircle,
  Zap,
} from "lucide-react";

import { getSession } from "@/lib/auth";
import { fetchExecutionWithData } from "@/lib/n8n-data";
import { mockExecutions } from "@/lib/mock-data";
import { Header } from "@/components/layout/header";
import { RetryButton } from "@/components/dashboard/retry-button";
import { AiExplainPanel } from "@/components/dashboard/ai-explain-panel";
import { formatDuration } from "@/lib/utils";
import type { Execution, ExecutionStatus } from "@/types";

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ExecutionStatus }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-success/10 text-success border border-success/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Success
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-destructive/10 text-destructive border border-destructive/20">
        <XCircle className="w-3.5 h-3.5" />
        Error
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-primary/10 text-primary border border-primary/20">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
        Running
      </span>
    );
  }
  if (status === "waiting") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-warning/10 text-warning border border-warning/20">
        <Clock className="w-3.5 h-3.5" />
        Waiting
      </span>
    );
  }
  // canceled
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-muted text-muted-foreground border border-border">
      <Ban className="w-3.5 h-3.5" />
      Canceled
    </span>
  );
}

// ─── Mode badge ───────────────────────────────────────────────────────────────

function ModeBadge({ mode }: { mode: Execution["mode"] }) {
  const config: Record<
    Execution["mode"],
    { icon: React.ReactNode; label: string }
  > = {
    trigger: { icon: <Zap className="w-3 h-3" />, label: "Trigger" },
    webhook: { icon: <Globe className="w-3 h-3" />, label: "Webhook" },
    manual: { icon: <Hand className="w-3 h-3" />, label: "Manual" },
    retry: { icon: <RotateCcw className="w-3 h-3" />, label: "Retry" },
  };
  const { icon, label } = config[mode] ?? config.manual;
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-secondary text-muted-foreground border border-border">
      {icon}
      {label}
    </span>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatTs(iso: string) {
  try {
    return format(parseISO(iso), "MMM d, yyyy 'at' h:mm:ss a");
  } catch {
    return iso;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const compositeId = decodeURIComponent(rawId);

  const session = await getSession();

  let execution: Execution | null = null;

  // Try real data first (non-demo orgs)
  if (session && session.orgId !== "org_demo") {
    execution = await fetchExecutionWithData(session.orgId, compositeId).catch(
      () => null
    );
  }

  // Fall back to mock data for demo or on fetch failure
  if (!execution) {
    execution =
      mockExecutions.find(
        (e) =>
          e.id === compositeId ||
          `${e.instance_id}:${e.n8n_execution_id}` === compositeId
      ) ?? null;
  }

  // ─── Not found ──────────────────────────────────────────────────────────────

  if (!execution) {
    return (
      <div className="flex flex-col min-h-full">
        <Header title="Execution Not Found" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="rounded-xl border border-border bg-card shadow-card p-10 flex flex-col items-center gap-4 max-w-sm w-full text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                Execution not found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This execution may have been deleted or the ID is invalid.
              </p>
            </div>
            <Link
              href="/dashboard/executions"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Executions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Node timeline max duration for bar scaling ──────────────────────────────

  const nodes = execution.data?.nodes ?? [];
  const maxNodeDuration = nodes.length
    ? Math.max(...nodes.map((n) => n.duration_ms), 1)
    : 1;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-full">
      <Header title={`Execution #${execution.n8n_execution_id}`} />

      <div className="flex-1 p-4 md:p-6 space-y-5 animate-fade-in">
        {/* ── Breadcrumb nav ── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Link
            href="/dashboard/executions"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Executions
          </Link>

          {execution.workflow_id && (
            <Link
              href={`/dashboard/workflows/${encodeURIComponent(execution.workflow_id)}`}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              View workflow
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* ── Execution header card ── */}
        <div className="rounded-xl border border-border bg-card shadow-card p-5 animate-slide-in">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left: IDs + workflow name */}
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-lg font-bold text-foreground">
                  #{execution.n8n_execution_id}
                </span>
                <StatusBadge status={execution.status} />
                <ModeBadge mode={execution.mode} />
              </div>
              <p className="text-sm font-semibold text-foreground truncate">
                {execution.workflow_name}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                ID: {execution.id}
              </p>
            </div>

            {/* Right: timing info */}
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-6 gap-y-2 text-sm shrink-0">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                  Started
                </p>
                <p className="text-foreground font-medium">
                  {formatTs(execution.started_at)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                  Finished
                </p>
                <p className="text-foreground font-medium">
                  {execution.finished_at
                    ? formatTs(execution.finished_at)
                    : "Running"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                  Duration
                </p>
                <p className="text-foreground font-medium tabular-nums">
                  {execution.duration_ms != null
                    ? formatDuration(execution.duration_ms)
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Error section ── */}
        {execution.error_message && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 shadow-card p-5 space-y-4 animate-slide-in">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-destructive">
                    {execution.error_type ?? "Error"}
                    {execution.failed_node && (
                      <span className="text-muted-foreground font-normal">
                        {" "}in{" "}
                        <span className="font-mono font-medium text-foreground">
                          {execution.failed_node}
                        </span>
                      </span>
                    )}
                  </p>
                  {/* Node type */}
                  {nodes.find((n) => n.name === execution.failed_node)?.type && (
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {nodes.find((n) => n.name === execution.failed_node)!.type}
                    </p>
                  )}
                </div>
              </div>
              <RetryButton
                executionId={`${execution.instance_id}:${execution.n8n_execution_id}`}
                variant="sm"
                className="shrink-0"
              />
            </div>

            {/* Error message */}
            <pre className="text-xs font-mono text-destructive bg-destructive/10 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
              {execution.error_message}
            </pre>

            {/* Error description (extra context from n8n) */}
            {nodes.find((n) => n.name === execution.failed_node)?.error_description && (
              <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 leading-relaxed">
                {nodes.find((n) => n.name === execution.failed_node)!.error_description}
              </p>
            )}

            {/* Input data to the failed node */}
            {(() => {
              const failedNode = nodes.find((n) => n.name === execution.failed_node);
              const items = failedNode?.input_items;
              if (!items || items.length === 0) return null;
              return (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Input to failed node ({items.length} item{items.length !== 1 ? "s" : ""})
                  </p>
                  <pre className="text-xs font-mono text-foreground bg-muted rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed max-h-48">
                    {JSON.stringify(items.length === 1 ? items[0] : items, null, 2)}
                  </pre>
                </div>
              );
            })()}

            {/* AI explain */}
            <AiExplainPanel
              workflowId={execution.workflow_id}
              workflowName={execution.workflow_name}
              failedNode={execution.failed_node}
              errorMessage={execution.error_message!}
              errorType={execution.error_type}
              nodeType={nodes.find((n) => n.name === execution.failed_node)?.type}
              inputItems={nodes.find((n) => n.name === execution.failed_node)?.input_items as unknown[]}
            />
          </div>
        )}

        {/* ── Node Timeline ── */}
        {nodes.length > 0 && (
          <div className="rounded-xl border border-border bg-card shadow-card p-5 space-y-4 animate-slide-in">
            <h2 className="text-sm font-semibold text-foreground">
              Node Timeline
            </h2>

            <div className="space-y-3">
              {nodes.map((node, i) => {
                const barPercent =
                  maxNodeDuration > 0
                    ? Math.max(
                        (node.duration_ms / maxNodeDuration) * 100,
                        node.status === "skipped" ? 0 : 2
                      )
                    : 0;

                const barColor =
                  node.status === "success"
                    ? "bg-primary/40"
                    : node.status === "error"
                      ? "bg-destructive/60"
                      : "bg-muted-foreground/20";

                const iconEl =
                  node.status === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : node.status === "error" ? (
                    <XCircle className="w-4 h-4 text-destructive shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  );

                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-3">
                      {iconEl}
                      <div className="min-w-0 flex-1">
                        <span className="text-sm text-foreground font-medium truncate block">
                          {node.name}
                        </span>
                        {node.type && (
                          <span className="text-xs text-muted-foreground font-mono truncate block">
                            {node.type}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-muted-foreground tabular-nums block">
                          {node.status === "skipped" ? "skipped" : formatDuration(node.duration_ms)}
                        </span>
                        {node.output_items && node.output_items.length > 0 && (
                          <span className="text-xs text-muted-foreground tabular-nums block">
                            {node.output_items.length} item{node.output_items.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="ml-7 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${barPercent}%` }}
                      />
                    </div>

                    {/* Node error */}
                    {node.error && (
                      <p className="ml-7 text-xs text-destructive font-mono leading-relaxed">
                        {node.error}
                      </p>
                    )}
                    {node.error_description && (
                      <p className="ml-7 text-xs text-muted-foreground leading-relaxed">
                        {node.error_description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
