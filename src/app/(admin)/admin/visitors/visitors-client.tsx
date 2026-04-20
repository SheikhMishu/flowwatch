"use client";

import React, { useState, useMemo } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Monitor, Smartphone, Tablet, Bot, Globe, Search, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Visit } from "./page";

interface Props {
  totalVisits: number;
  visitsToday: number;
  visitsThisWeek: number;
  uniqueIpsTotal: number;
  recentVisits: Visit[];
  topPages: Array<{ page: string; count: number }>;
  topCountries: Array<{ name: string; code: string; count: number }>;
  deviceCounts: Record<string, number>;
  topReferrers: Array<{ referrer: string; count: number }>;
  topBrowsers: Array<{ browser: string; count: number }>;
  dailyVisits: Array<{ date: string; count: number }>;
  myIp: string;
  excludedIps: string[];
}

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
    <div className="flex items-center gap-2 group">
      <span className="text-xs text-gray-400 w-28 truncate shrink-0 font-mono" title={label}>
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right shrink-0">{count}</span>
    </div>
  );
}

export function VisitorsClient({
  totalVisits,
  visitsToday,
  visitsThisWeek,
  uniqueIpsTotal,
  recentVisits,
  topPages,
  topCountries,
  deviceCounts,
  topReferrers,
  topBrowsers,
  dailyVisits,
  myIp,
  excludedIps,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return recentVisits;
    return recentVisits.filter(
      (v) =>
        v.page.toLowerCase().includes(q) ||
        (v.ip ?? "").includes(q) ||
        (v.country ?? "").toLowerCase().includes(q) ||
        (v.browser ?? "").toLowerCase().includes(q) ||
        (v.os ?? "").toLowerCase().includes(q) ||
        (v.referrer ?? "").toLowerCase().includes(q)
    );
  }, [recentVisits, search]);

  const totalDevice = Object.values(deviceCounts).reduce((s, n) => s + n, 0);
  const maxPage = topPages[0]?.count ?? 1;
  const maxCountry = topCountries[0]?.count ?? 1;
  const maxReferrer = topReferrers[0]?.count ?? 1;
  const maxBrowser = topBrowsers[0]?.count ?? 1;

  return (
    <div className="min-h-full bg-gray-950 text-gray-100 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-100">Visitor Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Real-time page visit tracking across all FlowMonix pages</p>
      </div>

      {/* IP info banner */}
      <div className="flex flex-wrap items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Your current IP:</span>
          <code className="font-mono text-amber-400 bg-gray-800 px-1.5 py-0.5 rounded">{myIp}</code>
          {excludedIps.includes(myIp) ? (
            <span className="flex items-center gap-1 text-green-500">
              <WifiOff className="w-3 h-3" />
              excluded
            </span>
          ) : (
            <span className="text-gray-600">not excluded</span>
          )}
        </div>
        <div className="h-3 w-px bg-gray-800 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-gray-500">TRACKING_EXCLUDED_IPS:</span>
          {excludedIps.length > 0 ? (
            <span className="font-mono text-gray-400">{excludedIps.join(", ")}</span>
          ) : (
            <span className="text-gray-700 italic">not set</span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Visits", value: totalVisits.toLocaleString(), sub: "all time", color: "text-indigo-400" },
          { label: "Today", value: visitsToday.toLocaleString(), sub: "page views", color: "text-green-400" },
          { label: "This Week", value: visitsThisWeek.toLocaleString(), sub: "page views", color: "text-blue-400" },
          { label: "Unique IPs", value: uniqueIpsTotal.toLocaleString(), sub: "in last 200 visits", color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{s.label}</p>
            <p className={cn("text-3xl font-bold font-mono mt-1", s.color)}>{s.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-200 mb-4">Daily Visits — Last 30 Days</p>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={dailyVisits} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={(d) => format(new Date(d + "T00:00:00"), "MM/dd")}
              tick={{ fontSize: 10, fill: "#6b7280" }}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(d) => format(new Date(d + "T00:00:00"), "MMM d, yyyy")}
              itemStyle={{ color: "#a5b4fc" }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#visitGrad)"
              dot={false}
              name="Visits"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Top pages */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Top Pages</p>
          {topPages.length === 0 && <p className="text-xs text-gray-600">No data yet</p>}
          {topPages.map((p) => (
            <BarRow key={p.page} label={p.page} count={p.count} max={maxPage} color="#6366f1" />
          ))}
        </div>

        {/* Top countries */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Top Countries</p>
          {topCountries.length === 0 && <p className="text-xs text-gray-600">No data yet</p>}
          {topCountries.map((c) => (
            <div key={c.code} className="flex items-center gap-2">
              <span className="text-base leading-none">{countryFlag(c.code)}</span>
              <span className="text-xs text-gray-400 flex-1 truncate">{c.name}</span>
              <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${(c.count / maxCountry) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-6 text-right">{c.count}</span>
            </div>
          ))}
        </div>

        {/* Device breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Devices</p>
          {(["desktop", "mobile", "tablet", "bot"] as const).map((d) => {
            const count = deviceCounts[d] ?? 0;
            const pct = totalDevice > 0 ? Math.round((count / totalDevice) * 100) : 0;
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
          {topBrowsers.map((b) => (
            <BarRow key={b.browser} label={b.browser} count={b.count} max={maxBrowser} color="#a855f7" />
          ))}
        </div>
      </div>

      {/* Referrers */}
      {topReferrers.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            <Globe className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Top Referrers
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {topReferrers.map((r) => (
              <BarRow key={r.referrer} label={r.referrer} count={r.count} max={maxReferrer} color="#22c55e" />
            ))}
          </div>
        </div>
      )}

      {/* Visit log table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 gap-3">
          <p className="text-sm font-semibold text-gray-200 shrink-0">
            Visit Log
            <span className="ml-2 text-xs text-gray-500 font-normal">
              {search ? `${filtered.length} of ` : ""}{recentVisits.length} visits
            </span>
          </p>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by IP, page, country…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="text-left px-4 py-2.5 font-medium">Time</th>
                <th className="text-left px-4 py-2.5 font-medium">Page</th>
                <th className="text-left px-4 py-2.5 font-medium">IP</th>
                <th className="text-left px-4 py-2.5 font-medium">Location</th>
                <th className="text-left px-4 py-2.5 font-medium">Device</th>
                <th className="text-left px-4 py-2.5 font-medium">Browser</th>
                <th className="text-left px-4 py-2.5 font-medium">OS</th>
                <th className="text-left px-4 py-2.5 font-medium">Referrer</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-600">
                    No visits yet
                  </td>
                </tr>
              )}
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap font-mono">
                    <span title={v.created_at}>
                      {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-indigo-400 font-mono">{v.page}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-400 whitespace-nowrap">
                    {v.ip ?? "—"}
                  </td>
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
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{v.os ?? "—"}</td>
                  <td className="px-4 py-2.5 max-w-[180px]">
                    {v.referrer ? (
                      <span className="text-gray-600 truncate block" title={v.referrer}>
                        {(() => {
                          try {
                            return new URL(v.referrer).hostname.replace("www.", "");
                          } catch {
                            return v.referrer;
                          }
                        })()}
                      </span>
                    ) : (
                      <span className="text-gray-700">direct</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
