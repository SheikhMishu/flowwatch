"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";

function formatCountdown(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function AutoRefreshToggle() {
  const { enabled, toggle, secondsLeft, isRefreshing } = useAutoRefresh();

  return (
    <button
      onClick={toggle}
      title={enabled ? `Auto-refresh on — next in ${formatCountdown(secondsLeft)}` : "Auto-refresh off"}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors select-none",
        enabled
          ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
          : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary",
      )}
    >
      {/* Pulse dot — visible when enabled and not actively refreshing */}
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
          enabled && !isRefreshing && "bg-primary animate-pulse-dot",
          enabled && isRefreshing && "bg-primary",
          !enabled && "bg-muted-foreground/40",
        )}
      />

      {/* Refresh icon — spins on refresh fire */}
      <RefreshCw
        className={cn(
          "w-3 h-3 shrink-0 transition-colors",
          isRefreshing && "animate-spin",
        )}
      />

      {/* Countdown or "off" label */}
      <span className="hidden sm:inline tabular-nums">
        {enabled ? formatCountdown(secondsLeft) : "off"}
      </span>
    </button>
  );
}
