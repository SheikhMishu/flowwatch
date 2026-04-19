import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getServerDb();
  const { data: adminUser } = await db.from("users").select("is_super_admin").eq("id", session.userId).single();
  if (!adminUser?.is_super_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    orgRes,
    membersRes,
    instancesRes,
    workflowsRes,
    executionsRes,
    alertsActiveRes,
    incidentsOpenRes,
    incidentsTotalRes,
    aiThisMonthRes,
    aiTotalRes,
    alertFiringsMonthRes,
  ] = await Promise.all([
    db
      .from("organizations")
      .select("id, name, slug, plan, plan_status, created_at, current_period_end, stripe_subscription_id, stripe_customer_id")
      .eq("id", id)
      .single(),
    db
      .from("organization_members")
      .select("id, role, created_at, user:users(id, email, name)")
      .eq("org_id", id),
    db
      .from("n8n_instances")
      .select("id, name, url, is_active, created_at")
      .eq("org_id", id),
    // workflows: count distinct workflow_name from synced_executions
    db
      .from("synced_executions")
      .select("workflow_name")
      .eq("org_id", id),
    db
      .from("synced_executions")
      .select("id", { count: "exact", head: true })
      .eq("org_id", id),
    db
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("org_id", id)
      .eq("is_active", true),
    db
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", id)
      .eq("status", "open"),
    db
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", id),
    db
      .from("ai_usage")
      .select("count")
      .eq("org_id", id)
      .eq("month", currentMonth),
    db
      .from("ai_usage")
      .select("count")
      .eq("org_id", id),
    db
      .from("alert_firings")
      .select("id", { count: "exact", head: true })
      .eq("org_id", id)
      .gte("fired_at", monthStart),
  ]);

  if (!orgRes.data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const uniqueWorkflows = new Set((workflowsRes.data ?? []).map((r) => r.workflow_name)).size;
  const aiThisMonth = (aiThisMonthRes.data ?? []).reduce((s, r) => s + (r.count ?? 0), 0);
  const aiTotal = (aiTotalRes.data ?? []).reduce((s, r) => s + (r.count ?? 0), 0);

  return NextResponse.json({
    org: {
      ...orgRes.data,
      members: membersRes.data ?? [],
      instances: instancesRes.data ?? [],
      stats: {
        workflows: uniqueWorkflows,
        executions: executionsRes.count ?? 0,
        alerts_active: alertsActiveRes.count ?? 0,
        incidents_open: incidentsOpenRes.count ?? 0,
        incidents_total: incidentsTotalRes.count ?? 0,
        ai_this_month: aiThisMonth,
        ai_total: aiTotal,
        alert_firings_this_month: alertFiringsMonthRes.count ?? 0,
      },
    },
  });
}
