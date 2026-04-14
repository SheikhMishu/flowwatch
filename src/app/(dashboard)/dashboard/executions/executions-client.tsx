"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import {
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  AlertTriangle,
  Zap,
  Globe,
  RotateCcw,
  Hand,
  Activity,
  ExternalLink,
  Circle,
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { Execution, ExecutionStatus } from "@/types";

interface ExecutionsClientProps {
  executions: Execution[];
}

type StatusFilter = "all" | ExecutionStatus;
type ModeFilter = "all" | Execution["mode"];

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

function NodeTimeline({ nodes }: { nodes: NonNullable<Execution["data"]>["nodes"] }) {
  const maxDuration = Math.max(...nodes.map((n) => n.duration_ms), 1);

  return (
    <div className="space-y-2">
      {nodes.map((node, i) => {
        const pct = Math.max((node.duration_ms / maxDuration) * 100, node.duration_ms > 0 ? 4 : 0);
        return (
          <div key={i} className="flex items-center gap-3">
            {/* Status icon */}
            <div className="shrink-0 w-5 flex justify-center">
              {node.status === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : node.status === "error" ? (
                <XCircle className="w-4 h-4 text-destructive" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-border bg-muted" />
              )}
            </div>
            {/* Name */}
            <span
              className={cn(
                "w-36 shrink-0 text-xs font-medium truncate",
                node.status === "error" ? "text-destructive" : node.status === "skipped" ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {node.name}
            </span>
            {/* Duration bar */}
            <div className="flex-1 relative h-4 bg-muted rounded overflow-hidden">
              {node.duration_ms > 0 && (
                <div
                  className={cn(
                    "h-full rounded transition-all",
                    node.status === "error"
                      ? "bg-destructive/60"
                      : node.status === "skipped"
                      ? "bg-muted-foreground/20"
                      : "bg-primary/40"
                  )}
                  style={{ width: `${pct}%` }}
                />
              )}
            </div>
            {/* Duration label */}
            <span className="w-14 text-right text-xs text-muted-foreground tabular-nums shrink-0">
              {node.duration_ms > 0 ? formatDuration(node.duration_ms) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const MODE_LABELS: Record<Execution["mode"], string> = {
  trigger: "Scheduled trigger",
  webhook: "Webhook",
  manual: "Manual run",
  retry: "Retry",
};

function ExecutionDetail({ execution }: { execution: Execution }) {
  const router = useRouter();
  const [nodes, setNodes] = useState(execution.data?.nodes ?? null);
  const [loadingNodes, setLoadingNodes] = useState(false);

  // Lazy-fetch node timeline for error executions that don't have it yet
  useEffect(() => {
    if (execution.status !== "error" || nodes !== null) return;
    setLoadingNodes(true);
    fetch(`/api/executions/${encodeURIComponent(execution.id)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.nodes?.length) setNodes(data.nodes);
      })
      .catch(() => null)
      .finally(() => setLoadingNodes(false));
  }, [execution.id, execution.status, nodes]);

  return (
    <div className="border-t border-border bg-muted/30 px-4 py-5 space-y-5 animate-slide-in">
      {/* ── Error block ── */}
      {execution.error_message && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
              {execution.error_type ?? "Error"}
              {execution.failed_node && (
                <span className="text-muted-foreground font-normal normal-case">
                  {" "}in <span className="font-mono font-medium text-foreground">{execution.failed_node}</span>
                </span>
              )}
            </p>
          </div>
          <pre className="bg-muted rounded-lg p-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all">
            {execution.error_message}
          </pre>
        </div>
      )}

      {/* ── Node timeline (error: lazy-fetched, success: from data if present) ── */}
      {loadingNodes && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Node Timeline</p>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-5 rounded bg-muted animate-pulse" style={{ width: `${60 + i * 10}%` }} />
            ))}
          </div>
        </div>
      )}

      {!loadingNodes && nodes && nodes.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Node Timeline</p>
          <NodeTimeline nodes={nodes} />
        </div>
      )}

      {/* ── Success summary ── */}
      {execution.status === "success" && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Duration</p>
            <p className="text-sm font-medium text-foreground tabular-nums">
              {execution.duration_ms != null ? formatDuration(execution.duration_ms) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Triggered by</p>
            <p className="text-sm font-medium text-foreground">{MODE_LABELS[execution.mode]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Finished</p>
            <p className="text-sm font-medium text-foreground">
              {execution.finished_at
                ? formatDistanceToNow(parseISO(execution.finished_at), { addSuffix: true })
                : "—"}
            </p>
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-border flex justify-end">
        <button
          onClick={() => router.push(`/dashboard/executions/${encodeURIComponent(execution.id)}`)}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          View full execution
        </button>
      </div>
    </div>
  );
}

function ExecutionRow({ execution }: { execution: Execution }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className={cn(
          "group cursor-pointer transition-colors",
          expanded ? "bg-muted/20" : "hover:bg-muted/30"
        )}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* ID */}
        <td className="px-4 py-3.5">
          <span className="font-mono text-xs text-muted-foreground">
            #{execution.n8n_execution_id}
          </span>
        </td>
        {/* Workflow */}
        <td className="px-4 py-3.5">
          <span className="font-medium text-foreground text-sm">{execution.workflow_name}</span>
        </td>
        {/* Status */}
        <td className="px-4 py-3.5">
          <StatusBadge status={execution.status} />
        </td>
        {/* Mode */}
        <td className="px-4 py-3.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
            <ModeIcon mode={execution.mode} />
            {execution.mode}
          </span>
        </td>
        {/* Started */}
        <td className="px-4 py-3.5">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(parseISO(execution.started_at), { addSuffix: true })}
          </span>
        </td>
        {/* Duration */}
        <td className="px-4 py-3.5">
          <span className="text-sm text-muted-foreground tabular-nums">
            {execution.duration_ms !== null ? formatDuration(execution.duration_ms) : "—"}
          </span>
        </td>
        {/* Failed node */}
        <td className="px-4 py-3.5">
          {execution.failed_node ? (
            <span className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-0.5">
              {execution.failed_node}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </td>
        {/* Error preview */}
        <td className="px-4 py-3.5 max-w-xs">
          {execution.error_message ? (
            <span className="text-xs text-destructive/80 font-mono truncate block">
              {execution.error_message.slice(0, 60)}
              {execution.error_message.length > 60 ? "…" : ""}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </td>
        {/* Expand */}
        <td className="px-4 py-3.5">
          <div className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={9} className="p-0">
            <ExecutionDetail execution={execution} />
          </td>
        </tr>
      )}
    </>
  );
}

export function ExecutionsClient({ executions }: ExecutionsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");

  const allModes = useMemo(() => {
    const set = new Set(executions.map((e) => e.mode));
    return Array.from(set);
  }, [executions]);

  const filtered = useMemo(() => {
    return executions.filter((e) => {
      const matchesSearch = e.workflow_name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      const matchesMode = modeFilter === "all" || e.mode === modeFilter;
      return matchesSearch && matchesStatus && matchesMode;
    });
  }, [executions, search, statusFilter, modeFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by workflow…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-card self-start">
          {(["all", "success", "error", "running"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors capitalize",
                statusFilter === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Mode filter */}
        <div className="flex items-center gap-1.5">
          {(["all", ...allModes] as (ModeFilter | "all")[]).map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m as ModeFilter)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                modeFilter === m
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {m !== "all" && <ModeIcon mode={m as Execution["mode"]} />}
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-card p-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Activity className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No executions found</p>
          <p className="text-xs text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    #ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Workflow
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
                    Failed Node
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Error
                  </th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((execution) => (
                  <ExecutionRow key={execution.id} execution={execution} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-right">
        Showing {filtered.length} of {executions.length} executions
      </p>
    </div>
  );
}
