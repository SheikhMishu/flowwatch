import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { DemoClient } from "./demo-client";

export const dynamic = "force-dynamic";

export default async function AdminDemoPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getServerDb();
  const { data: adminUser } = await db
    .from("users")
    .select("is_super_admin")
    .eq("id", session.userId)
    .single();
  if (!adminUser?.is_super_admin) redirect("/dashboard");

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalSessions },
    { count: sessions7d },
    { count: sessions30d },
    { data: recentSessions },
    { data: pageVisits30d },
    { data: dailyRaw },
  ] = await Promise.all([
    db.from("demo_sessions").select("id", { count: "exact", head: true }),
    db.from("demo_sessions").select("id", { count: "exact", head: true }).gte("started_at", sevenDaysAgo),
    db.from("demo_sessions").select("id", { count: "exact", head: true }).gte("started_at", thirtyDaysAgo),
    db
      .from("demo_sessions")
      .select("id, session_token, started_at, last_active_at, page_count, ip")
      .order("started_at", { ascending: false })
      .limit(100),
    db
      .from("demo_page_visits")
      .select("page")
      .gte("visited_at", thirtyDaysAgo)
      .limit(10000),
    db
      .from("demo_sessions")
      .select("started_at, last_active_at, page_count")
      .gte("started_at", thirtyDaysAgo)
      .order("started_at", { ascending: false })
      .limit(10000),
  ]);

  // Top pages
  const pageCounts: Record<string, number> = {};
  for (const r of pageVisits30d ?? []) {
    pageCounts[r.page] = (pageCounts[r.page] ?? 0) + 1;
  }
  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([page, count]) => ({ page, count }));

  // Daily session buckets (last 30 days)
  const fmtDay = (ts: string | Date) => {
    const d = new Date(ts instanceof Date ? ts : ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const dailyBuckets: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    dailyBuckets[fmtDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000))] = 0;
  }
  for (const r of dailyRaw ?? []) {
    const day = fmtDay(r.started_at);
    if (day in dailyBuckets) dailyBuckets[day]++;
  }
  const dailySessions = Object.entries(dailyBuckets).map(([date, count]) => ({ date, count }));

  // Avg duration (seconds) and avg pages — only sessions with activity
  const activeSessions = (dailyRaw ?? []).filter((s) => s.page_count > 0);
  const avgDurationSec =
    activeSessions.length > 0
      ? Math.round(
          activeSessions.reduce((sum, s) => {
            const dur = new Date(s.last_active_at).getTime() - new Date(s.started_at).getTime();
            return sum + dur / 1000;
          }, 0) / activeSessions.length
        )
      : 0;
  const avgPages =
    activeSessions.length > 0
      ? Math.round(
          (activeSessions.reduce((sum, s) => sum + (s.page_count ?? 0), 0) / activeSessions.length) * 10
        ) / 10
      : 0;

  return (
    <DemoClient
      totalSessions={totalSessions ?? 0}
      sessions7d={sessions7d ?? 0}
      sessions30d={sessions30d ?? 0}
      avgDurationSec={avgDurationSec}
      avgPages={avgPages}
      recentSessions={(recentSessions ?? []) as DemoSession[]}
      topPages={topPages}
      dailySessions={dailySessions}
    />
  );
}

export interface DemoSession {
  id: string;
  session_token: string;
  started_at: string;
  last_active_at: string;
  page_count: number;
  ip: string | null;
}
