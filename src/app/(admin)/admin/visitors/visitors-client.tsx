"use client";

import React, { useState, useMemo } from "react";
import { distanceMelb, fmtMelb } from "@/lib/dates";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Monitor, Smartphone, Tablet, Bot, Globe, Search, WifiOff, User,
  TrendingUp, LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Visit } from "./page";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LandingStats {
  total: number;
  today: number;
  week: number;
  anonymous: number;
  authed: number;
  todayUnique: number;
  weekUnique: number;
}

interface AppStats {
  total: number;
  today: number;
  week: number;
  uniqueUsers: number;
  todayUnique: number;
  weekUnique: number;
}

interface Props {
  landingStats: LandingStats;
  appStats: AppStats;
  recentVisits: Visit[];
  landingPages: Array<{ page: string; count: number }>;
  appPages: Array<{ page: string; count: number }>;
  landingCountries: Array<{ name: string; code: string; count: number }>;
  landingDeviceCounts: Record<string, number>;
  landingReferrers: Array<{ referrer: string; count: number }>;
  landingBrowsers: Array<{ browser: string; count: number }>;
  landingDaily: Array<{ date: string; count: number }>;
  appDaily: Array<{ date: string; count: number }>;
  demoSessions: number;
  myIp: string;
  excludedIps: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DeviceIcon({ device }: { device: string | null }) {
  const d = device ?? "desktop";
  if (d === "mobile") return <Smartphone className="w-3.5 h-3.5 text-blue-400" />;
  if (d === "tablet") return <Tablet className="w-3.5 h-3.5 text-purple-400" />;
  if (d === "bot") return <Bot className="w-3.5 h-3.5 text-gray-500" />;
  return <Monitor className="w-3.5 h-3.5 text-gray-400" />;
}

function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0))
  );
}

function BarRow({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-28 truncate shrink-0 font-mono" title={label}>{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right shrink-0">{count}</span>
    </div>
  );
}

// Normalize dashboard page paths to readable feature names
function pageLabel(page: string): string {
  const map: Record<string, string> = {
    "/dashboard": "Overview",
    "/dashboard/workflows": "Workflows",
    "/dashboard/executions": "Executions",
    "/dashboard/incidents": "Incidents",
    "/dashboard/logs": "Logs",
    "/dashboard/analytics": "Analytics",
    "/dashboard/alerts": "Alerts",
    "/dashboard/instances": "Instances",
    "/dashboard/billing": "Billing",
    "/dashboard/settings": "Settings",
    "/dashboard/help": "Help",
    "/login": "Login",
  };
  return map[page] ?? page;
}

// ─── Chart ────────────────────────────────────────────────────────────────────

const RANGES = [7, 14, 30] as const;
type Range = typeof RANGES[number];

function DailyChart({
  data,
  color,
  gradientId,
  label,
}: {
  data: Array<{ date: string; count: number }>;
  color: string;
  gradientId: string;
  label: string;
}) {
  const [range, setRange] = useState<Range>(7);
  const sliced = data.slice(-range);
  const total = sliced.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-200">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{total.toLocaleString()} visits in last {range} days</p>
        </div>
        <div className="flex items-center rounded-lg border border-gray-700 bg-gray-800 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-md font-medium transition-colors",
                range === r ? "bg-gray-700 text-gray-100" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={sliced} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(d) => fmtMelb(d + "T00:00:00", "MM/dd")}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            interval="preserveStartEnd"
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
            labelFormatter={(d) => fmtMelb(d + "T00:00:00", "MMM d, yyyy")}
            itemStyle={{ color }}
          />
          <Area type="monotone" dataKey="count" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} name="Visits" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Visit log table ──────────────────────────────────────────────────────────

