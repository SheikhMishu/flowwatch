import { TZDate } from "@date-fns/tz";
import { getServerDb } from "@/lib/db";
import { OverviewClient } from "./overview-client";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const db = getServerDb();

  const now = new Date();
  const MELB = "Australia/Melbourne";
  const nowMelb = new TZDate(now, MELB);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = new TZDate(nowMelb.getFullYear(), nowMelb.getMonth(), nowMelb.getDate(), 0, 0, 0, 0, MELB);

  const [
    { count: totalUsers },
    { count: totalOrgs },
    { count: orgsThisWeek },
    { count: usersThisWeek },
    { data: planData },
    { data: aiData },
    { count: alertsToday },
    { count: alertsThisWeek },
    { count: activeInstances },
    { count: openIncidents },
    { count: landingSignups },
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
    db.from("organizations").select("plan").limit(10000),
    db.from("ai_usage").select("count").limit(10000),
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
  ]);

  const planBreakdown = { free: 0, pro: 0, team: 0 };
  for (const o of planData ?? []) {
    const p = o.plan as "free" | "pro" | "team";
    if (p in planBreakdown) planBreakdown[p]++;
  }

  const mrr = planBreakdown.pro * 29 + planBreakdown.team * 79;
  const aiCallsTotal = (aiData ?? []).reduce(
    (s, r) => s + (r.count ?? 0),
    0
  );

  return (
    <OverviewClient
      totalUsers={totalUsers ?? 0}
      totalOrgs={totalOrgs ?? 0}
      orgsThisWeek={orgsThisWeek ?? 0}
      usersThisWeek={usersThisWeek ?? 0}
      planBreakdown={planBreakdown}
      mrr={mrr}
      aiCallsTotal={aiCallsTotal}
      aiCallsToday={0}
      alertsToday={alertsToday ?? 0}
      alertsThisWeek={alertsThisWeek ?? 0}
      activeInstances={activeInstances ?? 0}
      openIncidents={openIncidents ?? 0}
      landingSignups={landingSignups ?? 0}
    />
  );
}
