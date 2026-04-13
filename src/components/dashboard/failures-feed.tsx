import React from "react";
import Link from "next/link";
import { AlertCircle, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, formatDuration } from "@/lib/utils";
import type { Execution } from "@/types";

interface FailuresFeedProps {
  executions: Execution[];
}

export function FailuresFeed({ executions }: FailuresFeedProps) {
  const failures = executions.filter((e) => e.status === "error");

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground">Recent Failures</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {failures.length} failure{failures.length !== 1 ? "s" : ""} in view
          </p>
        </div>
        <Link
          href="/dashboard/executions?status=error"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
        >
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {failures.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-5 h-5 text-success" />
            </div>
            <p className="text-sm font-medium text-foreground">All clear</p>
            <p className="text-xs text-muted-foreground mt-1">No failures in the current view</p>
          </div>
        ) : (
          failures.map((exec) => (
            <Link
              key={exec.id}
              href={`/dashboard/executions/${exec.id}`}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-secondary/50 transition-colors group"
            >
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-foreground truncate">
                    {exec.workflow_name}
                  </span>
                  <Badge variant="destructive" className="shrink-0 text-[10px] h-4 px-1.5">
                    {exec.error_type || "Error"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  <span className="font-medium text-foreground/70">Node:</span>{" "}
                  {exec.failed_node} — {exec.error_message?.slice(0, 70)}
                  {(exec.error_message?.length ?? 0) > 70 ? "…" : ""}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(exec.started_at)}
                  </span>
                  {exec.duration_ms && (
                    <span className="text-[11px] text-muted-foreground">
                      {formatDuration(exec.duration_ms)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
