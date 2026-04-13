import React from "react";
import Link from "next/link";
import { Flame, AlertTriangle, Info, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Incident, IncidentSeverity } from "@/types";

function SeverityIcon({ severity }: { severity: IncidentSeverity }) {
  switch (severity) {
    case "critical": return <Flame className="w-4 h-4 text-destructive" />;
    case "high": return <AlertTriangle className="w-4 h-4 text-warning" />;
    default: return <Info className="w-4 h-4 text-primary" />;
  }
}

function severityBadge(severity: IncidentSeverity) {
  switch (severity) {
    case "critical": return <Badge variant="destructive">Critical</Badge>;
    case "high": return <Badge variant="warning">High</Badge>;
    case "medium": return <Badge variant="default">Medium</Badge>;
    default: return <Badge variant="secondary">Low</Badge>;
  }
}

function statusBadge(status: Incident["status"]) {
  switch (status) {
    case "open": return <Badge variant="destructive">Open</Badge>;
    case "investigating": return <Badge variant="warning">Investigating</Badge>;
    default: return <Badge variant="success">Resolved</Badge>;
  }
}

interface IncidentsWidgetProps {
  incidents: Incident[];
}

export function IncidentsWidget({ incidents }: IncidentsWidgetProps) {
  const open = incidents.filter((i) => i.status !== "resolved");

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Open Incidents</h3>
          {open.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
              {open.length}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/incidents"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
        >
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {open.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-medium text-foreground">No open incidents</p>
            <p className="text-xs text-muted-foreground mt-1">Everything looks healthy</p>
          </div>
        ) : (
          open.map((incident) => (
            <Link
              key={incident.id}
              href={`/dashboard/incidents/${incident.id}`}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-secondary/50 transition-colors group"
            >
              <div className={cn(
                "mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                incident.severity === "critical" ? "bg-destructive/10" :
                incident.severity === "high" ? "bg-warning/10" : "bg-primary/10"
              )}>
                <SeverityIcon severity={incident.severity} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-medium text-foreground truncate">
                    {incident.title}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-1.5">
                  {incident.workflow_name} · {incident.failure_count} failures
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {severityBadge(incident.severity)}
                  {statusBadge(incident.status)}
                  <span className="text-[11px] text-muted-foreground">
                    Last seen {formatRelativeTime(incident.last_seen_at)}
                  </span>
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
