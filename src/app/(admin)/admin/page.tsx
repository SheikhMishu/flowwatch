import { TZDate } from "@date-fns/tz";
import { getServerDb } from "@/lib/db";
import { OverviewClient } from "./overview-client";
import type { RecentOrg } from "./overview-client";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const db = getServerDb();

  const now = new Date();
  const MELB = "Australia/Melbourne";
  const nowMelb = new TZDate(now, MELB);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = new TZDate(
    nowMelb.getFullYear(),
    nowMelb.getMonth(),
    nowMelb.getDate(),
    0, 0, 0, 0,
    MELB
  );

  const [
    { count: totalUsers },
    { count: totalOrgs },
    { count: orgsThisWeek },
    { count: usersThisWeek },
    { data: planBreakdownRaw },
    { data: aiSummaryRaw },
    { count: alertsToday },
    { count: alertsThisWeek },
    { count: activeInstances },
    { count: openIncidents },
    { count: landingSignups },
    { data: recentOrgsRaw },
    { data: churnRaw },
    { data: activeGhostRaw },
  ] = await Promise.all([
    db.from("users").select("id", { count: "exact", head: true }),
    db.from("organizations").select("id", { count: "exact", head: true }),
    db
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString()),
    db
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString()),
    db.rpc("admin_plan_breakdown"),
    db.rpc("admin_ai_usage_summary"),
    db
      .from("alert_firings")
      .select("id", { count: "exact", head: true })
      .gte("fired_at", todayStart.toISOString()),
    db
      .from("alert_firings")
      .select("id", { count: "exact", head: true })
      .gte("fired_at", weekAgo.toISOString()),
    db
      .from("n8n_instances")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    db
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    db.from("signups").select("id", { count: "exact", head: true }),
    db.rpc("admin_recent_orgs", { p_limit: 8 }),
    db.rpc("admin_churn_stats"),
    db.rpc("admin_active_ghost_stats"),
  ]);

  // Plan breakdown (RPC returns single row)
  type PlanRow = { free: number; pro: number; team: number; enterprise: number };
  const planRow = (planBreakdownRaw as PlanRow[] | null)?.[0];
  const planBreakdown = {
    free: Number(planRow?.free ?? 0),
    pro: Number(planRow?.pro ?? 0),
    team: Number(planRow?.team ?? 0),
  };

  // AI usage summary (RPC returns single row)
  type AiSummaryRow = { total: number; this_month: number };
  const aiRow = (aiSummaryRaw as AiSummaryRow[] | null)?.[0];
  const aiCallsTotal = Number(aiRow?.total ?? 0);
  const aiCallsThisMonth = Number(aiRow?.this_month ?? 0);

  const mrr = planBreakdown.pro * 29 + planBreakdown.team * 79;

  // Recent orgs
  const recentOrgs: RecentOrg[] = ((recentOrgsRaw as RecentOrg[] | null) ?? []);

  // Churn stats (RPC returns single row)
  type ChurnRow = { canceled: number; canceling: number; past_due: number };
  const churnRow = (churnRaw as ChurnRow[] | null)?.[0];
  const churnStats = {
    canceled: Number(churnRow?.canceled ?? 0),
    canceling: Number(churnRow?.canceling ?? 0),
    past_due: Number(churnRow?.past_due ?? 0),
  };

  // Active vs ghost (RPC returns single row)
  type ActiveGhostRow = { active_orgs: number; ghost_orgs: number };
  const agRow = (activeGhostRaw as ActiveGhostRow[] | null)?.[0];
  const activeGhostStats = {
    active_orgs: Number(agRow?.active_orgs ?? 0),
    ghost_orgs: Number(agRow?.ghost_orgs ?? 0),
  };

  return (
    <OverviewClient
      totalUsers={totalUsers ?? 0}
      totalOrgs={totalOrgs ?? 0}
      orgsThisWeek={orgsThisWeek ?? 0}
      usersThisWeek={usersThisWeek ?? 0}
      planBreakdown={planBreakdown}
      mrr={mrr}
      aiCallsTotal={aiCallsTotal}
      aiCallsThisMonth={aiCallsThisMonth}
      alertsToday={alertsToday ?? 0}
      alertsThisWeek={alertsThisWeek ?? 0}
      activeInstances={activeInstances ?? 0}
      openIncidents={openIncidents ?? 0}
      landingSignups={landingSignups ?? 0}
      recentOrgs={recentOrgs}
      churnStats={churnStats}
      activeGhostStats={activeGhostStats}
    />
  );
}
