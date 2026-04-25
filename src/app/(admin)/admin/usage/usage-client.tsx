"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { Bell, Zap, Sparkles, UserPlus } from "lucide-react";
import type { UsagePageProps } from "./page";

// ── Recharts hex colors (CSS vars are not readable by the canvas renderer) ──
const COLOR_ALERTS = "#f97316";
const COLOR_EXECUTIONS = "#6366f1";
const COLOR_AI = "#a855f7";
const COLOR_SIGNUPS = "#22c55e";

// ── Shared tooltip style ────────────────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(var(--foreground))",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
};

// ── Tick formatter for day charts (MM/dd) ───────────────────────────────────
function fmtDay(dateStr: string) {
  try {
    return format(new Date(dateStr + "T00:00:00"), "MM/dd");
  } catch {
    return dateStr;
  }
}

// ── Stat card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  sublabel: string;
  icon: React.ReactNode;
  accentColor: string;
}

function StatCard({ label, value, sublabel, icon, accentColor }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: accentColor + "20" }}
        >
          <div style={{ color: accentColor }}>{icon}</div>
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground tabular-nums">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
      </div>
    </div>
  );
}

// ── Chart wrapper ────────────────────────────────────────────────────────────
function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-sm font-semibold text-foreground mb-4">{title}</p>
      {children}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function UsageClient({
  alertsByDay,
  executionsByDay,
  signupsByDay,
  aiMonthlyData,
  totalAlerts,
  totalExecutions,
  totalSignups,
  totalAi,
}: UsagePageProps) {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 min-h-full">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Usage</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Platform activity across all organizations
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Alert Firings"
          value={totalAlerts}
          sublabel="Last 30 days"
          icon={<Bell className="w-4 h-4" />}
          accentColor={COLOR_ALERTS}
        />
        <StatCard
          label="Executions"
          value={totalExecutions}
          sublabel="Last 30 days"
          icon={<Zap className="w-4 h-4" />}
          accentColor={COLOR_EXECUTIONS}
        />
        <StatCard
          label="AI Calls"
          value={totalAi}
          sublabel="All time"
          icon={<Sparkles className="w-4 h-4" />}
          accentColor={COLOR_AI}
        />
        <StatCard
          label="Landing Signups"
          value={totalSignups}
          sublabel="Last 30 days"
          icon={<UserPlus className="w-4 h-4" />}
          accentColor={COLOR_SIGNUPS}
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alert Firings by Day */}
        <ChartCard title="Alert Firings — last 30 days">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={alertsByDay}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDay}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={fmtDay}
                cursor={{ stroke: COLOR_ALERTS, strokeWidth: 1, strokeOpacity: 0.4 }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={COLOR_ALERTS}
                strokeWidth={2}
                fill={COLOR_ALERTS}
                fillOpacity={0.15}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Executions by Day */}
        <ChartCard title="Executions — last 30 days">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={executionsByDay}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDay}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={fmtDay}
                cursor={{ stroke: COLOR_EXECUTIONS, strokeWidth: 1, strokeOpacity: 0.4 }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={COLOR_EXECUTIONS}
                strokeWidth={2}
                fill={COLOR_EXECUTIONS}
                fillOpacity={0.15}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* AI Calls by Month */}
        <ChartCard title="AI Calls — last 6 months">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={aiMonthlyData}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: COLOR_AI, fillOpacity: 0.06 }}
              />
              <Bar
                dataKey="count"
                fill={COLOR_AI}
                fillOpacity={0.85}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Landing Signups by Day */}
        <ChartCard title="Landing Signups — last 30 days">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={signupsByDay}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDay}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={fmtDay}
                cursor={{ stroke: COLOR_SIGNUPS, strokeWidth: 1, strokeOpacity: 0.4 }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={COLOR_SIGNUPS}
                strokeWidth={2}
                fill={COLOR_SIGNUPS}
                fillOpacity={0.15}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
