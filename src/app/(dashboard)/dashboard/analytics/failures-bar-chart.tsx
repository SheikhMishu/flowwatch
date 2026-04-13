"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Workflow } from "@/types";

interface FailuresBarChartProps {
  workflows: Workflow[];
}

interface TooltipPayloadEntry {
  value: number;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card shadow-elevated px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">
        Failures:{" "}
        <span className="font-medium text-destructive">{payload[0].value}</span>
      </p>
    </div>
  );
}

export function FailuresBarChart({ workflows }: FailuresBarChartProps) {
  const chartData = workflows
    .filter((w) => w.failures_24h > 0)
    .sort((a, b) => b.failures_24h - a.failures_24h)
    .map((w) => ({
      name: w.name.length > 20 ? w.name.slice(0, 20) + "…" : w.name,
      failures: w.failures_24h,
    }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Failures by Workflow</h3>
        <p className="text-xs text-muted-foreground mb-6">Last 24 hours</p>
        <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
          No failures in the last 24 hours
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">Failures by Workflow</h3>
      <p className="text-xs text-muted-foreground mb-4">Last 24 hours</p>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          barSize={28}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
          <Bar dataKey="failures" radius={[4, 4, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`hsl(0 84% ${60 + index * 5}%)`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
