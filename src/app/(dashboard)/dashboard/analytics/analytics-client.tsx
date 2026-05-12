"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { formatDistanceToNowStrict } from "date-fns";
import { cn, formatDuration } from "@/lib/utils";
import type { Execution, DashboardStats } from "@/types";
import type {
  DailyExecutionAggregate,
  WorkflowPerformanceStat,
  ErrorMessageStat,
} from "@/lib/n8n-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalyticsData {
  stats: {
    totalExecutions: number;
    successRate: number;
    avgDuration: number;
    totalFailures: number;
  };
  prevStats: {
    totalExecutions: number;
    successRate: number;
    avgDuration: number;
    totalFailures: number;
  } | null;
  trendData: TrendDay[];
  heatmap: HeatmapCell[];
}

export interface TrendDay {
  day: string;
  executions: number;
  failures: number;
}

export interface HeatmapCell {
  dayIndex: number; // 0 = Sunday
  hour: number;     // 0–23
  count: number;
}

// ─── Data derivation ──────────────────────────────────────────────────────────

function computePeriodStats(days: DailyExecutionAggregate[]) {
  const total = days.reduce((s, d) => s + d.total, 0);
  const failures = days.reduce((s, d) => s + d.failures, 0);
  const successRate = total > 0 ? Math.round(((total - failures) / total) * 1000) / 10 : 100;

  // Weighted avg duration
  let weightedSum = 0;
  let weightedCount = 0;
  for (const d of days) {
    if (d.avg_duration_ms != null && d.total > 0) {
      weightedSum += d.avg_duration_ms * d.total;
      weightedCount += d.total;
    }
  }
  const avgDuration = weightedCount > 0 ? Math.round(weightedSum / weightedCount) : 0;

  return { totalExecutions: total, totalFailures: failures, successRate, avgDuration };
}

export function deriveAnalyticsData(
  executions: Execution[],
  stats: DashboardStats | null,
  dailyAggregates: DailyExecutionAggregate[] = []
): AnalyticsData {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Split 14-day aggregates into prev (older) and current (recent) 7d
  // aggregates are sorted ascending by date from the RPC
  const sortedAggs = [...dailyAggregates].sort((a, b) => a.date.localeCompare(b.date));
  const prevAggs = sortedAggs.slice(0, 7);
  const currentAggs = sortedAggs.slice(7);

  let currentStats: AnalyticsData["stats"];
  let prevStats: AnalyticsData["prevStats"] = null;

  if (currentAggs.length > 0) {
    currentStats = computePeriodStats(currentAggs);
    if (prevAggs.length > 0) {
      prevStats = computePeriodStats(prevAggs);
    }
  } else {
    // Fallback: derive from raw executions for the last 7d
    const recent = executions.filter((e) => new Date(e.started_at) >= sevenDaysAgo);
    const totalExec = recent.length;
    const totalFail = recent.filter((e) => e.status === "error").length;
    const successRate = totalExec > 0 ? Math.round(((totalExec - totalFail) / totalExec) * 1000) / 10 : 100;
    const durations = recent.filter((e) => e.duration_ms != null).map((e) => e.duration_ms as number);
    const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

    currentStats = stats
      ? { totalExecutions: stats.executions_24h * 7, successRate: stats.success_rate, avgDuration: stats.avg_duration_ms, totalFailures: stats.failures_24h * 7 }
      : { totalExecutions: totalExec, successRate, avgDuration, totalFailures: totalFail };

    if (recent.length > 0) {
      currentStats = { totalExecutions: totalExec, successRate, avgDuration, totalFailures: totalFail };
    }
  }

  // ── 7-day trend ─────────────────────────────────────────────────────────────
  const dayScaffold: Record<string, { executions: number; failures: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayScaffold[key] = { executions: 0, failures: 0 };
  }

  if (currentAggs.length > 0) {
    for (const agg of currentAggs) {
      if (dayScaffold[agg.date] !== undefined) {
        dayScaffold[agg.date] = { executions: agg.total, failures: agg.failures };
      }
    }
  } else {
    const recent = executions.filter((e) => new Date(e.started_at) >= sevenDaysAgo);
    for (const e of recent) {
      const key = e.started_at.slice(0, 10);
      if (dayScaffold[key]) {
        dayScaffold[key].executions += 1;
        if (e.status === "error") dayScaffold[key].failures += 1;
      }
    }
  }

  const trendData: TrendDay[] = Object.entries(dayScaffold).map(([dateKey, v]) => {
    const d = new Date(dateKey + "T00:00:00Z");
    const day = d.toLocaleDateString("en-US", { weekday: "short", month: "2-digit", day: "2-digit", timeZone: "UTC" });
    return { day, executions: v.executions, failures: v.failures };
  });

  // ── Heatmap (always from raw executions) ────────────────────────────────────
  const heatGrid: Record<string, number> = {};
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  for (const e of executions) {
    if (new Date(e.started_at) < fourteenDaysAgo) continue;
    const d = new Date(e.started_at);
    const key = `${d.getDay()}-${d.getHours()}`;
    heatGrid[key] = (heatGrid[key] ?? 0) + 1;
  }
  const heatmap: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      heatmap.push({ dayIndex: day, hour, count: heatGrid[`${day}-${hour}`] ?? 0 });
    }
  }

  return { stats: currentStats, prevStats, trendData, heatmap };
}

