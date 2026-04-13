"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn, formatDuration } from "@/lib/utils";
import type { Execution, DashboardStats } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalyticsData {
  stats: {
    totalExecutions: number;
    successRate: number;
    avgDuration: number;
    totalFailures: number;
  };
  trendData: TrendDay[];
  topFailing: TopFailingWorkflow[];
  heatmap: HeatmapCell[];
}

export interface TrendDay {
  day: string; // e.g. "Mon 04/07"
  executions: number;
  failures: number;
}

export interface TopFailingWorkflow {
  name: string;
  failures: number;
  total: number;
  successRate: number;
}

export interface HeatmapCell {
  dayIndex: number; // 0 = Sunday
  hour: number;     // 0–23
  count: number;
}

// ─── Data derivation ──────────────────────────────────────────────────────────

export function deriveAnalyticsData(
  executions: Execution[],
  stats: DashboardStats | null
): AnalyticsData {
  const now = new Date();

  // Last 7 days window
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recent = executions.filter(
    (e) => new Date(e.started_at) >= sevenDaysAgo
  );

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const totalExec = recent.length;
  const totalFail = recent.filter((e) => e.status === "error").length;
  const successRate =
    totalExec > 0
      ? Math.round(((totalExec - totalFail) / totalExec) * 1000) / 10
      : 100;
  const durations = recent
    .filter((e) => e.duration_ms != null)
    .map((e) => e.duration_ms as number);
  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  // ── 7-day trend grouped by date ────────────────────────────────────────────
  const dayMap: Record<string, { executions: number; failures: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { weekday: "short", month: "2-digit", day: "2-digit" });
    dayMap[key] = { executions: 0, failures: 0 };
  }

  for (const e of recent) {
    const d = new Date(e.started_at);
    const key = d.toLocaleDateString("en-US", { weekday: "short", month: "2-digit", day: "2-digit" });
    if (dayMap[key]) {
      dayMap[key].executions += 1;
      if (e.status === "error") dayMap[key].failures += 1;
    }
  }

  const trendData: TrendDay[] = Object.entries(dayMap).map(([day, v]) => ({
    day,
    executions: v.executions,
    failures: v.failures,
  }));

  // ── Top 5 failing workflows ─────────────────────────────────────────────────
  const wfMap: Record<string, { failures: number; total: number }> = {};
  for (const e of recent) {
    const name = e.workflow_name;
    if (!wfMap[name]) wfMap[name] = { failures: 0, total: 0 };
    wfMap[name].total += 1;
    if (e.status === "error") wfMap[name].failures += 1;
  }
  const topFailing: TopFailingWorkflow[] = Object.entries(wfMap)
    .filter(([, v]) => v.failures > 0)
    .sort((a, b) => b[1].failures - a[1].failures)
    .slice(0, 5)
    .map(([name, v]) => ({
      name,
      failures: v.failures,
      total: v.total,
      successRate:
        v.total > 0
          ? Math.round(((v.total - v.failures) / v.total) * 1000) / 10
          : 100,
    }));

  // ── Hourly heatmap: dayIndex (0=Sun) × hour ─────────────────────────────────
  const heatGrid: Record<string, number> = {};
  for (const e of recent) {
    const d = new Date(e.started_at);
    const key = `${d.getDay()}-${d.getHours()}`;
    heatGrid[key] = (heatGrid[key] ?? 0) + 1;
  }
  const heatmap: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      heatmap.push({
        dayIndex: day,
        hour,
        count: heatGrid[`${day}-${hour}`] ?? 0,
      });
    }
  }

  // ── Prefer real stats from fetchOrgStats if available ──────────────────────
  const statCards = {
    totalExecutions: stats ? stats.executions_24h * 7 : totalExec, // approx 7d from stats
    successRate: stats ? stats.success_rate : successRate,
    avgDuration: stats ? stats.avg_duration_ms : avgDuration,
    totalFailures: stats ? stats.failures_24h * 7 : totalFail,
  };

  // If we have real executions, prefer derived stats (more accurate for 7d)
  if (recent.length > 0) {
    statCards.totalExecutions = totalExec;
    statCards.successRate = successRate;
    statCards.avgDuration = avgDuration;
    statCards.totalFailures = totalFail;
  }

  return {
    stats: statCards,
    trendData,
    topFailing,
    heatmap,
  };
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

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
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
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
        <p className="text-xs text-muted-foreground mt-0.5">
          Executions and failures per day over the last 7 days
        </p>
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
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
          />
          <Area
            type="monotone"
            dataKey="executions"
            name="Executions"
            stroke="hsl(243 75% 59%)"
            strokeWidth={2}
            fill="url(#execGrad7d)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="failures"
            name="Failures"
            stroke="hsl(0 84% 60%)"
            strokeWidth={2}
            fill="url(#failGrad7d)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Top Failing Workflows ────────────────────────────────────────────────────

