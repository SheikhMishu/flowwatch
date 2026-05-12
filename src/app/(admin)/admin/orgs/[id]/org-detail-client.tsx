"use client";

import React from "react";
import Link from "next/link";
import { distanceMelb, fmtMelb } from "@/lib/dates";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  GitBranch,
  Play,
  Bell,
  AlertTriangle,
  Cpu,
  CheckCircle2,
  XCircle,
  ExternalLink,
  CreditCard,
  ScrollText,
  Loader2,
  Search,
  Circle,
  Tag,
  Clock,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface OrgFull {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "team";
  plan_status: string;
  created_at: string;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
}

interface MemberRow {
  id: string;
  role: "owner" | "admin" | "viewer";
  created_at: string;
  users: { id: string; email: string; name: string } | null;
}

interface InstanceRow {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  created_at: string;
}

interface AiUsageRow {
  month: string;
  count: number;
}

interface WorkflowRow {
  id: string;
  name: string;
  is_active: boolean;
  node_count: number;
  tags: string[];
  updated_at: string;
  n8n_instances: { name: string } | null;
}

interface ExecutionRow {
  id: string;
  workflow_name: string;
  status: string;
  mode: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  failed_node: string | null;
}

interface IncidentRow {
  id: string;
  workflow_name: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "investigating" | "resolved";
  title: string;
  failure_count: number;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at: string | null;
}

interface ActivityLogEntry {
  id: string;
  user_email: string | null;
  user_name: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip: string | null;
  created_at: string;
}

interface SystemLogEntry {
  id: string;
  level: "warn" | "error" | "fatal";
  category: string | null;
  message: string;
  created_at: string;
}