// ─── Delta badge ─────────────────────────────────────────────────────────────

function DeltaBadge({
  current,
  prev,
  higherIsBetter = true,
}: {
  current: number;
  prev: number;
  higherIsBetter?: boolean;
}) {
  if (prev === 0) return null;
  const pct = Math.round(((current - prev) / prev) * 100);
  if (pct === 0) return null;

  const isPositive = pct > 0;
  const isGood = higherIsBetter ? isPositive : !isPositive;
  const arrow = isPositive ? "▲" : "▼";

  return (
    <span
      className={cn(
        "text-[10px] font-semibold tabular-nums",
        isGood ? "text-success" : "text-destructive"
      )}
    >
      {arrow} {Math.abs(pct)}%
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  valueClass,
  delta,
}: {
  label: string;
  value: string | number;
  sub?: string;
  valueClass?: string;
  delta?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className={cn("text-2xl font-bold text-foreground", valueClass)}>{value}</p>
        {delta}
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  color: string;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Trend Chart ─────────────────────────────────────────────────────────────

function TrendChart({ data }: { data: TrendDay[] }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">7-Day Execution Trend</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Executions and failures per day over the last 7 days</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="execGrad7d" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(243 75% 59%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(243 75% 59%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="failGrad7d" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
          <Area type="monotone" dataKey="executions" name="Executions" stroke="hsl(243 75% 59%)" strokeWidth={2} fill="url(#execGrad7d)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          <Area type="monotone" dataKey="failures" name="Failures" stroke="hsl(0 84% 60%)" strokeWidth={2} fill="url(#failGrad7d)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Workflow Performance Table ───────────────────────────────────────────────

type SortKey = "total" | "failures" | "successRate" | "avg_duration_ms" | "last_run_at";

function WorkflowPerformanceTable({ workflows }: { workflows: WorkflowPerformanceStat[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    return [...workflows].sort((a, b) => {
      let av: number, bv: number;
      if (sortKey === "successRate") {
        av = a.total > 0 ? (a.total - a.failures) / a.total : 1;
        bv = b.total > 0 ? (b.total - b.failures) / b.total : 1;
      } else if (sortKey === "last_run_at") {
        av = new Date(a.last_run_at).getTime();
        bv = new Date(b.last_run_at).getTime();
      } else {
        av = (a[sortKey] as number | null) ?? -1;
        bv = (b[sortKey] as number | null) ?? -1;
      }
      return sortAsc ? av - bv : bv - av;
    });
  }, [workflows, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((p) => !p);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function SortHeader({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <th
        className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
        onClick={() => toggleSort(col)}
      >
        {label}{active ? (sortAsc ? " ↑" : " ↓") : ""}
      </th>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card p-5 flex flex-col items-center justify-center gap-2 min-h-[140px]">
        <p className="text-sm font-medium text-foreground">No workflow data</p>
        <p className="text-xs text-muted-foreground">Sync an n8n instance to see workflow performance.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Workflow Performance</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Last 7 days · click column headers to sort</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Workflow</th>
              <SortHeader col="total" label="Executions" />
              <SortHeader col="failures" label="Failures" />
              <SortHeader col="successRate" label="Success Rate" />
              <SortHeader col="avg_duration_ms" label="Avg Duration" />
              <SortHeader col="last_run_at" label="Last Run" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((wf) => {
              const successRate = wf.total > 0 ? Math.round(((wf.total - wf.failures) / wf.total) * 1000) / 10 : 100;
              const rateClass = successRate >= 99 ? "text-success" : successRate >= 90 ? "text-warning" : "text-destructive";
              const barClass = successRate >= 99 ? "bg-success" : successRate >= 90 ? "bg-warning" : "bg-destructive";
              return (
                <tr key={wf.workflow_name} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-3 font-medium text-foreground max-w-[200px]">
                    <Link
                      href={`/dashboard/executions?workflow=${encodeURIComponent(wf.workflow_name)}`}
                      className="truncate block hover:text-primary transition-colors"
                      title={wf.workflow_name}
                    >
                      {wf.workflow_name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 tabular-nums text-foreground">{wf.total.toLocaleString()}</td>
                  <td className={cn("px-3 py-3 tabular-nums font-semibold", wf.failures > 0 ? "text-destructive" : "text-muted-foreground")}>
                    {wf.failures > 0 ? wf.failures.toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-semibold tabular-nums", rateClass)}>{successRate}%</span>
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full", barClass)} style={{ width: `${successRate}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 tabular-nums text-muted-foreground">
                    {wf.avg_duration_ms != null ? formatDuration(wf.avg_duration_ms) : "—"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNowStrict(new Date(wf.last_run_at), { addSuffix: true })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Error Message Breakdown ──────────────────────────────────────────────────

function ErrorBreakdown({ errors }: { errors: ErrorMessageStat[] }) {
  if (errors.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card p-5 flex flex-col items-center justify-center gap-2 min-h-[200px]">
        <span className="text-2xl">🎉</span>
        <p className="text-sm font-medium text-foreground">No errors in the last 7 days</p>
        <p className="text-xs text-muted-foreground">All workflows ran cleanly.</p>
      </div>
    );
  }

  const maxCount = Math.max(...errors.map((e) => e.count));

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Top Errors</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Last 7 days · by frequency</p>
      </div>
      <div className="space-y-3">
        {errors.map((err, i) => (
          <div key={i}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <span
                className="text-xs text-foreground truncate leading-relaxed"
                title={err.error_message}
              >
                {err.error_message.length > 72 ? err.error_message.slice(0, 72) + "…" : err.error_message}
              </span>
              <span className="shrink-0 text-[10px] font-bold text-destructive bg-destructive/10 rounded-full px-2 py-0.5 tabular-nums">
                {err.count}
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-destructive/50"
                style={{ width: `${(err.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Duration Bar Chart ───────────────────────────────────────────────────────

interface DurationBarTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function DurationBarTooltip({ active, payload, label }: DurationBarTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">Avg: <span className="font-medium text-foreground">{formatDuration(payload[0].value)}</span></p>
    </div>
  );
}

function DurationBarChart({ workflows }: { workflows: WorkflowPerformanceStat[] }) {
  const data = useMemo(() => {
    return [...workflows]
      .filter((w) => w.avg_duration_ms != null)
      .sort((a, b) => (b.avg_duration_ms ?? 0) - (a.avg_duration_ms ?? 0))
      .slice(0, 10)
      .map((w) => ({
        name: w.workflow_name.length > 22 ? w.workflow_name.slice(0, 22) + "…" : w.workflow_name,
        fullName: w.workflow_name,
        duration: Math.round(w.avg_duration_ms ?? 0),
      }));
  }, [workflows]);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card p-5 flex flex-col items-center justify-center gap-2 min-h-[200px]">
        <p className="text-sm font-medium text-foreground">No duration data</p>
        <p className="text-xs text-muted-foreground">Duration data will appear after executions complete.</p>
      </div>
    );
  }

  const maxDuration = Math.max(...data.map((d) => d.duration));

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Slowest Workflows</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Top 10 by avg duration · last 7 days</p>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatDuration(v)}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip content={<DurationBarTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
          <Bar dataKey="duration" radius={[0, 3, 3, 0]} maxBarSize={20}>
            {data.map((entry, i) => {
              const ratio = entry.duration / maxDuration;
              const opacity = 0.4 + ratio * 0.6;
              return <Cell key={i} fill={`hsl(243 75% 59% / ${opacity})`} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Hourly Heatmap ───────────────────────────────────────────────────────────

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function HourlyHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const maxCount = useMemo(() => Math.max(1, ...cells.map((c) => c.count)), [cells]);

  const grid = useMemo(() => {
    const g: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
    for (const cell of cells) {
      g[cell.dayIndex][cell.hour] = cell.count;
    }
    return g;
  }, [cells]);

  function intensityClass(count: number): string {
    if (count === 0) return "bg-muted/50";
    const ratio = count / maxCount;
    if (ratio < 0.2) return "bg-primary/10";
    if (ratio < 0.4) return "bg-primary/25";
    if (ratio < 0.6) return "bg-primary/45";
    if (ratio < 0.8) return "bg-primary/65";
    return "bg-primary/85";
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Execution Heatmap</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Activity by day of week and hour · last 14 days</p>
      </div>
      <div className="flex mb-1 pl-9">
        {[0, 4, 8, 12, 16, 20].map((h) => (
          <div key={h} className="text-[9px] text-muted-foreground" style={{ width: `${(4 / 24) * 100}%` }}>
            {h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {DAY_LABELS.map((label, dayIdx) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground w-7 shrink-0 text-right">{label}</span>
            <div className="flex flex-1 gap-px">
              {grid[dayIdx].map((count, hour) => (
                <div
                  key={hour}
                  title={`${label} ${hour}:00 — ${count} execution${count !== 1 ? "s" : ""}`}
                  className={cn("flex-1 rounded-[2px] aspect-square cursor-default transition-opacity hover:opacity-80", intensityClass(count))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {[0, 0.2, 0.4, 0.6, 0.85].map((ratio, i) => (
          <div
            key={i}
            className={cn("w-3 h-3 rounded-[2px]", ratio === 0 ? "bg-muted/50" : ratio < 0.4 ? "bg-primary/25" : ratio < 0.6 ? "bg-primary/45" : ratio < 0.8 ? "bg-primary/65" : "bg-primary/85")}
          />
        ))}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

interface AnalyticsClientProps {
  executions: Execution[];
  stats: DashboardStats | null;
  isDemo: boolean;
  dailyAggregates?: DailyExecutionAggregate[];
  workflowStats?: WorkflowPerformanceStat[];
  errorBreakdown?: ErrorMessageStat[];
}

export function AnalyticsClient({
  executions,
  stats,
  isDemo,
  dailyAggregates = [],
  workflowStats = [],
  errorBreakdown = [],
}: AnalyticsClientProps) {
  const data = useMemo(
    () => deriveAnalyticsData(executions, stats, dailyAggregates),
    [executions, stats, dailyAggregates]
  );

  const { totalExecutions, successRate, avgDuration, totalFailures } = data.stats;
  const prev = data.prevStats;

  function successRateClass(rate: number): string {
    if (rate >= 99) return "text-success";
    if (rate >= 95) return "text-warning";
    return "text-destructive";
  }

  return (
    <div className="space-y-5">
      {isDemo && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-2.5 text-xs text-warning">
          Demo mode — showing sample data. Connect an n8n instance to see real analytics.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Executions (7d)"
          value={totalExecutions.toLocaleString()}
          sub="across all workflows"
          delta={prev && <DeltaBadge current={totalExecutions} prev={prev.totalExecutions} higherIsBetter={true} />}
        />
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
          sub="last 7 days"
          valueClass={successRateClass(successRate)}
          delta={prev && <DeltaBadge current={successRate} prev={prev.successRate} higherIsBetter={true} />}
        />
        <StatCard
          label="Total Failures"
          value={totalFailures.toLocaleString()}
          sub={totalFailures > 0 ? "needs attention" : "looking good"}
          valueClass={totalFailures > 0 ? "text-destructive" : undefined}
          delta={prev && <DeltaBadge current={totalFailures} prev={prev.totalFailures} higherIsBetter={false} />}
        />
        <StatCard
          label="Avg Duration"
          value={formatDuration(avgDuration)}
          sub="per execution"
          delta={prev && prev.avgDuration > 0 && <DeltaBadge current={avgDuration} prev={prev.avgDuration} higherIsBetter={false} />}
        />
      </div>

      {/* 7-day trend chart */}
      <TrendChart data={data.trendData} />

      {/* Workflow performance table */}
      <WorkflowPerformanceTable workflows={workflowStats} />

      {/* Bottom row: error breakdown + heatmap + duration chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ErrorBreakdown errors={errorBreakdown} />
        <HourlyHeatmap cells={data.heatmap} />
        <DurationBarChart workflows={workflowStats} />
      </div>
    </div>
  );
}
