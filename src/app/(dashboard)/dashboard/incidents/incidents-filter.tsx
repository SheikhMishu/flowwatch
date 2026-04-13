"use client";

import React, { useState } from "react";
import { Flame, Clock, CheckCircle2, User, AlertTriangle } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { Incident, IncidentSeverity, IncidentStatus } from "@/types";

type FilterTab = "all" | IncidentStatus;

const TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Investigating", value: "investigating" },
  { label: "Resolved", value: "resolved" },
];

function getSeverityClasses(severity: IncidentSeverity): string {
  switch (severity) {
    case "critical": return "bg-destructive text-destructive-foreground border-transparent";
    case "high":     return "bg-destructive/10 text-destructive border border-destructive/20";
    case "medium":   return "bg-warning/10 text-warning border border-warning/20";
    case "low":      return "bg-success/10 text-success border border-success/20";
  }
}

function getStatusClasses(status: IncidentStatus): string {
  switch (status) {
    case "open":          return "bg-destructive/10 text-destructive border border-destructive/20";
    case "investigating": return "bg-warning/10 text-warning border border-warning/20";
    case "resolved":      return "bg-success/10 text-success border border-success/20";
  }
}

function getCardAccent(status: IncidentStatus): string {
  switch (status) {
    case "open":          return "border-l-4 border-l-destructive";
    case "investigating": return "border-l-4 border-l-warning";
    case "resolved":      return "";
  }
}

function IncidentCard({ incident }: { incident: Incident }) {
  const firstSeenAgo = formatDistanceToNow(parseISO(incident.first_seen_at), { addSuffix: true });
  const lastSeenAgo  = formatDistanceToNow(parseISO(incident.last_seen_at),  { addSuffix: true });
  const resolvedAgo  = incident.resolved_at
    ? formatDistanceToNow(parseISO(incident.resolved_at), { addSuffix: true })
    : null;

  return (
    <div className={cn(
      "rounded-xl border border-border bg-card shadow-card p-5 transition-shadow hover:shadow-card-hover",
      getCardAccent(incident.status)
    )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", getSeverityClasses(incident.severity))}>
            {incident.severity}
          </span>
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", getStatusClasses(incident.status))}>
            {incident.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-destructive shrink-0">
          <Flame className="w-4 h-4" />
          <span>{incident.failure_count} failure{incident.failure_count !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <h3 className="text-sm font-bold text-foreground leading-snug mb-1">{incident.title}</h3>
      <p className="text-xs text-muted-foreground mb-4">{incident.workflow_name}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />First seen {firstSeenAgo}</span>
        <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Last seen {lastSeenAgo}</span>
        {resolvedAgo && (
          <span className="flex items-center gap-1 text-success"><CheckCircle2 className="w-3.5 h-3.5" />Resolved {resolvedAgo}</span>
        )}
        {incident.assigned_to && (
          <span className="flex items-center gap-1 text-primary"><User className="w-3.5 h-3.5" />Assigned</span>
        )}
      </div>
    </div>
  );
}

interface IncidentsFilterProps {
  incidents: Incident[];
}

export function IncidentsFilter({ incidents }: IncidentsFilterProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered = activeTab === "all" ? incidents : incidents.filter((i) => i.status === activeTab);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-xl border border-border bg-muted p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
              activeTab === tab.value
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-card p-10 text-center">
          <p className="text-sm font-medium text-muted-foreground">No incidents match this filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((incident) => <IncidentCard key={incident.id} incident={incident} />)}
        </div>
      )}
    </div>
  );
}