function VisitTable({
  visits,
  source,
}: {
  visits: Visit[];
  source: "landing" | "app";
}) {
  const [search, setSearch] = useState("");
  const [authFilter, setAuthFilter] = useState<"all" | "anon" | "authed">("all");

  const filtered = useMemo(() => {
    let list = visits.filter((v) => !v.source || v.source === source);
    if (authFilter === "anon")   list = list.filter((v) => !v.user_id);
    if (authFilter === "authed") list = list.filter((v) => !!v.user_id);
    const q = search.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (v) =>
        v.page.toLowerCase().includes(q) ||
        (v.ip ?? "").includes(q) ||
        (v.country ?? "").toLowerCase().includes(q) ||
        (v.user_email ?? "").toLowerCase().includes(q) ||
        (v.user_name ?? "").toLowerCase().includes(q) ||
        (v.org_name ?? "").toLowerCase().includes(q) ||
        (v.referrer ?? "").toLowerCase().includes(q)
    );
  }, [visits, source, search, authFilter]);

  const total = visits.filter((v) => !v.source || v.source === source).length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-gray-800 gap-3">
        <p className="text-sm font-semibold text-gray-200 shrink-0">
          Recent Visits
          <span className="ml-2 text-xs text-gray-500 font-normal">
            {(search || authFilter !== "all") ? `${filtered.length} of ` : ""}{total}
          </span>
        </p>
        <div className="flex items-center gap-2">
          {source === "landing" && (
            <div className="flex items-center rounded-lg border border-gray-700 bg-gray-800 p-0.5 shrink-0">
              {(["all", "anon", "authed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setAuthFilter(f)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md font-medium transition-colors",
                    authFilter === f ? "bg-gray-700 text-gray-100" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  {f === "all" ? "All" : f === "anon" ? "Prospects" : "Logged-in"}
                </button>
              ))}
            </div>
          )}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={source === "app" ? "Filter by user, page, org…" : "Filter by IP, page, country…"}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500">
              <th className="text-left px-4 py-2.5 font-medium">Time</th>
              <th className="text-left px-4 py-2.5 font-medium">Page</th>
              {source === "app" && <th className="text-left px-4 py-2.5 font-medium">User</th>}
              <th className="text-left px-4 py-2.5 font-medium">IP</th>
              <th className="text-left px-4 py-2.5 font-medium">Location</th>
              <th className="text-left px-4 py-2.5 font-medium">Device</th>
              <th className="text-left px-4 py-2.5 font-medium">Browser</th>
              {source === "landing" && <th className="text-left px-4 py-2.5 font-medium">Referrer</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-600">No visits</td>
              </tr>
            )}
            {filtered.map((v) => (
              <tr key={v.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap font-mono">
                  <span title={v.created_at}>{distanceMelb(v.created_at)}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn("font-mono", source === "app" ? "text-emerald-400" : "text-indigo-400")}>
                    {source === "app" ? pageLabel(v.page) : v.page}
                  </span>
                </td>
                {source === "app" && (
                  <td className="px-4 py-2.5 max-w-[180px]">
                    {v.user_id ? (
                      <div className="flex items-start gap-1.5">
                        <User className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          {v.user_name && (
                            <p className="text-emerald-400 font-medium truncate leading-tight">{v.user_name}</p>
                          )}
                          <p className="text-gray-500 truncate leading-tight">{v.user_email ?? "—"}</p>
                          {v.org_name && (
                            <p className="text-gray-600 truncate text-[10px] leading-tight">{v.org_name}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-700">anon</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-2.5 font-mono text-gray-400 whitespace-nowrap">{v.ip ?? "—"}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {v.country ? (
                    <span className="flex items-center gap-1.5">
                      <span>{countryFlag(v.country_code)}</span>
                      <span className="text-gray-400">{v.city ? `${v.city}, ` : ""}{v.country}</span>
                    </span>
                  ) : (
                    <span className="text-gray-700">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-1">
                    <DeviceIcon device={v.device} />
                    <span className="text-gray-500 capitalize">{v.device ?? "—"}</span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{v.browser ?? "—"}</td>
                {source === "landing" && (
                  <td className="px-4 py-2.5 max-w-[180px]">
                    {v.referrer ? (
                      <span className="text-gray-600 truncate block" title={v.referrer}>
                        {(() => { try { return new URL(v.referrer).hostname.replace("www.", ""); } catch { return v.referrer; } })()}
                      </span>
                    ) : (
                      <span className="text-gray-700">direct</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VisitorsClient({
  landingStats,
  appStats,
  recentVisits,
  landingPages,
  appPages,
  landingCountries,
  landingDeviceCounts,
  landingReferrers,
  landingBrowsers,
  landingDaily,
  appDaily,
  demoSessions,
  myIp,
  excludedIps,
}: Props) {
  const [tab, setTab] = useState<"landing" | "app">("landing");

  const totalLandingDevices = Object.values(landingDeviceCounts).reduce((s, n) => s + n, 0);
  const maxLandingPage   = landingPages[0]?.count  ?? 1;
  const maxAppPage       = appPages[0]?.count      ?? 1;
  const maxCountry       = landingCountries[0]?.count ?? 1;
  const maxReferrer      = landingReferrers[0]?.count ?? 1;
  const maxBrowser       = landingBrowsers[0]?.count  ?? 1;

  return (
    <div className="min-h-full bg-gray-950 text-gray-100 p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-100">Visitor Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {landingStats.total.toLocaleString()} landing · {appStats.total.toLocaleString()} app visits tracked all time
        </p>
      </div>

      {/* IP info banner */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Your IP:</span>
          <code className="font-mono text-amber-400 bg-gray-800 px-1.5 py-0.5 rounded">{myIp}</code>
          {excludedIps.includes(myIp) ? (
            <span className="flex items-center gap-1 text-green-500"><WifiOff className="w-3 h-3" />excluded</span>
          ) : (
            <span className="text-gray-600">not excluded</span>
          )}
        </div>
        {excludedIps.length > 0 && (
          <>
            <div className="h-3 w-px bg-gray-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Excluded IPs:</span>
              <span className="font-mono text-gray-400">{excludedIps.join(", ")}</span>
            </div>
          </>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-3">
        <button
          onClick={() => setTab("landing")}
          className={cn(
            "flex items-center gap-3 rounded-xl border px-5 py-3.5 text-left transition-all",
            tab === "landing"
              ? "border-indigo-500/40 bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
              : "border-gray-800 bg-gray-900 hover:border-gray-700"
          )}
        >
          <TrendingUp className={cn("w-5 h-5 shrink-0", tab === "landing" ? "text-indigo-400" : "text-gray-600")} />
          <div>
            <p className={cn("text-sm font-semibold", tab === "landing" ? "text-indigo-300" : "text-gray-400")}>
              Landing
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {landingStats.total.toLocaleString()} total · {landingStats.anonymous.toLocaleString()} prospects
            </p>
          </div>
        </button>

        <button
          onClick={() => setTab("app")}
          className={cn(
            "flex items-center gap-3 rounded-xl border px-5 py-3.5 text-left transition-all",
            tab === "app"
              ? "border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
              : "border-gray-800 bg-gray-900 hover:border-gray-700"
          )}
        >
          <LayoutDashboard className={cn("w-5 h-5 shrink-0", tab === "app" ? "text-emerald-400" : "text-gray-600")} />
          <div>
            <p className={cn("text-sm font-semibold", tab === "app" ? "text-emerald-300" : "text-gray-400")}>
              App
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {appStats.total.toLocaleString()} total · {appStats.uniqueUsers.toLocaleString()} users (30d)
            </p>
          </div>
        </button>
      </div>

      {/* ── Landing tab ── */}
      {tab === "landing" && (
        <div className="space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Total Visits",   value: landingStats.total.toLocaleString(),     sub: "all time",                                                              color: "text-indigo-400" },
              { label: "Today",          value: landingStats.today.toLocaleString(),     sub: `${landingStats.todayUnique.toLocaleString()} unique IPs`,               color: "text-green-400"  },
              { label: "This Week",      value: landingStats.week.toLocaleString(),      sub: `${landingStats.weekUnique.toLocaleString()} unique IPs`,                color: "text-blue-400"   },
              { label: "Prospects",      value: landingStats.anonymous.toLocaleString(), sub: "anonymous visitors",                                                    color: "text-amber-400"  },
              { label: "Demo Sessions",  value: demoSessions.toLocaleString(),           sub: "all time",                                                              color: "text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{s.label}</p>
                <p className={cn("text-3xl font-bold font-mono mt-1", s.color)}>{s.value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Logged-in noise note */}
          {landingStats.authed > 0 && (
            <p className="text-xs text-gray-600 -mt-2">
              + {landingStats.authed.toLocaleString()} visits from signed-in users (existing customers browsing landing)
            </p>
          )}

          {/* Daily chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <DailyChart data={landingDaily} color="#6366f1" gradientId="landingGrad" label="Daily Landing Visits" />
          </div>

          {/* Breakdown grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* Top pages */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Top Pages</p>
              {landingPages.length === 0 && <p className="text-xs text-gray-600">No data yet</p>}
              {landingPages.map((p) => (
                <BarRow key={p.page} label={p.page} count={p.count} max={maxLandingPage} color="#6366f1" />
              ))}
            </div>

            {/* Countries */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Countries</p>
              {landingCountries.length === 0 && <p className="text-xs text-gray-600">No data yet</p>}
              {landingCountries.map((c) => (
                <div key={c.code} className="flex items-center gap-2">
                  <span className="text-base leading-none">{countryFlag(c.code)}</span>
                  <span className="text-xs text-gray-400 flex-1 truncate">{c.name}</span>
                  <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${(c.count / maxCountry) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right">{c.count}</span>
                </div>
              ))}
            </div>

            {/* Devices */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Devices</p>
              {(["desktop", "mobile", "tablet", "bot"] as const).map((d) => {
                const count = landingDeviceCounts[d] ?? 0;
                const pct = totalLandingDevices > 0 ? Math.round((count / totalLandingDevices) * 100) : 0;
                return (
                  <div key={d} className="flex items-center gap-3">
                    <DeviceIcon device={d} />
                    <span className="text-xs text-gray-400 capitalize flex-1">{d}</span>
                    <span className="text-xs text-gray-500 font-mono">{pct}%</span>
                    <span className="text-xs text-gray-600 font-mono w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Browsers */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Browsers</p>
              {landingBrowsers.map((b) => (
                <BarRow key={b.browser} label={b.browser} count={b.count} max={maxBrowser} color="#a855f7" />
              ))}
            </div>
          </div>

          {/* Referrers */}
          {landingReferrers.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Traffic Sources (Referrers)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {landingReferrers.map((r) => (
                  <BarRow key={r.referrer} label={r.referrer} count={r.count} max={maxReferrer} color="#22c55e" />
                ))}
              </div>
            </div>
          )}

          {/* Visit log */}
          <VisitTable visits={recentVisits} source="landing" />
        </div>
      )}

      {/* ── App tab ── */}
      {tab === "app" && (
        <div className="space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Visits",   value: appStats.total.toLocaleString(),       sub: "all time",                                                         color: "text-emerald-400" },
              { label: "Today",          value: appStats.today.toLocaleString(),       sub: `${appStats.todayUnique.toLocaleString()} unique IPs`,               color: "text-green-400"   },
              { label: "This Week",      value: appStats.week.toLocaleString(),        sub: `${appStats.weekUnique.toLocaleString()} unique IPs`,                color: "text-blue-400"    },
              { label: "Active Users",   value: appStats.uniqueUsers.toLocaleString(), sub: "unique users, 30d",                                                  color: "text-amber-400"   },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{s.label}</p>
                <p className={cn("text-3xl font-bold font-mono mt-1", s.color)}>{s.value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Chart + Feature usage side by side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <DailyChart data={appDaily} color="#10b981" gradientId="appGrad" label="Daily App Visits" />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Feature Usage (30d)</p>
              {appPages.length === 0 && <p className="text-xs text-gray-600">No data yet</p>}
              {appPages.map((p) => (
                <BarRow key={p.page} label={pageLabel(p.page)} count={p.count} max={maxAppPage} color="#10b981" />
              ))}
            </div>
          </div>

          {/* Visit log */}
          <VisitTable visits={recentVisits} source="app" />
        </div>
      )}

    </div>
  );
}