interface OrgDetailClientProps {
  org: OrgFull;
  members: MemberRow[];
  instances: InstanceRow[];
  workflowCount: number;
  executionCount: number;
  alertCount: number;
  incidentCount: number;
  openIncidents: number;
  aiUsage: AiUsageRow[];
  aiTotal: number;
  aiThisMonth: number;
  alertFirings: number;
  workflows: WorkflowRow[];
  recentExecutions: ExecutionRow[];
  allIncidents: IncidentRow[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function planBadgeClass(plan: string) {
  switch (plan) {
    case "pro":   return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "team":  return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    default:      return "bg-secondary text-muted-foreground border-border";
  }
}

function roleBadgeClass(role: string) {
  switch (role) {
    case "owner": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "admin": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    default:      return "bg-secondary text-muted-foreground border-border";
  }
}

function initials(name: string, email: string) {
  const source = name || email;
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function avatarColor(str: string) {
  const colors = [
    "from-indigo-500 to-blue-600",
    "from-purple-500 to-violet-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-sky-600",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function planStatusVariant(
  status: string
): "success" | "warning" | "destructive" | "default" | "secondary" {
  switch (status) {
    case "active":    return "success";
    case "trialing":  return "default";
    case "past_due":  return "warning";
    case "canceled":
    case "canceling": return "destructive";
    default:          return "secondary";
  }
}

function fmtDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

function executionStatusClass(status: string) {
  switch (status) {
    case "success":  return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "error":
    case "crashed":  return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    case "warning":  return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "running":  return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "waiting":  return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
    default:         return "bg-secondary text-muted-foreground border-border";
  }
}

function severityClass(s: string) {
  switch (s) {
    case "critical": return "bg-red-500/10 text-red-600 border-red-500/20";
    case "high":     return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    case "medium":   return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "low":      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    default:         return "bg-secondary text-muted-foreground border-border";
  }
}

function incidentStatusClass(s: string) {
  switch (s) {
    case "open":          return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    case "investigating": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "resolved":      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    default:              return "bg-secondary text-muted-foreground border-border";
  }
}

function Pill({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize", className)}>
      {label}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass = "text-muted-foreground",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
      <div className="mt-0.5 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className={cn("w-4 h-4", iconClass)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold text-foreground tabular-nums leading-tight mt-0.5">
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Chart Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground">{payload[0].value.toLocaleString()} calls</p>
    </div>
  );
}

// ── Logs Section ──────────────────────────────────────────────────────────────

function levelClass(level: string) {
  switch (level) {
    case "warn":  return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "error": return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    case "fatal": return "bg-red-600/10 text-red-700 border-red-600/20";
    default:      return "bg-secondary text-muted-foreground border-border";
  }
}

function OrgLogsSection({ orgId }: { orgId: string }) {
  const [tab, setTab] = React.useState<"activity" | "system">("activity");
  const [logs, setLogs] = React.useState<(ActivityLogEntry | SystemLogEntry)[]>([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const LIMIT = 25;

  React.useEffect(() => {
    load(tab, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function load(type: string, off: number) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/orgs/${orgId}/logs?type=${type}&limit=${LIMIT}&offset=${off}`
      );
      const data = await res.json();
      const next: (ActivityLogEntry | SystemLogEntry)[] = data.logs ?? [];
      setLogs((prev) => (off === 0 ? next : [...prev, ...next]));
      setTotal(data.total ?? 0);
      setOffset(off + next.length);
    } finally {
      setLoading(false);
    }
  }

  const hasMore = logs.length < total;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Logs</h2>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-muted">
          {(["activity", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1 text-xs rounded-md font-medium transition-colors",
                tab === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "activity" ? "Activity" : "System"}
            </button>
          ))}
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : logs.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No logs found</p>
      ) : (
        <div className="overflow-x-auto">
          {tab === "activity" ? (
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-32">Time</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-40">User</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Action</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-36">Resource</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-28">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(logs as ActivityLogEntry[]).map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {distanceMelb(log.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-foreground font-medium truncate max-w-[156px]">
                        {log.user_name || log.user_email || "—"}
                      </p>
                      {log.user_name && log.user_email && (
                        <p className="text-muted-foreground truncate max-w-[156px]">{log.user_email}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <code className="text-foreground">{log.action}</code>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {log.resource_type ? (
                        <>
                          {log.resource_type}
                          {log.resource_id && (
                            <span className="ml-1 font-mono text-muted-foreground/60">
                              {log.resource_id.slice(0, 8)}…
                            </span>
                          )}
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">
                      {log.ip || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-32">Time</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-20">Level</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-28">Category</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(logs as SystemLogEntry[]).map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {distanceMelb(log.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Pill label={log.level} className={levelClass(log.level)} />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{log.category || "—"}</td>
                    <td className="px-4 py-2.5 text-foreground">
                      <span className="line-clamp-2 break-all">{log.message}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {logs.length > 0 && (
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {logs.length.toLocaleString()} of {total.toLocaleString()}
          </span>
          {hasMore && (
            <button
              onClick={() => load(tab, offset)}
              disabled={loading}
              className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Workflows Tab ─────────────────────────────────────────────────────────────

function WorkflowsTab({ workflows }: { workflows: WorkflowRow[] }) {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "active" | "inactive">("all");

  const filtered = React.useMemo(() => {
    return workflows.filter((w) => {
      const matchSearch = w.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "active" && w.is_active) ||
        (filter === "inactive" && !w.is_active);
      return matchSearch && matchFilter;
    });
  }, [workflows, search, filter]);

  const activeCount = workflows.filter((w) => w.is_active).length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span><span className="font-semibold text-foreground">{workflows.length}</span> total</span>
        <span><span className="font-semibold text-emerald-500">{activeCount}</span> active</span>
        <span><span className="font-semibold text-muted-foreground">{workflows.length - activeCount}</span> inactive</span>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-muted self-start">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md font-medium transition-colors capitalize",
                filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No workflows found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[560px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-8"></th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Workflow</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-36">Instance</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-16">Nodes</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-32">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className={cn("w-2 h-2 rounded-full", w.is_active ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground truncate max-w-[280px]">{w.name}</p>
                      {w.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <Tag className="w-2.5 h-2.5 text-muted-foreground/50 flex-shrink-0" />
                          {w.tags.slice(0, 4).map((t) => (
                            <span key={t} className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                          {w.tags.length > 4 && (
                            <span className="text-[10px] text-muted-foreground">+{w.tags.length - 4}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[144px]">
                      {w.n8n_instances?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{w.node_count}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {distanceMelb(w.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border text-xs text-muted-foreground">
            Showing {filtered.length.toLocaleString()} of {workflows.length.toLocaleString()} workflows
          </div>
        )}
      </div>
    </div>
  );
}

// ── Executions Tab ────────────────────────────────────────────────────────────

function ExecutionsTab({ executions }: { executions: ExecutionRow[] }) {
  const [statusFilter, setStatusFilter] = React.useState<"all" | "success" | "error">("all");
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    return executions.filter((e) => {
      const matchSearch = e.workflow_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "error" && (e.status === "error" || e.status === "crashed")) ||
        (statusFilter === "success" && e.status === "success");
      return matchSearch && matchStatus;
    });
  }, [executions, search, statusFilter]);

  const successCount = executions.filter((e) => e.status === "success").length;
  const errorCount = executions.filter((e) => e.status === "error" || e.status === "crashed").length;
  const successRate = executions.length > 0 ? Math.round((successCount / executions.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span><span className="font-semibold text-foreground">{executions.length}</span> loaded</span>
        <span><span className="font-semibold text-emerald-500">{successCount}</span> success</span>
        <span><span className="font-semibold text-rose-500">{errorCount}</span> errors</span>
        <span><span className="font-semibold text-foreground">{successRate}%</span> success rate</span>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by workflow name…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-muted self-start">
          {(["all", "success", "error"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md font-medium transition-colors capitalize",
                statusFilter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No executions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[620px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-24">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Workflow</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-20">Mode</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-32">Started</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-20">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3">
                      <Pill label={e.status} className={executionStatusClass(e.status)} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground truncate max-w-[240px]">{e.workflow_name}</p>
                      {e.error_message && (
                        <p className="text-rose-500 truncate max-w-[240px] mt-0.5">{e.error_message}</p>
                      )}
                      {e.failed_node && !e.error_message && (
                        <p className="text-muted-foreground truncate max-w-[240px] mt-0.5">
                          Failed at: {e.failed_node}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                        e.mode === "manual"
                          ? "bg-secondary text-muted-foreground border-border"
                          : "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                      )}>
                        {e.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {distanceMelb(e.started_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        {fmtDuration(e.duration_ms)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border text-xs text-muted-foreground">
            Showing {filtered.length.toLocaleString()} of {executions.length.toLocaleString()} executions (most recent 200)
          </div>
        )}
      </div>
    </div>
  );
}

// ── Incidents Tab ─────────────────────────────────────────────────────────────

function IncidentsTab({ incidents }: { incidents: IncidentRow[] }) {
  const [statusFilter, setStatusFilter] = React.useState<"all" | "open" | "investigating" | "resolved">("all");
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    return incidents.filter((inc) => {
      const matchSearch =
        inc.title.toLowerCase().includes(search.toLowerCase()) ||
        inc.workflow_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || inc.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [incidents, search, statusFilter]);

  const openCount = incidents.filter((i) => i.status === "open").length;
  const investigatingCount = incidents.filter((i) => i.status === "investigating").length;
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span><span className="font-semibold text-foreground">{incidents.length}</span> total</span>
        <span><span className="font-semibold text-rose-500">{openCount}</span> open</span>
        <span><span className="font-semibold text-amber-500">{investigatingCount}</span> investigating</span>
        <span><span className="font-semibold text-emerald-500">{resolvedCount}</span> resolved</span>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incidents…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-muted self-start">
          {(["all", "open", "investigating", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md font-medium transition-colors capitalize",
                statusFilter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No incidents found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-20">Severity</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-24">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Incident</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-16 text-right">Failures</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-32">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((inc) => (
                  <tr key={inc.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Pill label={inc.severity} className={severityClass(inc.severity)} />
                    </td>
                    <td className="px-4 py-3">
                      <Pill label={inc.status} className={incidentStatusClass(inc.status)} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground truncate max-w-[260px]">{inc.title}</p>
                      <p className="text-muted-foreground truncate max-w-[260px] mt-0.5 flex items-center gap-1">
                        <GitBranch className="w-2.5 h-2.5 flex-shrink-0" />
                        {inc.workflow_name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={cn(
                        "font-semibold",
                        inc.failure_count >= 10 ? "text-rose-500" : inc.failure_count >= 3 ? "text-amber-500" : "text-foreground"
                      )}>
                        {inc.failure_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {distanceMelb(inc.last_seen_at)}
                      {inc.resolved_at && (
                        <p className="text-emerald-600 mt-0.5">
                          resolved {distanceMelb(inc.resolved_at)}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border text-xs text-muted-foreground">
            Showing {filtered.length.toLocaleString()} of {incidents.length.toLocaleString()} incidents
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type MainTab = "overview" | "workflows" | "executions" | "incidents";

export function OrgDetailClient({
  org,
  members,
  instances,
  workflowCount,
  executionCount,
  alertCount,
  incidentCount,
  openIncidents,
  aiUsage,
  aiTotal,
  aiThisMonth,
  alertFirings,
  workflows,
  recentExecutions,
  allIncidents,
}: OrgDetailClientProps) {
  const [tab, setTab] = React.useState<MainTab>("overview");

  const chartData = aiUsage.map((r) => ({
    month: fmtMelb(r.month, "MMM"),
    calls: r.count,
  }));

  const TABS: { id: MainTab; label: string; count?: number }[] = [
    { id: "overview",   label: "Overview" },
    { id: "workflows",  label: "Workflows",  count: workflowCount },
    { id: "executions", label: "Executions", count: executionCount },
    { id: "incidents",  label: "Incidents",  count: incidentCount },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground transition-colors">Admin</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/admin/orgs" className="hover:text-foreground transition-colors">Organizations</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{org.name}</span>
      </nav>

      <Link
        href="/admin/orgs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Organizations
      </Link>

      {/* ── Org Header ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-border flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold text-foreground">{org.name}</h1>
              <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", planBadgeClass(org.plan))}>
                {org.plan}
              </span>
              <Badge variant={planStatusVariant(org.plan_status)}>
                {org.plan_status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">/{org.slug}</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
              <span>
                Created <span className="text-foreground">{distanceMelb(org.created_at)}</span>
              </span>
              {org.current_period_end && (
                <span>
                  Renews <span className="text-foreground">{fmtMelb(org.current_period_end, "MMM d, yyyy")}</span>
                </span>
              )}
              {org.stripe_subscription_id ? (
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  <span className="text-foreground font-mono">{org.stripe_subscription_id}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground/60">
                  <CreditCard className="w-3 h-3" />
                  No Stripe subscription
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                tab === t.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {t.count.toLocaleString()}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}

      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={GitBranch} label="Workflows" value={workflowCount.toLocaleString()} iconClass="text-indigo-500" />
            <StatCard icon={Play} label="Executions" value={executionCount.toLocaleString()} iconClass="text-emerald-500" />
            <StatCard
              icon={Bell}
              label="Active Alerts"
              value={alertCount.toLocaleString()}
              sub={`${alertFirings} fired this month`}
              iconClass="text-amber-500"
            />
            <StatCard
              icon={AlertTriangle}
              label="Incidents"
              value={`${openIncidents} / ${incidentCount}`}
              sub="open / total"
              iconClass={openIncidents > 0 ? "text-rose-500" : "text-muted-foreground"}
            />
          </div>

          {/* Quick health indicators */}
          {(openIncidents > 0 || executionCount === 0) && (
            <div className="flex flex-wrap gap-3">
              {openIncidents > 0 && (
                <button
                  onClick={() => setTab("incidents")}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/5 text-rose-600 text-xs font-medium hover:bg-rose-500/10 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {openIncidents} open incident{openIncidents !== 1 ? "s" : ""} — view →
                </button>
              )}
              {executionCount === 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-600 text-xs font-medium">
                  <Zap className="w-3.5 h-3.5" />
                  No executions synced yet
                </div>
              )}
            </div>
          )}

          {/* AI Usage */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-semibold text-foreground">AI Usage</h2>
              </div>
              <div className="flex items-center gap-5 text-xs">
                <div>
                  <p className="text-muted-foreground">This month</p>
                  <p className="font-semibold text-foreground tabular-nums">{aiThisMonth.toLocaleString()}</p>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <p className="text-muted-foreground">All time</p>
                  <p className="font-semibold text-foreground tabular-nums">{aiTotal.toLocaleString()}</p>
                </div>
              </div>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData} barSize={20} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--secondary))" }} />
                  <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">
                No AI usage data yet
              </div>
            )}
          </div>

          {/* Members + Instances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Members */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Members</h2>
                <span className="text-xs text-muted-foreground">{members.length}</span>
              </div>
              <div className="divide-y divide-border">
                {members.length === 0 && (
                  <p className="px-5 py-8 text-sm text-center text-muted-foreground">No members found</p>
                )}
                {members.map((m) => {
                  const user = m.users;
                  const displayName = user?.name || user?.email || "Unknown";
                  const email = user?.email || "";
                  return (
                    <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0", avatarColor(email))}>
                        <span className="text-white text-xs font-semibold">{initials(user?.name ?? "", email)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate leading-none">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Pill label={m.role} className={roleBadgeClass(m.role)} />
                        <span className="text-[10px] text-muted-foreground">{distanceMelb(m.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instances */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">n8n Instances</h2>
                <span className="text-xs text-muted-foreground">{instances.length}</span>
              </div>
              <div className="divide-y divide-border">
                {instances.length === 0 && (
                  <p className="px-5 py-8 text-sm text-center text-muted-foreground">No instances connected</p>
                )}
                {instances.map((inst) => (
                  <div key={inst.id} className="px-5 py-3 flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-0.5", inst.is_active ? "bg-emerald-500" : "bg-gray-400")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate leading-none">{inst.name}</p>
                      <a
                        href={inst.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors truncate mt-0.5 flex items-center gap-0.5 w-fit"
                      >
                        {inst.url}
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      </a>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        {inst.is_active ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted-foreground/50" />
                        )}
                        <span className={cn("text-xs font-medium", inst.is_active ? "text-emerald-500" : "text-muted-foreground")}>
                          {inst.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{distanceMelb(inst.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Logs */}
          <OrgLogsSection orgId={org.id} />
        </div>
      )}

      {tab === "workflows" && <WorkflowsTab workflows={workflows} />}
      {tab === "executions" && <ExecutionsTab executions={recentExecutions} />}
      {tab === "incidents" && <IncidentsTab incidents={allIncidents} />}

    </div>
  );
}
