"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  AlertCircle,
  CheckCircle2,
  Server,
  Users,
  Clock,
  Plus,
  Loader2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface WorkspaceHealth {
  id: string;
  name: string;
  slug: string;
  instanceCount: number;
  memberCount: number;
  openIncidents: number;
  lastSyncedAt: string | null;
  status: "healthy" | "degraded" | "no_instances";
}

// ─── Add Workspace Modal ──────────────────────────────────────────────────────

function AddWorkspaceModal({
  parentOrgId,
  userId,
  email,
  onClose,
  onCreated,
}: {
  parentOrgId: string;
  userId: string;
  email: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/create-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, orgName: name.trim(), parentOrgId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create workspace."); setLoading(false); return; }
      onCreated();
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <div className="flex items-center gap-3 px-6 pt-6 pb-5 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Add client workspace</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Create an isolated workspace for a client</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Workspace name</label>
            <input
              ref={inputRef}
              type="text"
              placeholder="Client A — Shopify Store"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              maxLength={50}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-50"
            />
            <p className="text-[11px] text-muted-foreground">
              This workspace will be fully isolated — each client only sees their own data.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
              ) : (
                <><Plus className="w-4 h-4" /> Create workspace</>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-5 w-36 rounded-md bg-muted" />
          <div className="h-4 w-20 rounded-full bg-muted" />
        </div>
        <div className="h-8 w-8 rounded-lg bg-muted" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-24 rounded-full bg-muted" />
        <div className="h-6 w-20 rounded-full bg-muted" />
      </div>
      <div className="h-9 w-full rounded-xl bg-muted" />
    </div>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig = {
  healthy: {
    label: "Healthy",
    icon: CheckCircle2,
    className: "text-success bg-success/10 border-success/20",
    dot: "bg-success",
  },
  degraded: {
    label: "Needs attention",
    icon: AlertCircle,
    className: "text-destructive bg-destructive/10 border-destructive/20",
    dot: "bg-destructive",
  },
  no_instances: {
    label: "No instances",
    icon: Server,
    className: "text-muted-foreground bg-muted/50 border-border",
    dot: "bg-muted-foreground",
  },
};

// ─── Workspace Card ───────────────────────────────────────────────────────────

function WorkspaceCard({ workspace }: { workspace: WorkspaceHealth }) {
  const [switching, setSwitching] = useState(false);
  const status = statusConfig[workspace.status];
  const StatusIcon = status.icon;

  async function handleOpen() {
    setSwitching(true);
    try {
      const res = await fetch("/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: workspace.id }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        setSwitching(false);
      }
    } catch {
      setSwitching(false);
    }
  }

  const lastSync = workspace.lastSyncedAt
    ? formatDistanceToNow(parseISO(workspace.lastSyncedAt), { addSuffix: true })
    : null;

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-card p-5 flex flex-col gap-4 transition-all duration-200",
        workspace.status === "degraded"
          ? "border-destructive/30 hover:border-destructive/50"
          : "border-border hover:border-primary/30",
        "hover:shadow-lg hover:shadow-black/20"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground truncate text-base leading-tight">{workspace.name}</h3>
          <div className={cn("inline-flex items-center gap-1.5 mt-2 rounded-full border px-2.5 py-0.5 text-xs font-medium", status.className)}>
            <StatusIcon className="w-3 h-3 shrink-0" />
            {status.label}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
          <Building2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-muted/50 border border-border px-2.5 py-1 text-xs text-muted-foreground">
          <Server className="w-3 h-3" />
          {workspace.instanceCount} {workspace.instanceCount === 1 ? "instance" : "instances"}
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-muted/50 border border-border px-2.5 py-1 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          {workspace.memberCount} {workspace.memberCount === 1 ? "member" : "members"}
        </div>
        {workspace.openIncidents > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 border border-destructive/20 px-2.5 py-1 text-xs text-destructive font-medium">
            <AlertCircle className="w-3 h-3" />
            {workspace.openIncidents} open {workspace.openIncidents === 1 ? "incident" : "incidents"}
          </div>
        )}
      </div>

      {/* Last sync */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="w-3 h-3 shrink-0" />
        {lastSync ? <>Synced {lastSync}</> : "Never synced"}
      </div>

      {/* Open button */}
      <button
        onClick={handleOpen}
        disabled={switching}
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-border bg-background hover:bg-primary hover:border-primary hover:text-primary-foreground px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-150 disabled:opacity-60"
      >
        {switching ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Opening…</>
        ) : (
          <>Open workspace <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WorkspacesClient() {
  const [workspaces, setWorkspaces] = useState<WorkspaceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [me, setMe] = useState<{ userId: string; email: string; orgId: string } | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const [wsRes, meRes] = await Promise.all([
        fetch("/api/org/workspaces"),
        fetch("/api/auth/me"),
      ]);
      if (wsRes.ok) {
        const data = await wsRes.json();
        setWorkspaces(data.workspaces ?? []);
      }
      if (meRes.ok) {
        const data = await meRes.json();
        if (data.user) setMe({ userId: data.user.userId, email: data.user.email, orgId: data.user.orgId });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function handleCreated() {
    setShowModal(false);
    fetchData();
  }

  const healthyCnt = workspaces.filter((w) => w.status === "healthy").length;
  const degradedCnt = workspaces.filter((w) => w.status === "degraded").length;
  const noInstancesCnt = workspaces.filter((w) => w.status === "no_instances").length;
  const totalIncidents = workspaces.reduce((sum, w) => sum + w.openIncidents, 0);

  // Sort: degraded first, then no_instances, then healthy
  const sorted = [
    ...workspaces.filter((w) => w.status === "degraded"),
    ...workspaces.filter((w) => w.status === "no_instances"),
    ...workspaces.filter((w) => w.status === "healthy"),
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Managed Workspaces</h2>
          {!loading && workspaces.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {workspaces.length} {workspaces.length === 1 ? "workspace" : "workspaces"}
              {healthyCnt > 0 && <> · <span className="text-success">{healthyCnt} healthy</span></>}
              {degradedCnt > 0 && <> · <span className="text-destructive">{degradedCnt} need attention</span></>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add client workspace</span>
          </button>
        </div>
      </div>

      {/* Summary stats bar */}
      {!loading && workspaces.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total workspaces", value: workspaces.length, color: "text-foreground" },
            { label: "Healthy", value: healthyCnt, color: "text-success" },
            { label: "Need attention", value: degradedCnt, color: degradedCnt > 0 ? "text-destructive" : "text-muted-foreground" },
            { label: "Open incidents", value: totalIncidents, color: totalIncidents > 0 ? "text-destructive" : "text-muted-foreground" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Alert banner */}
      {!loading && degradedCnt > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">{degradedCnt} client {degradedCnt === 1 ? "workspace has" : "workspaces have"} open incidents</span>
            {noInstancesCnt > 0 && <> · {noInstancesCnt} {noInstancesCnt === 1 ? "workspace has" : "workspaces have"} no instances connected</>}
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && workspaces.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-16 flex flex-col items-center justify-center gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">No client workspaces yet</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto leading-relaxed">
              Create a separate workspace for each client. Their data stays fully isolated — they only see what's theirs.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add client workspace
          </button>

          <div className="grid grid-cols-3 gap-4 max-w-sm w-full mt-2">
            {[
              { icon: Building2, label: "Isolated per client" },
              { icon: Server, label: "Separate instances" },
              { icon: Users, label: "Client access control" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight text-center">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {!loading && workspaces.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && me && (
        <AddWorkspaceModal
          parentOrgId={me.orgId}
          userId={me.userId}
          email={me.email}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
