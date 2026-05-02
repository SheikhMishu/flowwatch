import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { UsageClient } from "./usage-client";

export const dynamic = "force-dynamic";

export type DayBucket = { date: string; count: number };
export type MonthBucket = { month: string; count: number };

export type UsagePageProps = {
  alertsByDay: DayBucket[];
  executionsByDay: DayBucket[];
  signupsByDay: DayBucket[];
  aiMonthlyData: MonthBucket[];
  totalAlerts: number;
  totalExecutions: number;
  totalSignups: number;
  totalAi: number;
};

function groupByDay(
  items: Array<Record<string, unknown>>,
  dateField: string
): DayBucket[] {
  const counts: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    counts[d.toISOString().split("T")[0]] = 0;
  }
  for (const item of items) {
    const day = (item[dateField] as string)?.split("T")[0];
    if (day && day in counts) counts[day]++;
  }
  return Object.entries(counts).map(([date, count]) => ({ date, count }));
}

export default async function AdminUsagePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getServerDb();

  const { data: adminUser } = await db
    .from("users")
    .select("is_super_admin")
    .eq("id", session.userId)
    .single();
  if (!adminUser?.is_super_admin) redirect("/dashboard");

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    { data: alertFirings },
    { data: executions },
    { data: signups },
    { data: aiUsage },
  ] = await Promise.all([
    db.from("alert_firings").select("fired_at").gte("fired_at", thirtyDaysAgo).limit(10000),
    db
      .from("synced_executions")
      .select("started_at, status")
      .gte("started_at", thirtyDaysAgo)
      .limit(10000),
    db.from("signups").select("created_at").gte("created_at", thirtyDaysAgo).limit(10000),
    db.from("ai_usage").select("org_id, month, count").limit(10000),
  ]);

  const alertsByDay = groupByDay(
    (alertFirings ?? []) as Array<Record<string, unknown>>,
    "fired_at"
  );
  const executionsByDay = groupByDay(
    (executions ?? []) as Array<Record<string, unknown>>,
    "started_at"
  );
  const signupsByDay = groupByDay(
    (signups ?? []) as Array<Record<string, unknown>>,
    "created_at"
  );

  const aiByMonth = (aiUsage ?? []).reduce(
    (acc, row) => {
      const month = row.month as string;
      acc[month] = (acc[month] ?? 0) + (row.count as number);
      return acc;
    },
    {} as Record<string, number>
  );
  const aiMonthlyData: MonthBucket[] = Object.entries(aiByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({ month: month.slice(0, 7), count }));

  const totalAlerts = alertsByDay.reduce((s, d) => s + d.count, 0);
  const totalExecutions = executionsByDay.reduce((s, d) => s + d.count, 0);
  const totalSignups = signupsByDay.reduce((s, d) => s + d.count, 0);
  const totalAi = (aiUsage ?? []).reduce(
    (s, r) => s + (r.count as number),
    0
  );

  return (
    <UsageClient
      alertsByDay={alertsByDay}
      executionsByDay={executionsByDay}
      signupsByDay={signupsByDay}
      aiMonthlyData={aiMonthlyData}
      totalAlerts={totalAlerts}
      totalExecutions={totalExecutions}
      totalSignups={totalSignups}
      totalAi={totalAi}
    />
  );
}
