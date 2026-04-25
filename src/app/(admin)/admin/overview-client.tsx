"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  DollarSign,
  Server,
  Brain,
  Bell,
  MousePointerClick,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface OverviewClientProps {
  totalUsers: number;
  totalOrgs: number;
  orgsThisWeek: number;
  usersThisWeek: number;
  planBreakdown: { free: number; pro: number; team: number };
  mrr: number;
  aiCallsTotal: number;
  aiCallsToday: number;
  alertsToday: number;
  alertsThisWeek: number;
  activeInstances: number;
  openIncidents: number;
  landingSignups: number;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function fmtMoney(n: number): string {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  sub?: React.ReactNode;
  accent?: string;
  className?: string;
}

function StatCard({
  title,
  value,
  icon,
  iconBg,
  sub,
  accent,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-5 flex flex-col gap-4",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
          {icon}
        </div>
      </div>
      <div>
        <p
          className={cn(
            "text-3xl font-bold font-mono tracking-tight leading-none",
            accent ?? "text-foreground"
          )}
        >
          {value}
        </p>
        {sub && <div className="mt-2">{sub}</div>}
      </div>
    </div>
  );
}

interface PlanBarProps {
  planBreakdown: { free: number; pro: number; team: number };
  total: number;
}

function PlanBar({ planBreakdown, total }: PlanBarProps) {
  if (total === 0) {
    return (
      <div className="h-2 rounded-full bg-border w-full" />
    );
  }

  const freePct = (planBreakdown.free / total) * 100;
  const proPct = (planBreakdown.pro / total) * 100;
  const teamPct = (planBreakdown.team / total) * 100;

  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-px">
      {freePct > 0 && (
        <div
          className="bg-gray-400 rounded-l-full"
          style={{ width: `${freePct}%` }}
          title={`Free: ${planBreakdown.free}`}
        />
      )}
      {proPct > 0 && (
        <div
          className="bg-indigo-500"
          style={{ width: `${proPct}%` }}
          title={`Pro: ${planBreakdown.pro}`}
        />
      )}
      {teamPct > 0 && (
        <div
          className="bg-violet-500 rounded-r-full"
          style={{ width: `${teamPct}%` }}
          title={`Team: ${planBreakdown.team}`}
        />
      )}
    </div>
  );
}

