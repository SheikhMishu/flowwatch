import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { TZDate } from "@date-fns/tz";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { VisitorsClient } from "./visitors-client";

export const dynamic = "force-dynamic";

export default async function AdminVisitorsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const reqHeaders = await headers();
  const myIp =
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    reqHeaders.get("x-real-ip") ??
    reqHeaders.get("cf-connecting-ip") ??
    "unknown";

  const excludedIps = (process.env.TRACKING_EXCLUDED_IPS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const db = getServerDb();
  const { data: adminUser } = await db
    .from("users")
    .select("is_super_admin")
    .eq("id", session.userId)
    .single();
  if (!adminUser?.is_super_admin) redirect("/dashboard");

  const now = new Date();
  const MELB = "Australia/Melbourne";
  const nowMelb = new TZDate(now, MELB);
  const todayStart = new TZDate(nowMelb.getFullYear(), nowMelb.getMonth(), nowMelb.getDate(), 0, 0, 0, 0, MELB).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Helper: applies excluded-IP filter to any query when list is non-empty
  const ipFilter = excludedIps.length > 0
    ? `(${excludedIps.join(",")})`
    : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function withIpFilter<T extends { not: (...args: any[]) => T }>(q: T): T {
    return ipFilter ? q.not("ip", "in", ipFilter) : q;
  }

  const [
    { count: totalVisits },
    { count: visitsToday },
    { count: visitsThisWeek },
    { data: recentVisits },
    { data: topPages },
    { data: topCountries },
    { data: deviceBreakdown },
    { data: referrerData },
    { data: browserData },
    { data: dailyData },
  ] = await Promise.all([
    // Totals
    withIpFilter(db.from("page_visits").select("id", { count: "exact", head: true })),
    withIpFilter(db.from("page_visits").select("id", { count: "exact", head: true }).gte("created_at", todayStart)),
    withIpFilter(db.from("page_visits").select("id", { count: "exact", head: true }).gte("created_at", weekAgo)),

    // Recent 200 visits for the table
    withIpFilter(
      db.from("page_visits")
        .select("id, page, ip, country, country_code, city, region, browser, os, device, referrer, created_at")
        .order("created_at", { ascending: false })
        .limit(200)
    ),

    // Top pages (last 30 days)
    withIpFilter(
      db.from("page_visits")
        .select("page")
        .gte("created_at", thirtyDaysAgo)
        .limit(10000)
    ),

    // Country breakdown (last 30 days)
    withIpFilter(
      db.from("page_visits")
        .select("country, country_code")
        .gte("created_at", thirtyDaysAgo)
        .not("country_code", "is", null)
        .limit(10000)
    ),

    // Device breakdown (last 30 days)
    withIpFilter(
      db.from("page_visits")
        .select("device")
        .gte("created_at", thirtyDaysAgo)
        .limit(10000)
    ),

    // Referrer breakdown (last 30 days)
    withIpFilter(
      db.from("page_visits")
        .select("referrer")
        .gte("created_at", thirtyDaysAgo)
        .not("referrer", "is", null)
        .limit(10000)
    ),

    // Browser breakdown (last 30 days)
    withIpFilter(
      db.from("page_visits")
        .select("browser")
        .gte("created_at", thirtyDaysAgo)
        .limit(10000)
    ),

    // Daily visits for last 30 days — descending so recent days are always captured first
    withIpFilter(
      db.from("page_visits")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(10000)
    ),
  ]);

  // Aggregate top pages
  const pageCounts: Record<string, number> = {};
  for (const r of topPages ?? []) {
    pageCounts[r.page] = (pageCounts[r.page] ?? 0) + 1;
  }
  const topPagesAgg = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([page, count]) => ({ page, count }));

  // Aggregate countries
  const countryCounts: Record<string, { name: string; code: string; count: number }> = {};
  for (const r of topCountries ?? []) {
    if (!r.country_code) continue;
    if (!countryCounts[r.country_code]) {
      countryCounts[r.country_code] = { name: r.country ?? r.country_code, code: r.country_code, count: 0 };
    }
    countryCounts[r.country_code].count++;
  }
  const topCountriesAgg = Object.values(countryCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Aggregate devices
  const deviceCounts: Record<string, number> = {};
  for (const r of deviceBreakdown ?? []) {
    const d = r.device ?? "unknown";
    deviceCounts[d] = (deviceCounts[d] ?? 0) + 1;
  }

  // Aggregate referrers
  const referrerCounts: Record<string, number> = {};
  for (const r of referrerData ?? []) {
    if (!r.referrer) continue;
    try {
      const host = new URL(r.referrer).hostname.replace("www.", "");
      referrerCounts[host] = (referrerCounts[host] ?? 0) + 1;
    } catch {
      referrerCounts[r.referrer] = (referrerCounts[r.referrer] ?? 0) + 1;
    }
  }
  const topReferrers = Object.entries(referrerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([referrer, count]) => ({ referrer, count }));

  // Aggregate browsers
  const browserCounts: Record<string, number> = {};
  for (const r of browserData ?? []) {
    const b = r.browser ?? "Unknown";
    // Normalize version out (e.g. "Chrome 124" → "Chrome")
    const bName = b.split(" ")[0];
    browserCounts[bName] = (browserCounts[bName] ?? 0) + 1;
  }
  const topBrowsers = Object.entries(browserCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([browser, count]) => ({ browser, count }));

  // Daily visit buckets
  const dailyBuckets: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dailyBuckets[d.toISOString().split("T")[0]] = 0;
  }
  for (const r of dailyData ?? []) {
    const day = r.created_at.split("T")[0];
    if (day in dailyBuckets) dailyBuckets[day]++;
  }
  const dailyVisits = Object.entries(dailyBuckets).map(([date, count]) => ({ date, count }));

  // Unique IPs
  const uniqueIpsTotal = new Set((recentVisits ?? []).map((v) => v.ip).filter(Boolean)).size;

  return (
    <VisitorsClient
      totalVisits={totalVisits ?? 0}
      visitsToday={visitsToday ?? 0}
      visitsThisWeek={visitsThisWeek ?? 0}
      uniqueIpsTotal={uniqueIpsTotal}
      recentVisits={(recentVisits ?? []) as Visit[]}
      topPages={topPagesAgg}
      topCountries={topCountriesAgg}
      deviceCounts={deviceCounts}
      topReferrers={topReferrers}
      topBrowsers={topBrowsers}
      dailyVisits={dailyVisits}
      myIp={myIp}
      excludedIps={excludedIps}
    />
  );
}

export interface Visit {
  id: string;
  page: string;
  ip: string | null;
  country: string | null;
  country_code: string | null;
  city: string | null;
  region: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  referrer: string | null;
  created_at: string;
}
