"use client";

import React, { useState } from "react";
import { fmtMelb, distanceMelb } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, XCircle, Clock, RefreshCw, ChevronDown, ChevronRight,
  Activity, Database, Zap, AlertTriangle,
} from "lucide-react";
import type { InstanceStatus, BatchSummary, BatchRun } from "./page";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  instanceStatus: InstanceStatus[];
  recentBatches: BatchSummary[];
  batchRuns: BatchRun[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ ok, small }: { ok: boolean | null; small?: boolean }) {
  if (ok === null) {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full font-medium bg-gray-800 text-gray-400",
        small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs")}>
        <Clock className="w-3 h-3" /> Never run
      </span>
    );
  }
  return ok ? (
    <span className={cn("inline-flex items-center gap-1 rounded-full font-medium bg-emerald-900/40 text-emerald-400",
      small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs")}>
      <CheckCircle2 className="w-3 h-3" /> OK
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1 rounded-full font-medium bg-red-900/40 text-red-400",
      small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs")}>
      <XCircle className="w-3 h-3" /> Failed
    </span>
  );
}

function TriggerBadge({ by }: { by: string }) {
  return by === "manual" ? (
    <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-indigo-900/40 text-indigo-400">
      <Zap className="w-2.5 h-2.5" /> manual
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-gray-800 text-gray-500">
      <Clock className="w-2.5 h-2.5" /> cron
    </span>
  );
}

function ms(n: number | null): string {
  if (n == null) return "—";
  if (n < 1000) return `${n}ms`;
  return `${(n / 1000).toFixed(1)}s`;
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.port ? `:${u.port}` : "");
  } catch {
    return url.length > 40 ? url.slice(0, 40) + "…" : url;
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: "green" | "red" | "yellow" | "default";
}) {
  const colours = {
    green: "text-emerald-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
    default: "text-indigo-400",
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <Icon className={cn("w-4 h-4", colours[accent ?? "default"])} />
      </div>
      <div className={cn("text-2xl font-bold", colours[accent ?? "default"])}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CronClient({ instanceStatus, recentBatches, batchRuns }: Props) {
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  const lastBatch = recentBatches[0] ?? null;
  const activeInstances = instanceStatus.filter((i) => i.is_active);
  const lastBatchFailed = lastBatch ? lastBatch.failed > 0 : false;

  // Group batchRuns by batch_id for detail expansion
  const runsByBatch = batchRuns.reduce<Record<string, BatchRun[]>>((acc, r) => {
    if (!acc[r.batch_id]) acc[r.batch_id] = [];
    acc[r.batch_id].push(r);
    return acc;
  }, {});

  // Build instance_id → name map for batch detail rows
  const instanceMap = Object.fromEntries(
    instanceStatus.map((i) => [i.instance_id, { name: i.instance_name, org: i.org_name, url: i.instance_url }])
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Cron Sync History</h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time log of every sync run — when it fired, which orgs synced, and how many rows were upserted.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Last Cron Fire"
          value={lastBatch ? distanceMelb(lastBatch.run_at) : "Never"}
          sub={lastBatch ? fmtMelb(lastBatch.run_at, "d MMM, h:mm a") : undefined}
          icon={Clock}
          accent="default"
        />
        <StatCard
          label="Last Batch Result"
          value={lastBatch ? `${lastBatch.succeeded}/${lastBatch.total_instances} OK` : "—"}
          sub={lastBatch?.failed ? `${lastBatch.failed} failed` : "All succeeded"}
          icon={lastBatchFailed ? AlertTriangle : CheckCircle2}
          accent={lastBatch === null ? "default" : lastBatchFailed ? "red" : "green"}
        />
        <StatCard
          label="Active Instances"
          value={activeInstances.length}
          sub={`${instanceStatus.length} total`}
          icon={Activity}
          accent="default"
        />
        <StatCard
          label="Executions Last Batch"
          value={lastBatch?.total_executions.toLocaleString() ?? "—"}
          sub={lastBatch ? `${lastBatch.total_workflows.toLocaleString()} workflows` : undefined}
          icon={Database}
          accent="default"
        />
      </div>

      {/* Instance Status */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Instance Status</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Org</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Instance</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">URL</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Last Synced</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2 pr-4">Workflows</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2 pr-4">Executions</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2 pr-4">Duration</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {instanceStatus.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-600 text-sm">
                    No instances found
                  </td>
                </tr>
              )}
              {instanceStatus.map((inst) => (
                <tr key={inst.instance_id} className="hover:bg-gray-800/30">
                  <td className="py-3 pr-4">
                    <span className="text-gray-200 font-medium">{inst.org_name ?? "—"}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
                        inst.is_active ? "bg-emerald-400" : "bg-gray-600")} />
                      <span className="text-gray-300">{inst.instance_name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-gray-500 font-mono text-xs">{truncateUrl(inst.instance_url)}</span>
                  </td>
                  <td className="py-3 pr-4">
                    {inst.last_run_at ? (
                      <div>
                        <div className="text-gray-300 text-xs">{distanceMelb(inst.last_run_at)}</div>
                        <div className="text-gray-600 text-[10px]">{fmtMelb(inst.last_run_at, "d MMM, h:mm:ss a")}</div>
                      </div>
                    ) : (
                      <span className="text-gray-600 text-xs">Never</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-gray-300 tabular-nums">
                      {inst.last_run_ok != null ? (inst.last_workflows_upserted ?? 0).toLocaleString() : "—"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-gray-300 tabular-nums">
                      {inst.last_run_ok != null ? (inst.last_executions_upserted ?? 0).toLocaleString() : "—"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-gray-500 tabular-nums text-xs">{ms(inst.last_duration_ms)}</span>
                  </td>
                  <td className="py-3">
                    <div className="space-y-1">
                      <StatusBadge ok={inst.last_run_ok} />
                      {inst.last_run_ok === false && inst.last_error_message && (
                        <div className="text-[10px] text-red-400/80 max-w-[200px] truncate" title={inst.last_error_message}>
                          {inst.last_error_message}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync History */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">
          Sync History
          <span className="text-gray-600 font-normal ml-2">(last 30 batches)</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-3 w-4"></th>
                <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Time</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Trigger</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2 pr-4">Instances</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2 pr-4">Succeeded</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2 pr-4">Failed</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2 pr-4">Workflows</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2 pr-4">Executions</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {recentBatches.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-600 text-sm">
                    No sync history yet — runs will appear here after the first cron fire
                  </td>
                </tr>
              )}
              {recentBatches.map((batch) => {
                const isExpanded = expandedBatch === batch.batch_id;
                const runs = runsByBatch[batch.batch_id] ?? [];
                return (
                  <React.Fragment key={batch.batch_id}>
                    <tr
                      className={cn(
                        "cursor-pointer transition-colors",
                        batch.failed > 0 ? "bg-red-950/10 hover:bg-red-950/20" : "hover:bg-gray-800/30"
                      )}
                      onClick={() => setExpandedBatch(isExpanded ? null : batch.batch_id)}
                    >
                      <td className="py-3 pr-3">
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                          : <ChevronRight className="w-3.5 h-3.5 text-gray-600" />}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-gray-300 text-xs">{distanceMelb(batch.run_at)}</div>
                        <div className="text-gray-600 text-[10px]">{fmtMelb(batch.run_at, "d MMM, h:mm:ss a")}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <TriggerBadge by={batch.triggered_by} />
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-400 tabular-nums">{batch.total_instances}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        <span className={batch.succeeded === batch.total_instances ? "text-emerald-400" : "text-gray-400"}>
                          {batch.succeeded}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        <span className={batch.failed > 0 ? "text-red-400 font-medium" : "text-gray-600"}>
                          {batch.failed}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-400 tabular-nums">{batch.total_workflows.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-right text-gray-400 tabular-nums">{batch.total_executions.toLocaleString()}</td>
                      <td className="py-3 text-right text-gray-500 tabular-nums text-xs">{ms(batch.avg_duration_ms)}</td>
                    </tr>

                    {/* Expanded per-instance detail */}
                    {isExpanded && runs.length > 0 && (
                      <tr className="bg-gray-900/60">
                        <td colSpan={9} className="px-6 py-3">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-600">
                                <th className="text-left pb-1.5 pr-4 font-medium">Org</th>
                                <th className="text-left pb-1.5 pr-4 font-medium">Instance</th>
                                <th className="text-right pb-1.5 pr-4 font-medium">Workflows</th>
                                <th className="text-right pb-1.5 pr-4 font-medium">Executions</th>
                                <th className="text-right pb-1.5 pr-4 font-medium">Duration</th>
                                <th className="text-left pb-1.5 font-medium">Status / Error</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/30">
                              {runs.map((run, i) => {
                                const info = run.instance_id ? instanceMap[run.instance_id] : null;
                                return (
                                  <tr key={i}>
                                    <td className="py-1.5 pr-4 text-gray-400">{info?.org ?? run.org_id?.slice(0, 8) ?? "—"}</td>
                                    <td className="py-1.5 pr-4">
                                      <div className="text-gray-300">{info?.name ?? "—"}</div>
                                      {info?.url && <div className="text-gray-600 font-mono">{truncateUrl(info.url)}</div>}
                                    </td>
                                    <td className="py-1.5 pr-4 text-right text-gray-400 tabular-nums">{run.workflows_upserted.toLocaleString()}</td>
                                    <td className="py-1.5 pr-4 text-right text-gray-400 tabular-nums">{run.executions_upserted.toLocaleString()}</td>
                                    <td className="py-1.5 pr-4 text-right text-gray-500 tabular-nums">{ms(run.duration_ms)}</td>
                                    <td className="py-1.5">
                                      <div className="flex items-center gap-2">
                                        <StatusBadge ok={run.ok} small />
                                        {!run.ok && run.error_message && (
                                          <span className="text-red-400/80 truncate max-w-[300px]" title={run.error_message}>
                                            {run.error_message}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600 pt-2">
        <RefreshCw className="w-3 h-3" />
        Page refreshes on next load — all times in Melbourne timezone
      </div>
    </div>
  );
}
