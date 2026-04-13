"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { TrendPoint } from "@/types";

const RANGES = ["6h", "12h", "24h"] as const;
type Range = (typeof RANGES)[number];

interface ExecutionChartProps {
  data: TrendPoint[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-elevated text-xs">
      <p className="font-medium text-foreground mb-1.5">
        {label ?? ""}
      </p>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ExecutionChart({ data }: ExecutionChartProps) {
  const [range, setRange] = useState<Range>("24h");

  const hours = range === "6h" ? 6 : range === "12h" ? 12 : 24;
  const sliced = data.slice(-hours);

  const chartData = sliced.map((d) => ({
    ...d,
    label: d.time,
    time: format(parseISO(d.time), "HH:mm"),
  }));

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h3 className="font-semibold text-foreground">Execution Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Executions vs failures over time</p>
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                range === r
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="execGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(243 75% 59%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(243 75% 59%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="failGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91% / 0.6)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="executions"
            name="executions"
            stroke="hsl(243 75% 59%)"
            strokeWidth={2}
            fill="url(#execGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="failures"
            name="failures"
            stroke="hsl(0 84% 60%)"
            strokeWidth={2}
            fill="url(#failGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: 11, color: "hsl(220 9% 46%)", textTransform: "capitalize" }}>
                {value}
              </span>
            )}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
