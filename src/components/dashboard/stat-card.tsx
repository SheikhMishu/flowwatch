import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-accent",
  trend,
  className,
}: StatCardProps) {
  const trendPositive = trend && trend.value > 0;
  const trendNegative = trend && trend.value < 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              trendPositive && "text-success",
              trendNegative && "text-destructive",
              !trendPositive && !trendNegative && "text-muted-foreground"
            )}>
              {trendPositive && <TrendingUp className="w-3 h-3" />}
              {trendNegative && <TrendingDown className="w-3 h-3" />}
              {!trendPositive && !trendNegative && <Minus className="w-3 h-3" />}
              <span>
                {trend.value > 0 ? "+" : ""}{trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg shrink-0", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
    </div>
  );
}
