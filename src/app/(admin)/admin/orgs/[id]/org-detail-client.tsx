"use client";

import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
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
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function planBadgeClass(plan: string) {
  switch (plan) {
    case "pro":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "team":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    default:
      return "bg-secondary text-muted-foreground border-border";
  }
}

function roleBadgeClass(role: string) {
  switch (role) {
    case "owner":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "admin":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    default:
      return "bg-secondary text-muted-foreground border-border";
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
    case "active":
      return "success";
    case "trialing":
      return "default";
    case "past_due":
      return "warning";
    case "canceled":
    case "canceling":
      return "destructive";
    default:
      return "secondary";
  }
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

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground">{payload[0].value.toLocaleString()} calls</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

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
}: OrgDetailClientProps) {
  const chartData = aiUsage.map((r) => ({
    month: format(new Date(r.month), "MMM"),
    calls: r.count,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground transition-colors">
          Admin
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/admin/orgs" className="hover:text-foreground transition-colors">
          Organizations
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{org.name}</span>
      </nav>

      {/* Back button */}
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
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                  planBadgeClass(org.plan)
                )}
              >
                {org.plan}
              </span>
              <Badge variant={planStatusVariant(org.plan_status)}>
                {org.plan_status.replace("_", " ")}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mt-0.5">/{org.slug}</p>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
              <span>
                Created{" "}
                <span className="text-foreground">
                  {formatDistanceToNow(new Date(org.created_at), { addSuffix: true })}
                </span>
              </span>
              {org.current_period_end && (
                <span>
                  Renews{" "}
                  <span className="text-foreground">
                    {format(new Date(org.current_period_end), "MMM d, yyyy")}
                  </span>
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

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={GitBranch}
          label="Workflows"
          value={workflowCount.toLocaleString()}
          iconClass="text-indigo-500"
        />
        <StatCard
          icon={Play}
          label="Executions"
          value={executionCount.toLocaleString()}
          iconClass="text-emerald-500"
        />
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

      {/* ── AI Usage ── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-foreground">AI Usage</h2>
          </div>
          <div className="flex items-center gap-5 text-xs">
            <div className="text-right">
              <p className="text-muted-foreground">This month</p>
              <p className="font-semibold text-foreground tabular-nums">
                {aiThisMonth.toLocaleString()}
              </p>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="text-right">
              <p className="text-muted-foreground">All time</p>
              <p className="font-semibold text-foreground tabular-nums">
                {aiTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} barSize={20} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
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

      {/* ── Members & Instances Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Members */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Members</h2>
            <span className="text-xs text-muted-foreground">{members.length}</span>
          </div>
          <div className="divide-y divide-border">
            {members.length === 0 && (
              <p className="px-5 py-8 text-sm text-center text-muted-foreground">
                No members found
              </p>
            )}
            {members.map((m) => {
              const user = m.users;
              const displayName = user?.name || user?.email || "Unknown";
              const email = user?.email || "";
              return (
                <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                      avatarColor(email)
                    )}
                  >
                    <span className="text-white text-xs font-semibold">
                      {initials(user?.name ?? "", email)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate leading-none">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{email}</p>
                  </div>

                  {/* Role + date */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                        roleBadgeClass(m.role)
                      )}
                    >
                      {m.role}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </span>
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
              <p className="px-5 py-8 text-sm text-center text-muted-foreground">
                No instances connected
              </p>
            )}
            {instances.map((inst) => (
              <div key={inst.id} className="px-5 py-3 flex items-center gap-3">
                {/* Status dot */}
                <div
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0 mt-0.5",
                    inst.is_active ? "bg-emerald-500" : "bg-gray-400"
                  )}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate leading-none">
                    {inst.name}
                  </p>
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

                {/* Status label + date */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    {inst.is_active ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-muted-foreground/50" />
                    )}
                    <span
                      className={cn(
                        "text-xs font-medium",
                        inst.is_active ? "text-emerald-500" : "text-muted-foreground"
                      )}
                    >
                      {inst.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(inst.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
