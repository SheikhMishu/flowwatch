import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

type DayCount = { date: string; count: number };

function groupByDay(rows: Array<{ ts: string }>): DayCount[] {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const day = row.ts.slice(0, 10);
    map[day] = (map[day] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getServerDb();
  const { data: adminUser } = await db.from("users").select("is_super_admin").eq("id", session.userId).single();
  if (!adminUser?.is_super_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [alertFiringsRes, executionsRes, signupsRes, aiUsageRes] = await Promise.all([
    db
      .from("alert_firings")
      .select("fired_at")
      .gte("fired_at", thirtyDaysAgo),
    db
      .from("synced_executions")
      .select("started_at")
      .gte("started_at", thirtyDaysAgo),
    db
      .from("signups")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo),
    // ai_usage is monthly — spread count evenly across days of that month
    db
      .from("ai_usage")
      .select("org_id, month, count"),
  ]);

  const alertsByDay = groupByDay(
    (alertFiringsRes.data ?? []).map((r) => ({ ts: r.fired_at }))
  );

  const executionsByDay = groupByDay(
    (executionsRes.data ?? []).map((r) => ({ ts: r.started_at }))
  );

  const signupsByDay = groupByDay(
    (signupsRes.data ?? []).map((r) => ({ ts: r.created_at }))
  );

  // For ai_usage: distribute monthly counts across days in that month, within last 30 days
  const aiDayMap: Record<string, number> = {};
  for (const row of aiUsageRes.data ?? []) {
    const monthDate = new Date(row.month);
    const year = monthDate.getUTCFullYear();
    const month = monthDate.getUTCMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const perDay = (row.count ?? 0) / daysInMonth;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (day >= thirtyDaysAgo.slice(0, 10)) {
        aiDayMap[day] = (aiDayMap[day] ?? 0) + perDay;
      }
    }
  }

  const aiByDay: DayCount[] = Object.entries(aiDayMap)
    .map(([date, count]) => ({ date, count: Math.round(count) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    aiByDay,
    alertsByDay,
    executionsByDay,
    signupsByDay,
  });
}