function TopFailingList({ workflows }: { workflows: TopFailingWorkflow[] }) {
  if (workflows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card p-5 flex flex-col items-center justify-center gap-2 min-h-[200px]">
        <span className="text-2xl">🎉</span>
        <p className="text-sm font-medium text-foreground">No failing workflows</p>
        <p className="text-xs text-muted-foreground">All workflows ran cleanly in the last 7 days.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Top Failing Workflows</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Last 7 days · by failure count</p>
      </div>
      <div className="space-y-3">
        {workflows.map((wf, i) => (
          <div key={wf.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">
                  #{i + 1}
                </span>
                <span className="text-xs font-medium text-foreground truncate">{wf.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-xs text-destructive font-semibold">
                  {wf.failures} {wf.failures === 1 ? "failure" : "failures"}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold tabular-nums",
                    wf.successRate >= 99
                      ? "text-success"
                      : wf.successRate >= 90
                      ? "text-warning"
                      : "text-destructive"
                  )}
                >
                  {wf.successRate}%
                </span>
              </div>
            </div>
            {/* Success rate bar */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  wf.successRate >= 99
                    ? "bg-success"
                    : wf.successRate >= 90
                    ? "bg-warning"
                    : "bg-destructive"
                )}
                style={{ width: `${wf.successRate}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hourly Heatmap ───────────────────────────────────────────────────────────

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function HourlyHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const maxCount = useMemo(
    () => Math.max(1, ...cells.map((c) => c.count)),
    [cells]
  );

  // Organize into dayIndex -> hour -> count
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
        <p className="text-xs text-muted-foreground mt-0.5">
          Activity by day of week and hour · last 7 days
        </p>
      </div>

      {/* Hour labels */}
      <div className="flex mb-1 pl-9">
        {[0, 4, 8, 12, 16, 20].map((h) => (
          <div
            key={h}
            className="text-[9px] text-muted-foreground"
            style={{ width: `${(4 / 24) * 100}%` }}
          >
            {h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      <div className="space-y-1">
        {DAY_LABELS.map((label, dayIdx) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground w-7 shrink-0 text-right">
              {label}
            </span>
            <div className="flex flex-1 gap-px">
              {grid[dayIdx].map((count, hour) => (
                <div
                  key={hour}
                  title={`${label} ${hour}:00 — ${count} execution${count !== 1 ? "s" : ""}`}
                  className={cn(
                    "flex-1 rounded-[2px] aspect-square cursor-default transition-opacity hover:opacity-80",
                    intensityClass(count)
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {[0, 0.2, 0.4, 0.6, 0.85].map((ratio, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 rounded-[2px]",
              ratio === 0
                ? "bg-muted/50"
                : ratio < 0.4
                ? "bg-primary/25"
                : ratio < 0.6
                ? "bg-primary/45"
                : ratio < 0.8
                ? "bg-primary/65"
                : "bg-primary/85"
            )}
          />
        ))}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string | number;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className={cn("text-2xl font-bold text-foreground", valueClass)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

interface AnalyticsClientProps {
  executions: Execution[];
  stats: DashboardStats | null;
  isDemo: boolean;
}

export function AnalyticsClient({ executions, stats, isDemo }: AnalyticsClientProps) {
  const data = useMemo(
    () => deriveAnalyticsData(executions, stats),
    [executions, stats]
  );

  const { totalExecutions, successRate, avgDuration, totalFailures } = data.stats;

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
        />
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
          sub="last 7 days"
          valueClass={successRateClass(successRate)}
        />
        <StatCard
          label="Total Failures"
          value={totalFailures.toLocaleString()}
          sub={totalFailures > 0 ? "needs attention" : "looking good"}
          valueClass={totalFailures > 0 ? "text-destructive" : undefined}
        />
        <StatCard
          label="Avg Duration"
          value={formatDuration(avgDuration)}
          sub="per execution"
        />
      </div>

      {/* 7-day trend chart */}
      <TrendChart data={data.trendData} />

      {/* Bottom row: top failing + heatmap */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TopFailingList workflows={data.topFailing} />
        <HourlyHeatmap cells={data.heatmap} />
      </div>
    </div>
  );
}
