"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Server,
  AlertTriangle,
  Bell,
  Sparkles,
  Users,
  User,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ScrollText,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { ActivityLog } from "@/app/api/logs/activity/route";
import type { AppLog } from "@/app/api/logs/system/route";

// ─── Action label map ──────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Logged in",
  "auth.logout": "Logged out",
  "auth.pin_failed": "Failed PIN verification",
  "auth.org_created": "Created organization",
  "auth.invite_accepted": "Accepted invite",
  "instance.created": "Added instance",
  "instance.deleted": "Removed instance",
  "instance.updated": "Updated instance",
  "instance.tested": "Tested connection",
  "instance.synced": "Synced instance",
  "incident.status_changed": "Updated incident status",
  "alert.created": "Created alert",
  "alert.updated": "Updated alert",
  "alert.deleted": "Deleted alert",
  "ai.explain_requested": "Used AI debugging",
  "team.member_invited": "Invited team member",
  "team.member_removed": "Removed team member",
  "team.role_changed": "Changed member role",
  "profile.updated": "Updated profile",
};

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

// ─── Action icon ───────────────────────────────────────────────────────────────

function ActionIcon({ action }: { action: string }) {
  const category = action.split(".")[0];
  const iconClass = "w-4 h-4 shrink-0";

  switch (category) {
    case "auth":
      return <Shield className={cn(iconClass, "text-primary")} />;
    case "instance":
      return <Server className={cn(iconClass, "text-primary")} />;
    case "incident":
      return <AlertTriangle className={cn(iconClass, "text-warning")} />;
    case "alert":
      return <Bell className={cn(iconClass, "text-warning")} />;
    case "ai":
      return <Sparkles className={cn(iconClass, "text-primary")} />;
    case "team":
      return <Users className={cn(iconClass, "text-success")} />;
    case "profile":
      return <User className={cn(iconClass, "text-muted-foreground")} />;
    default:
      return <ScrollText className={cn(iconClass, "text-muted-foreground")} />;
  }
}

// ─── Activity filter tabs ──────────────────────────────────────────────────────

type ActivityFilter = "all" | "auth" | "instance" | "incident" | "alert" | "ai" | "team";

const ACTIVITY_FILTERS: { label: string; value: ActivityFilter }[] = [
  { label: "All", value: "all" },
  { label: "Auth", value: "auth" },
  { label: "Instances", value: "instance" },
  { label: "Incidents", value: "incident" },
  { label: "Alerts", value: "alert" },
  { label: "AI", value: "ai" },
  { label: "Team", value: "team" },
];

// ─── System log level ──────────────────────────────────────────────────────────

type LevelFilter = "all" | "warn" | "error" | "fatal";

const LEVEL_FILTERS: { label: string; value: LevelFilter }[] = [
  { label: "All", value: "all" },
  { label: "Warn", value: "warn" },
  { label: "Error", value: "error" },
  { label: "Fatal", value: "fatal" },
];

function LevelBadge({ level }: { level: AppLog["level"] }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  switch (level) {
    case "warn":
      return <span className={cn(base, "bg-warning/10 text-warning border border-warning/20")}>warn</span>;
    case "error":
      return <span className={cn(base, "bg-destructive/10 text-destructive border border-destructive/20")}>error</span>;
    case "fatal":
      return <span className={cn(base, "bg-destructive text-destructive-foreground border-transparent font-bold")}>fatal</span>;
  }
}

// ─── Time helper ──────────────────────────────────────────────────────────────

function TimeAgo({ dateStr }: { dateStr: string }) {
  try {
    return (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(parseISO(dateStr), { addSuffix: true })}
      </span>
    );
  } catch {
    return <span className="text-xs text-muted-foreground">{dateStr}</span>;
  }
}

// ─── Filter tab row ────────────────────────────────────────────────────────────