export function OverviewClient({
  totalUsers,
  totalOrgs,
  orgsThisWeek,
  usersThisWeek,
  planBreakdown,
  mrr,
  aiCallsTotal,
  aiCallsToday,
  alertsToday,
  alertsThisWeek,
  activeInstances,
  openIncidents,
  landingSignups,
}: OverviewClientProps) {
  const totalOrgsWithPlan =
    planBreakdown.free + planBreakdown.pro + planBreakdown.team;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Platform Overview
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time stats across all organizations and users.
        </p>
      </div>

      {/* Row 1 — 4 primary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orgs */}
        <StatCard
          title="Organizations"
          value={fmt(totalOrgs)}
          iconBg="bg-blue-500/10"
          icon={<Building2 className="w-4 h-4 text-blue-500" />}
          sub={
            <div className="flex items-center gap-1.5">
              <Badge variant="default" className="text-[10px] px-1.5 py-0 font-mono">
                +{orgsThisWeek} this week
              </Badge>
            </div>
          }
        />

        {/* Total Users */}
        <StatCard
          title="Total Users"
          value={fmt(totalUsers)}
          iconBg="bg-emerald-500/10"
          icon={<Users className="w-4 h-4 text-emerald-500" />}
          accent="text-emerald-600 dark:text-emerald-400"
          sub={
            <div className="flex items-center gap-1.5">
              <Badge
                variant="success"
                className="text-[10px] px-1.5 py-0 font-mono"
              >
                +{usersThisWeek} this week
              </Badge>
            </div>
          }
        />

        {/* MRR */}
        <StatCard
          title="Monthly Revenue"
          value={`${fmtMoney(mrr)}/mo`}
          iconBg="bg-amber-500/10"
          icon={<DollarSign className="w-4 h-4 text-amber-500" />}
          accent="text-amber-600 dark:text-amber-400"
          sub={
            <div className="space-y-2">
              <PlanBar planBreakdown={planBreakdown} total={totalOrgsWithPlan} />
              <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-gray-400 inline-block" />
                  {planBreakdown.free} free
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block" />
                  {planBreakdown.pro} pro
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-violet-500 inline-block" />
                  {planBreakdown.team} team
                </span>
              </div>
            </div>
          }
        />

        {/* Infrastructure */}
        <StatCard
          title="Infrastructure"
          value={fmt(activeInstances)}
          iconBg="bg-slate-500/10"
          icon={<Server className="w-4 h-4 text-slate-400" />}
          sub={
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Active instances</span>
              {openIncidents > 0 ? (
                <Badge
                  variant="destructive"
                  className="text-[10px] px-1.5 py-0 font-mono gap-1"
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {openIncidents} incident{openIncidents !== 1 ? "s" : ""}
                </Badge>
              ) : (
                <Badge
                  variant="success"
                  className="text-[10px] px-1.5 py-0"
                >
                  All clear
                </Badge>
              )}
            </div>
          }
        />
      </div>

      {/* Row 2 — 3 secondary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* AI Usage */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              AI Calls
            </p>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-500" />
            </div>
          </div>
          <p className="text-3xl font-bold font-mono tracking-tight text-violet-600 dark:text-violet-400 leading-none">
            {fmt(aiCallsTotal)}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Today
              </p>
              <p className="text-sm font-mono font-semibold text-foreground">
                {fmt(aiCallsToday)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                This Week
              </p>
              <p className="text-sm font-mono font-semibold text-foreground">
                —
              </p>
            </div>
          </div>
        </div>

        {/* Alert Firings */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Alert Firings
            </p>
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                alertsToday > 0 ? "bg-red-500/10" : "bg-orange-500/10"
              )}
            >
              <Bell
                className={cn(
                  "w-4 h-4",
                  alertsToday > 0 ? "text-red-500" : "text-orange-400"
                )}
              />
            </div>
          </div>
          <p
            className={cn(
              "text-3xl font-bold font-mono tracking-tight leading-none",
              alertsToday > 0
                ? "text-red-600 dark:text-red-400"
                : "text-foreground"
            )}
          >
            {fmt(alertsToday)}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Today
              </p>
              <p className="text-sm font-mono font-semibold text-foreground">
                {fmt(alertsToday)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                This Week
              </p>
              <p className="text-sm font-mono font-semibold text-foreground">
                {fmt(alertsThisWeek)}
              </p>
            </div>
          </div>
        </div>

        {/* Landing Signups */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Landing Signups
            </p>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 leading-none">
            {fmt(landingSignups)}
          </p>
          <div className="pt-1 border-t border-border">
            <p className="text-[10px] text-muted-foreground">
              Email signups captured on the landing page before full registration.
            </p>
          </div>
        </div>
      </div>

      {/* Plan distribution detail */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Plan Distribution
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalOrgsWithPlan} organizations across all tiers
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Paid conversion</p>
            <p className="text-sm font-mono font-bold text-foreground">
              {totalOrgsWithPlan > 0
                ? (
                    ((planBreakdown.pro + planBreakdown.team) /
                      totalOrgsWithPlan) *
                    100
                  ).toFixed(1)
                : "0"}
              %
            </p>
          </div>
        </div>

        {/* Wide bar */}
        <div className="flex h-3 rounded-full overflow-hidden gap-px mb-3">
          {totalOrgsWithPlan > 0 ? (
            <>
              {planBreakdown.free > 0 && (
                <div
                  className="bg-gray-300 dark:bg-gray-600"
                  style={{
                    width: `${(planBreakdown.free / totalOrgsWithPlan) * 100}%`,
                  }}
                />
              )}
              {planBreakdown.pro > 0 && (
                <div
                  className="bg-indigo-500"
                  style={{
                    width: `${(planBreakdown.pro / totalOrgsWithPlan) * 100}%`,
                  }}
                />
              )}
              {planBreakdown.team > 0 && (
                <div
                  className="bg-violet-500"
                  style={{
                    width: `${(planBreakdown.team / totalOrgsWithPlan) * 100}%`,
                  }}
                />
              )}
            </>
          ) : (
            <div className="w-full bg-border rounded-full" />
          )}
        </div>

        {/* Legend row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Free",
              count: planBreakdown.free,
              color: "bg-gray-300 dark:bg-gray-600",
              textColor: "text-muted-foreground",
              price: "$0/mo",
            },
            {
              label: "Pro",
              count: planBreakdown.pro,
              color: "bg-indigo-500",
              textColor: "text-indigo-600 dark:text-indigo-400",
              price: "$29/mo",
            },
            {
              label: "Team",
              count: planBreakdown.team,
              color: "bg-violet-500",
              textColor: "text-violet-600 dark:text-violet-400",
              price: "$79/mo",
            },
          ].map((tier) => (
            <div key={tier.label} className="flex items-start gap-2.5">
              <div
                className={cn(
                  "w-3 h-3 rounded-sm mt-0.5 flex-shrink-0",
                  tier.color
                )}
              />
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "text-lg font-bold font-mono leading-none",
                      tier.textColor
                    )}
                  >
                    {tier.count}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {tier.label}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {tier.price} ·{" "}
                  {totalOrgsWithPlan > 0
                    ? ((tier.count / totalOrgsWithPlan) * 100).toFixed(1)
                    : "0"}
                  %
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
