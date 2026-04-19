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
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: orgs } = await db
    .from("organizations")
    .select("id, name, slug, plan, plan_status, created_at, current_period_end, stripe_subscription_id")
    .order("created_at", { ascending: false });

  if (!orgs || orgs.length === 0) {
    return NextResponse.json({ orgs: [] });
  }

  const orgIds = orgs.map((o) => o.id);

  const [membersRes, instancesRes, aiRes, alertsRes] = await Promise.all([
    db
      .from("organization_members")
      .select("org_id", { count: "exact" })
      .in("org_id", orgIds),
    db
      .from("n8n_instances")
      .select("org_id", { count: "exact" })
      .in("org_id", orgIds),
    db
      .from("ai_usage")
      .select("org_id, count")
      .in("org_id", orgIds)
      .eq("month", currentMonth),
    db
      .from("alerts")
      .select("org_id", { count: "exact" })
      .in("org_id", orgIds)
      .eq("is_active", true),
  ]);

  // Build lookup maps by counting per org_id
  const memberCountMap: Record<string, number> = {};
  for (const row of membersRes.data ?? []) {
    memberCountMap[row.org_id] = (memberCountMap[row.org_id] ?? 0) + 1;
  }

  const instanceCountMap: Record<string, number> = {};
  for (const row of instancesRes.data ?? []) {
    instanceCountMap[row.org_id] = (instanceCountMap[row.org_id] ?? 0) + 1;
  }

  const aiMap: Record<string, number> = {};
  for (const row of aiRes.data ?? []) {
    aiMap[row.org_id] = (aiMap[row.org_id] ?? 0) + (row.count ?? 0);
  }

  const alertCountMap: Record<string, number> = {};
  for (const row of alertsRes.data ?? []) {
    alertCountMap[row.org_id] = (alertCountMap[row.org_id] ?? 0) + 1;
  }

  const result = orgs.map((org) => ({
    ...org,
    member_count: memberCountMap[org.id] ?? 0,
    instance_count: instanceCountMap[org.id] ?? 0,
    ai_this_month: aiMap[org.id] ?? 0,
    alert_count: alertCountMap[org.id] ?? 0,
  }));

  return NextResponse.json({ orgs: result });
}