function FilterTabs<T extends string>({
  filters,
  active,
  onChange,
}: {
  filters: { label: string; value: T }[];
  active: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-muted p-1 w-fit flex-wrap">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
            active === f.value
              ? "bg-card text-foreground shadow-card"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ─── Activity log row ──────────────────────────────────────────────────────────

function ActivityRow({ log }: { log: ActivityLog }) {
  const label = getActionLabel(log.action);
  const who = log.user_name || log.user_email || "Unknown user";
  const resource = log.resource_type
    ? log.resource_id
      ? `${log.resource_type} #${log.resource_id.slice(0, 8)}`
      : log.resource_type
    : null;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-muted shrink-0">
        <ActionIcon action={log.action} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {resource && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-muted-foreground">
              {resource}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{who}</span>
          {log.ip && <span className="text-xs text-muted-foreground/60">{log.ip}</span>}
        </div>
      </div>
      <TimeAgo dateStr={log.created_at} />
    </div>
  );
}

// ─── System log row ────────────────────────────────────────────────────────────

function SystemRow({ log }: { log: AppLog }) {
  const [expanded, setExpanded] = useState(false);
  const hasContext = log.context && Object.keys(log.context).length > 0;

  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full flex items-start gap-3 py-3 text-left group"
        onClick={() => hasContext && setExpanded((v) => !v)}
        disabled={!hasContext}
      >
        <LevelBadge level={log.level} />
        <div className="flex-1 min-w-0">
          {log.category && (
            <span className="text-xs text-muted-foreground font-mono">{log.category}</span>
          )}
          <p className="text-sm text-foreground mt-0.5 break-words">{log.message}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <TimeAgo dateStr={log.created_at} />
          {hasContext && (
            expanded
              ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </button>
      {expanded && hasContext && (
        <div className="mb-3 mx-0 rounded-lg bg-muted border border-border overflow-auto max-h-60">
          <pre className="p-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap">
            {JSON.stringify(log.context, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-12 text-center">
      <ScrollText className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── Main client ───────────────────────────────────────────────────────────────

interface LogsClientProps {
  initialActivityLogs: ActivityLog[];
  initialActivityTotal: number;
  initialSystemLogs: AppLog[];
  initialSystemTotal: number;
}

export function LogsClient({
  initialActivityLogs,
  initialActivityTotal,
  initialSystemLogs,
  initialSystemTotal,
}: LogsClientProps) {
  type TabId = "activity" | "system";
  const [activeTab, setActiveTab] = useState<TabId>("activity");

  // Activity state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [activityTotal, setActivityTotal] = useState(initialActivityTotal);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [activityOffset, setActivityOffset] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);

  // System state
  const [systemLogs, setSystemLogs] = useState<AppLog[]>(initialSystemLogs);
  const [systemTotal, setSystemTotal] = useState(initialSystemTotal);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [systemOffset, setSystemOffset] = useState(0);
  const [systemLoading, setSystemLoading] = useState(false);

  // ── Fetch activity ──────────────────────────────────────────────────────────

  const fetchActivity = useCallback(
    async (filter: ActivityFilter, offset: number, append = false) => {
      setActivityLoading(true);
      try {
        const params = new URLSearchParams({ limit: "50", offset: String(offset) });
        if (filter !== "all") params.set("action", filter);
        const res = await fetch(`/api/logs/activity?${params}`);
        if (!res.ok) return;
        const { logs, total } = (await res.json()) as { logs: ActivityLog[]; total: number };
        setActivityLogs((prev) => (append ? [...prev, ...logs] : logs));
        setActivityTotal(total);
      } catch {
        // silent
      } finally {
        setActivityLoading(false);
      }
    },
    []
  );

  // ── Fetch system ────────────────────────────────────────────────────────────

  const fetchSystem = useCallback(
    async (level: LevelFilter, offset: number, append = false) => {
      setSystemLoading(true);
      try {
        const params = new URLSearchParams({ limit: "50", offset: String(offset) });
        if (level !== "all") params.set("level", level);
        const res = await fetch(`/api/logs/system?${params}`);
        if (!res.ok) return;
        const { logs, total } = (await res.json()) as { logs: AppLog[]; total: number };
        setSystemLogs((prev) => (append ? [...prev, ...logs] : logs));
        setSystemTotal(total);
      } catch {
        // silent
      } finally {
        setSystemLoading(false);
      }
    },
    []
  );

  // ── Filter changes ──────────────────────────────────────────────────────────

  useEffect(() => {
    setActivityOffset(0);
    fetchActivity(activityFilter, 0, false);
  }, [activityFilter, fetchActivity]);

  useEffect(() => {
    setSystemOffset(0);
    fetchSystem(levelFilter, 0, false);
  }, [levelFilter, fetchSystem]);

  // ── Auto-refresh every 30s ──────────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "activity") {
        fetchActivity(activityFilter, 0, false);
        setActivityOffset(0);
      } else {
        fetchSystem(levelFilter, 0, false);
        setSystemOffset(0);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [activeTab, activityFilter, levelFilter, fetchActivity, fetchSystem]);

  // ── Load more ───────────────────────────────────────────────────────────────

  function handleLoadMoreActivity() {
    const newOffset = activityOffset + 50;
    setActivityOffset(newOffset);
    fetchActivity(activityFilter, newOffset, true);
  }

  function handleLoadMoreSystem() {
    const newOffset = systemOffset + 50;
    setSystemOffset(newOffset);
    fetchSystem(levelFilter, newOffset, true);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const tabs: { id: TabId; label: string }[] = [
    { id: "activity", label: "Activity" },
    { id: "system", label: "System Errors" },
  ];

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 animate-fade-in">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-muted p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Activity tab ─────────────────────────────────────────────────────── */}
      {activeTab === "activity" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <FilterTabs
              filters={ACTIVITY_FILTERS}
              active={activityFilter}
              onChange={(v) => setActivityFilter(v)}
            />
            <div className="flex items-center gap-2">
              {activityLoading && (
                <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
              )}
              <span className="text-xs text-muted-foreground">
                {activityLogs.length} of {activityTotal} entries
              </span>
            </div>
          </div>

          {activityLogs.length === 0 && !activityLoading ? (
            <EmptyState message="No activity logs found. Actions taken in your organization will appear here." />
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-card p-5">
              {activityLogs.map((log) => (
                <ActivityRow key={log.id} log={log} />
              ))}
              {activityLogs.length < activityTotal && (
                <div className="pt-4 text-center">
                  <button
                    onClick={handleLoadMoreActivity}
                    disabled={activityLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    {activityLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    Load more
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── System errors tab ─────────────────────────────────────────────────── */}
      {activeTab === "system" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <FilterTabs
              filters={LEVEL_FILTERS}
              active={levelFilter}
              onChange={(v) => setLevelFilter(v)}
            />
            <div className="flex items-center gap-2">
              {systemLoading && (
                <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
              )}
              <span className="text-xs text-muted-foreground">
                {systemLogs.length} of {systemTotal} entries
              </span>
            </div>
          </div>

          {systemLogs.length === 0 && !systemLoading ? (
            <EmptyState message="No system errors found. That's a good sign." />
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-card p-5">
              {systemLogs.map((log) => (
                <SystemRow key={log.id} log={log} />
              ))}
              {systemLogs.length < systemTotal && (
                <div className="pt-4 text-center">
                  <button
                    onClick={handleLoadMoreSystem}
                    disabled={systemLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    {systemLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    Load more
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
