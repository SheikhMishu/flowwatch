import React from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Circle, ChevronRight, Activity } from "lucide-react";
import { formatRelativeTime, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Workflow } from "@/types";

interface WorkflowHealthProps {
  workflows: Workflow[];
}

function SuccessRateBar({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            rate >= 99 ? "bg-success" : rate >= 95 ? "bg-warning" : "bg-destructive"
          )}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className={cn(
        "text-xs font-medium w-10 text-right shrink-0",
        rate >= 99 ? "text-success" : rate >= 95 ? "text-warning" : "text-destructive"
      )}>
        {rate}%
      </span>
    </div>
  );
}

export function WorkflowHealth({ workflows }: WorkflowHealthProps) {
  const sorted = [...workflows].sort((a, b) => b.executions_24h - a.executions_24h);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground">Workflow Health</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Top workflows by activity</p>
        </div>
        <Link
          href="/dashboard/workflows"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
        >
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {sorted.map((wf) => (
          <Link
            key={wf.id}
            href={`/dashboard/workflows/${wf.id}`}
            className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/50 transition-colors group"
          >
            {/* Status icon */}
            <div className="shrink-0">
              {wf.status === "inactive" ? (
                <Circle className="w-4 h-4 text-muted-foreground/40" />
              ) : wf.last_execution_status === "error" ? (
                <XCircle className="w-4 h-4 text-destructive" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-success" />
              )}
            </div>

            {/* Name + last run */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {wf.name}
                </span>
                {wf.status === "inactive" && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Activity className="w-3 h-3" />
                  {formatNumber(wf.executions_24h)} runs today
                </span>
                {wf.last_execution_at && (
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(wf.last_execution_at)}
                  </span>
                )}
              </div>
            </div>

            {/* Success rate bar */}
            <div className="w-28 shrink-0 hidden sm:block">
              <SuccessRateBar rate={wf.success_rate} />
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
