"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { FlaskConical, Clock, MousePointer, TrendingUp, Calendar } from "lucide-react";
import type { DemoSession } from "./page";

interface Props {
  totalSessions: number;
  sessions7d: number;
  sessions30d: number;
  avgDurationSec: number;
  avgPages: number;
  recentSessions: DemoSession[];
  topPages: Array<{ page: string; count: number }>;
  dailySessions: Array<{ date: string; count: number }>;
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function fmtDate(ts: string): string {
  return new Date(ts).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function sessionDuration(s: DemoSession): string {
  const ms = new Date(s.last_active_at).getTime() - new Date(s.started_at).getTime();
  return fmtDuration(Math.round(ms / 1000));
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-100 mt-1">{value}</p>
          {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
    </div>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-40 truncate shrink-0 font-mono" title={label}>
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-6 text-right shrink-0">{count}</span>
    </div>
  );
}

export function DemoClient({
  totalSessions,
  sessions7d,
  sessions30d,
  avgDurationSec,
  avgPages,
  recentSessions,
  topPages,
  dailySessions,
}: Props) {
  const maxPage = topPages[0]?.count ?? 1;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center">
          <FlaskConical className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-100">Demo Account</h1>
          <p className="text-gray-500 text-sm">Sessions and page visits from demo@flowmonix.com</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total sessions"
          value={totalSessions.toLocaleString()}
          icon={TrendingUp}
          color="bg-indigo-600/20 text-indigo-400"
        />
        <StatCard
          label="Last 7 days"
          value={sessions7d.toLocaleString()}
          icon={Calendar}
          color="bg-blue-600/20 text-blue-400"
        />
        <StatCard
          label="Last 30 days"
          value={sessions30d.toLocaleString()}
          icon={Calendar}
          color="bg-violet-600/20 text-violet-400"
        />
        <StatCard
          label="Avg duration"
          value={avgDurationSec > 0 ? fmtDuration(avgDurationSec) : "—"}
          sub="sessions with activity"
          icon={Clock}
          color="bg-emerald-600/20 text-emerald-400"
        />
        <StatCard
          label="Avg pages/session"
          value={avgPages > 0 ? avgPages : "—"}
          sub="sessions with activity"
          icon={MousePointer}
          color="bg-amber-600/20 text-amber-400"
        />
      </div>

      {/* Chart + top pages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily sessions chart */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-300 mb-4">Sessions per day — last 30 days</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dailySessions} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="demoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={(d: string) => d.slice(5)}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#9ca3af" }}
                itemStyle={{ color: "#a5b4fc" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#demoGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top pages */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-300 mb-4">Top pages — last 30 days</h2>
          {topPages.length === 0 ? (
            <p className="text-gray-600 text-sm">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {topPages.map((p) => (
                <BarRow key={p.page} label={p.page} count={p.count} max={maxPage} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Session log */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-medium text-gray-300">Recent sessions</h2>
          <p className="text-gray-600 text-xs mt-0.5">Latest 100 sessions</p>
        </div>
        {recentSessions.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-600 text-sm">No demo sessions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Started</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Pages</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 text-gray-300 font-mono text-xs whitespace-nowrap">
                      {fmtDate(s.started_at)}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {s.page_count > 0 ? sessionDuration(s) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center justify-center w-7 h-5 rounded text-xs font-medium ${
                        s.page_count > 0
                          ? "bg-indigo-600/20 text-indigo-400"
                          : "bg-gray-800 text-gray-600"
                      }`}>
                        {s.page_count}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                      {s.ip ?? <span className="text-gray-700">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
