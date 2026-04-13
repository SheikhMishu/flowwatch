"use client";

import React, { useState, useMemo } from "react";
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

type Range = "6h" | "12h" | "24h";

const RANGE_HOURS: Record<Range, number> = {
  "6h": 6,
  "12h": 12,
  "24h": 24,
};

interface ExecutionsChartProps {
  data: TrendPoint[];
}

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  color: string;
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
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ExecutionsChart({ data }: ExecutionsChartProps) {
  const [range, setRange] = useState<Range>("24h");

  const chartData = useMemo(() => {
    const hours = RANGE_HOURS[range];
    const sliced = data.slice(-hours);
    return sliced.map((d) => ({
      time: format(parseISO(d.time), "HH:mm"),
      executions: d.executions,
      failures: d.failures,
    }));
  }, [data, range]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Executions Over Time</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Executions and failures across all workflows
          </p>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
          {(["6h", "12h", "24h"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150",
                range === r
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="execGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(243 75% 59%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(243 75% 59%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="failGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />

          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
          />

          <Area
            type="monotone"
            dataKey="executions"
            name="Executions"
            stroke="hsl(243 75% 59%)"
            strokeWidth={2}
            fill="url(#execGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />

          <Area
            type="monotone"
            dataKey="failures"
            name="Failures"
            stroke="hsl(0 84% 60%)"
            strokeWidth={2}
            fill="url(#failGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
