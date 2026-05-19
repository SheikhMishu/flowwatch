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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipFilter = excludedIps.length > 0 ? `(${excludedIps.join(",")})` : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function withIpFilter(q: any): any {
    return ipFilter ? q.not("ip", "in", ipFilter) : q;
  }

  const [
    { count: landingTotal },
    { count: landingToday },
    { count: landingWeek },
    { count: landingAnon },
    { count: appTotal },
    { count: appToday },
    { count: appWeek },
    { data: recentVisitsRaw },
    { data: landingPagesRaw },
    { data: appPagesRaw },
    { data: landingCountriesRaw },
    { data: landingDevicesRaw },
    { data: landingReferrersRaw },
    { data: landingBrowsersRaw },
    { data: landingDailyRaw },
    { data: appDailyRaw },
    { count: demoSessions },
  ] = await Promise.all([
    // Landing counts
    withIpFilter(db.from("page_visits").select("id", { count: "exact", head: true }).eq("source", "landing")),
    withIpFilter(db.from("page_visits").select("id", { count: "exact", head: true }).eq("source", "landing").gte("created_at", todayStart)),
    withIpFilter(db.from("page_visits").select("id", { count: "exact", head: true }).eq("source", "landing").gte("created_at", weekAgo)),
    withIpFilter(db.from("page_visits").select("id", { count: "exact", head: true }).eq("source", "landing").is("user_id", null)),

    // App counts
    withIpFilter(db.from("page_visits").select("id", { count: "exact", head: true }).eq("source", "app")),
    withIpFilter(db.from("page_visits").select("id", { count: "exact", head: true }).eq("source", "app").gte("created_at", todayStart)),
    withIpFilter(db.from("page_visits").select("id", { count: "exact", head: true }).eq("source", "app").gte("created_at", weekAgo)),

    // Recent 300 visits (all sources)
    withIpFilter(
      db.from("page_visits")
        .select("id, page, ip, country, country_code, city, region, browser, os, device, referrer, created_at, user_id, org_id, source")
        .order("created_at", { ascending: false })
        .limit(300)
    ),

    // Landing: top pages (aggregated in DB)
    db.rpc("admin_top_pages", { p_source: "landing", p_days: 30, p_limit: 10, p_excluded_ips: excludedIps }),

    // App: top pages (aggregated in DB)
    db.rpc("admin_top_pages", { p_source: "app", p_days: 30, p_limit: 10, p_excluded_ips: excludedIps }),

    // Landing: countries (aggregated in DB)
    db.rpc("admin_top_countries", { p_source: "landing", p_days: 30, p_limit: 10, p_excluded_ips: excludedIps }),

    // Landing: devices (aggregated in DB)
    db.rpc("admin_device_breakdown", { p_source: "landing", p_days: 30, p_excluded_ips: excludedIps }),

    // Landing: referrers (aggregated in DB, hostname extraction stays in JS)
    db.rpc("admin_top_referrers", { p_source: "landing", p_days: 30, p_limit: 50, p_excluded_ips: excludedIps }),

    // Landing: browsers (aggregated in DB, version stripped in SQL)
    db.rpc("admin_top_browsers", { p_source: "landing", p_days: 30, p_limit: 6, p_excluded_ips: excludedIps }),

    // Landing: daily aggregated in DB — no row limit problem
    db.rpc("admin_daily_visit_counts", { p_source: "landing", p_days: 30, p_excluded_ips: excludedIps }),

    // App: daily aggregated in DB — no row limit problem
    db.rpc("admin_daily_visit_counts", { p_source: "app", p_days: 30, p_excluded_ips: excludedIps }),

    // Demo sessions all time
    db.from("demo_sessions").select("id", { count: "exact", head: true }),
  ]);

  // Enrich recent visits with user email / org name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visits = (recentVisitsRaw ?? []) as any[];
  const userIds = [...new Set(visits.map((v) => v.user_id).filter(Boolean))] as string[];
  const orgIds  = [...new Set(visits.map((v) => v.org_id).filter(Boolean))]  as string[];

  const [{ data: userRows }, { data: orgRows }] = await Promise.all([
    userIds.length > 0
      ? db.from("users").select("id, email, name").in("id", userIds)
      : Promise.resolve({ data: [] }),
    orgIds.length > 0
      ? db.from("organizations").select("id, name, slug").in("id", orgIds)
      : Promise.resolve({ data: [] }),
  ]);

  const userMap = Object.fromEntries((userRows ?? []).map((u) => [u.id, u]));
  const orgMap  = Object.fromEntries((orgRows  ?? []).map((o) => [o.id, o]));

  const enrichedVisits = visits.map((v) => ({
    ...v,
    user_email: v.user_id ? (userMap[v.user_id]?.email ?? null) : null,
    user_name:  v.user_id ? (userMap[v.user_id]?.name  ?? null) : null,
    org_name:   v.org_id  ? (orgMap[v.org_id]?.name   ?? null) : null,
    org_slug:   v.org_id  ? (orgMap[v.org_id]?.slug   ?? null) : null,
  })) as Visit[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyRows = (v: any) => (v ?? []) as any[];

  // RPC results already aggregated — just cast and normalise
  const landingPages = anyRows(landingPagesRaw).map((r) => ({ page: String(r.page), count: Number(r.count) }));
  const appPages     = anyRows(appPagesRaw).map((r)     => ({ page: String(r.page), count: Number(r.count) }));

  const landingCountries = anyRows(landingCountriesRaw).map((r) => ({
    name:  String(r.country ?? r.country_code),
    code:  String(r.country_code),
    count: Number(r.count),
  }));

  const landingDeviceCounts: Record<string, number> = {};
  for (const r of anyRows(landingDevicesRaw)) {
    landingDeviceCounts[String(r.device ?? "unknown")] = Number(r.count);
  }

  // Referrers: group by hostname (DB returned top 50 raw URLs)
  const referrerHostCounts: Record<string, number> = {};
  for (const r of anyRows(landingReferrersRaw)) {
    if (!r.referrer) continue;
    try {
      const host = new URL(String(r.referrer)).hostname.replace("www.", "");
      referrerHostCounts[host] = (referrerHostCounts[host] ?? 0) + Number(r.count);
    } catch {
      referrerHostCounts[String(r.referrer)] = (referrerHostCounts[String(r.referrer)] ?? 0) + Number(r.count);
    }
  }
  const landingReferrers = Object.entries(referrerHostCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([referrer, count]) => ({ referrer, count }));

  // Browsers already stripped of version by the RPC
  const landingBrowsers = anyRows(landingBrowsersRaw).map((r) => ({ browser: String(r.browser), count: Number(r.count) }));

  // Zero-fill daily buckets so missing days appear as 0 in the chart
  const melbDate = (ts: string | number | Date) => {
    const d = new TZDate(ts instanceof Date ? ts : new Date(ts), MELB);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const emptyBuckets = () => {
    const b: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      b[melbDate(now.getTime() - i * 24 * 60 * 60 * 1000)] = 0;
    }
    return b;
  };

  const landingDailyBuckets = emptyBuckets();
  for (const r of (landingDailyRaw ?? []) as { day: string; count: number }[]) {
    if (r.day in landingDailyBuckets) landingDailyBuckets[r.day] = Number(r.count);
  }

  const appDailyBuckets = emptyBuckets();
  for (const r of (appDailyRaw ?? []) as { day: string; count: number }[]) {
    if (r.day in appDailyBuckets) appDailyBuckets[r.day] = Number(r.count);
  }

  // Unique app users — separate query since daily RPC no longer returns user_id
  const { data: appUserIdsRaw } = await withIpFilter(
    db.from("page_visits")
      .select("user_id")
      .eq("source", "app")
      .gte("created_at", thirtyDaysAgo)
      .not("user_id", "is", null)
      .limit(50000)
  );
  const appUniqueUsers = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (appUserIdsRaw ?? []).map((r: any) => r.user_id)
  ).size;

  const landingAuthed = (landingTotal ?? 0) - (landingAnon ?? 0);

  return (
    <VisitorsClient
      landingStats={{
        total: landingTotal ?? 0,
        today: landingToday ?? 0,
        week: landingWeek ?? 0,
        anonymous: landingAnon ?? 0,
        authed: landingAuthed,
      }}
      appStats={{
        total: appTotal ?? 0,
        today: appToday ?? 0,
        week: appWeek ?? 0,
        uniqueUsers: appUniqueUsers,
      }}
      recentVisits={enrichedVisits}
      landingPages={landingPages}
      appPages={appPages}
      landingCountries={landingCountries}
      landingDeviceCounts={landingDeviceCounts}
      landingReferrers={landingReferrers}
      landingBrowsers={landingBrowsers}
      landingDaily={Object.entries(landingDailyBuckets).map(([date, count]) => ({ date, count }))}
      appDaily={Object.entries(appDailyBuckets).map(([date, count]) => ({ date, count }))}
      demoSessions={demoSessions ?? 0}
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
  user_id: string | null;
  org_id: string | null;
  source: "landing" | "app" | null;
  user_email: string | null;
  user_name: string | null;
  org_name: string | null;
  org_slug: string | null;
}
