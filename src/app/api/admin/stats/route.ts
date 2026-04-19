import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getServerDb();
  const { data: adminUser } = await db.from("users").select("is_super_admin").eq("id", session.userId).single();
  if (!adminUser?.is_super_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [
    totalUsersRes,
    totalOrgsRes,
    orgsThisWeekRes,
    orgsThisMonthRes,
    usersThisWeekRes,
    planBreakdownRes,
    aiTotalRes,
    aiThisMonthRes,
    alertsTodayRes,
    alertsThisWeekRes,
    activeInstancesRes,
    openIncidentsRes,
    landingSignupsRes,
  ] = await Promise.all([
    db.from("users").select("id", { count: "exact", head: true }),
    db.from("organizations").select("id", { count: "exact", head: true }),
    db.from("organizations").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    db.from("organizations").select("id", { count: "exact", head: true }).gte("created_at", monthAgo),
    db.from("users").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    db.from("organizations").select("plan"),
    db.from("ai_usage").select("count"),
    db.from("ai_usage").select("count").eq("month", currentMonth),
    db.from("alert_firings").select("id", { count: "exact", head: true }).gte("fired_at", todayStart),
    db.from("alert_firings").select("id", { count: "exact", head: true }).gte("fired_at", weekAgo),
    db.from("n8n_instances").select("id", { count: "exact", head: true }).eq("is_active", true),
    db.from("incidents").select("id", { count: "exact", head: true }).eq("status", "open"),
    db.from("signups").select("id", { count: "exact", head: true }),
  ]);

  const plans = planBreakdownRes.data ?? [];
  const planBreakdown = {
    free: plans.filter((o) => o.plan === "free").length,
    pro: plans.filter((o) => o.plan === "pro").length,
    team: plans.filter((o) => o.plan === "team").length,
  };
  const mrr = planBreakdown.pro * 29 + planBreakdown.team * 79;

  const aiTotalCount = (aiTotalRes.data ?? []).reduce((sum, r) => sum + (r.count ?? 0), 0);
  const aiThisMonthCount = (aiThisMonthRes.data ?? []).reduce((sum, r) => sum + (r.count ?? 0), 0);

  // ai calls today: approximate as this month count / days elapsed
  const daysElapsed = now.getDate();
  const aiCallsToday = daysElapsed > 0 ? Math.round(aiThisMonthCount / daysElapsed) : 0;

  // ai calls this week: approximate as this month count / (days elapsed / 7)
  const weeksElapsed = daysElapsed / 7;
  const aiCallsThisWeek = weeksElapsed > 0 ? Math.round(aiThisMonthCount / weeksElapsed) : aiThisMonthCount;

  return NextResponse.json({
    totalUsers: totalUsersRes.count ?? 0,
    totalOrgs: totalOrgsRes.count ?? 0,
    orgsThisWeek: orgsThisWeekRes.count ?? 0,
    orgsThisMonth: orgsThisMonthRes.count ?? 0,
    usersThisWeek: usersThisWeekRes.count ?? 0,
    planBreakdown,
    mrr,
    aiCallsToday,
    aiCallsThisWeek,
    aiCallsTotal: aiTotalCount,
    alertsToday: alertsTodayRes.count ?? 0,
    alertsThisWeek: alertsThisWeekRes.count ?? 0,
    activeInstances: activeInstancesRes.count ?? 0,
    openIncidents: openIncidentsRes.count ?? 0,
    landingSignups: landingSignupsRes.count ?? 0,
  });
}
