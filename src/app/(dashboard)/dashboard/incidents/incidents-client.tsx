"use client";

import React, { useState, useEffect } from "react";
import { Flame, Clock, CheckCircle2, User, AlertTriangle, ChevronDown } from "lucide-react";
import { formatDistanceToNow, parseISO, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { RetryButton } from "@/components/dashboard/retry-button";
import type { Incident, IncidentSeverity, IncidentStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function frequencyLabel(incident: Incident): string | null {
  if (incident.failure_count <= 1) return null;
  const mins = differenceInMinutes(
    parseISO(incident.last_seen_at),
    parseISO(incident.first_seen_at),
  );
  if (mins < 1) return `${incident.failure_count} failures`;
  return `${incident.failure_count} failures in ${mins} min`;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function IncidentCard({
  incident,
  onStatusChange,
}: {
  incident: Incident;
  onStatusChange: (id: string, status: IncidentStatus) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const firstSeenAgo = formatDistanceToNow(parseISO(incident.first_seen_at), { addSuffix: true });
  const lastSeenAgo  = formatDistanceToNow(parseISO(incident.last_seen_at),  { addSuffix: true });
  const resolvedAgo  = incident.resolved_at
    ? formatDistanceToNow(parseISO(incident.resolved_at), { addSuffix: true })
    : null;
  const freq = frequencyLabel(incident);

  const nextStatuses: IncidentStatus[] = (["open", "investigating", "resolved"] as IncidentStatus[]).filter(
    (s) => s !== incident.status
  );

  async function handleStatusChange(newStatus: IncidentStatus) {
    setLoading(true);
    try { await onStatusChange(incident.id, newStatus); } finally { setLoading(false); }
  }

  const retryCompositeId = incident.instance_id && incident.last_n8n_execution_id
    ? `${incident.instance_id}:${incident.last_n8n_execution_id}`
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

        <div className="flex items-center gap-2 shrink-0">
          {/* Frequency / failure count */}
          <span className="flex items-center gap-1 text-sm font-semibold text-destructive">
            <Flame className="w-4 h-4" />
            {freq ?? `${incident.failure_count} failure${incident.failure_count !== 1 ? "s" : ""}`}
          </span>

          {/* Status dropdown */}
          <div className="relative group">
            <button
              disabled={loading}
              className="flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Update <ChevronDown className="w-3 h-3" />
            </button>
            <div className="absolute right-0 top-full mt-1 z-10 hidden group-focus-within:flex group-hover:flex flex-col min-w-[140px] rounded-lg border border-border bg-card shadow-elevated overflow-hidden">
              {nextStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className="px-3 py-2 text-xs text-left capitalize hover:bg-muted transition-colors"
                >
                  Mark as {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-sm font-bold text-foreground leading-snug mb-1">{incident.title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{incident.workflow_name}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />First seen {firstSeenAgo}</span>
        <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Last seen {lastSeenAgo}</span>
        {resolvedAgo && (
          <span className="flex items-center gap-1 text-success"><CheckCircle2 className="w-3.5 h-3.5" />Resolved {resolvedAgo}</span>
        )}
        {incident.assigned_to && (
          <span className="flex items-center gap-1 text-primary"><User className="w-3.5 h-3.5" />Assigned</span>
        )}
      </div>

      {/* Retry button — only for non-resolved incidents with a known execution */}
      {retryCompositeId && incident.status !== "resolved" && (
        <RetryButton executionId={retryCompositeId} variant="sm" />
      )}
    </div>
  );
}

// ─── Client shell ─────────────────────────────────────────────────────────────

export function IncidentsClient({ initialIncidents }: { initialIncidents: Incident[] }) {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const openCount          = incidents.filter((i) => i.status === "open").length;
  const investigatingCount = incidents.filter((i) => i.status === "investigating").length;
  const resolvedCount      = incidents.filter((i) => i.status === "resolved").length;

  // Sort: open → investigating → resolved, then by last_seen_at desc within each group
  const STATUS_ORDER: Record<IncidentStatus, number> = { open: 0, investigating: 1, resolved: 2 };
  const sorted = [...incidents].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime();
  });

  const filtered = activeTab === "all" ? sorted : sorted.filter((i) => i.status === activeTab);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/incidents");
        if (!res.ok) return;
        const { incidents: fresh } = await res.json();
        setIncidents(fresh);
      } catch {}
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function handleStatusChange(id: string, newStatus: IncidentStatus) {
    const res = await fetch(`/api/incidents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) return;
    const { incident } = await res.json();
    setIncidents((prev) => prev.map((i) => (i.id === id ? (incident as Incident) : i)));
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 animate-fade-in">

      {/* Summary pills */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse-dot" />
          {openCount} Open
        </div>
        <div className="flex items-center gap-2 rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
          <span className="w-1.5 h-1.5 rounded-full bg-warning" />
          {investigatingCount} Investigating
        </div>
        <div className="flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          {resolvedCount} Resolved
        </div>
      </div>

      {/* Filter tabs */}
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

      {/* Incident list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-card p-10 text-center">
          <p className="text-sm font-medium text-muted-foreground">No incidents match this filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
