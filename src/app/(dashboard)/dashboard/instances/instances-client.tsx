"use client";

import React, { useState } from "react";
import {
  Plus,
  RefreshCw,
  Pencil,
  Unplug,
  Activity,
  Workflow,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  Server,
  X,
  Loader2,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { N8nInstance } from "@/types";

// ─── Add Instance Modal ───────────────────────────────────────────────────────

type TestStatus = "idle" | "testing" | "ok" | "fail";

function AddInstanceModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (instance: N8nInstance) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testError, setTestError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleTest(e: React.MouseEvent) {
    e.preventDefault();
    if (!url.trim() || !apiKey.trim()) return;
    setTestStatus("testing");
    setTestError("");
    try {
      const res = await fetch("/api/instances/placeholder/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestStatus("ok");
      } else {
        setTestStatus("fail");
        setTestError(data.error ?? "Connection failed");
      }
    } catch {
      setTestStatus("fail");
      setTestError("Network error — check the URL");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim() || !apiKey.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          apiKey: apiKey.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Failed to connect instance");
        setSaving(false);
        return;
      }
      onAdded(data.instance);
    } catch {
      setSaveError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const canSubmit = name.trim() && url.trim() && apiKey.trim() && !saving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-elevated animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Connect n8n Instance
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Start monitoring your workflows
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {saveError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {saveError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="inst-name">Instance name</Label>
            <input
              id="inst-name"
              type="text"
              placeholder="Production"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saving}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inst-url">n8n instance URL</Label>
            <input
              id="inst-url"
              type="url"
              placeholder="https://n8n.yourdomain.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTestStatus("idle");
              }}
              required
              disabled={saving}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inst-key">API key</Label>
            <div className="relative">
              <input
                id="inst-key"
                type={showKey ? "text" : "password"}
                placeholder="n8n_api_••••••••"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestStatus("idle");
                }}
                required
                disabled={saving}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Find it in n8n → Settings → API → Create an API key
            </p>
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={
                !url.trim() ||
                !apiKey.trim() ||
                testStatus === "testing" ||
                saving
              }
              className="gap-1.5"
            >
              {testStatus === "testing" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                  Testing&hellip;
                </>
              ) : (
                <>Test connection</>
              )}
            </Button>
            {testStatus === "ok" && (
              <span className="flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 className="w-4 h-4" /> Success
              </span>
            )}
            {testStatus === "fail" && (
              <span className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" /> {testError}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <Button type="submit" disabled={!canSubmit} className="gap-1.5">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />{" "}
                  Connecting&hellip;
                </>
              ) : (
                "Connect instance"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar() {
  return (
    <div className="flex items-center gap-0.5 border-b border-border mb-4">
      {(["Overview", "Workflows", "Health"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          disabled={tab !== "Overview"}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            tab === "Overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground cursor-not-allowed hover:text-foreground/60",
          )}
        >
          {tab}
          {tab !== "Overview" && (
            <span className="ml-1.5 inline-flex items-center rounded-full bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
              Soon
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Edit Instance Modal ──────────────────────────────────────────────────────

function EditInstanceModal({
  instance,
  onClose,
  onUpdated,
}: {
  instance: N8nInstance;
  onClose: () => void;
  onUpdated: (updated: N8nInstance) => void;
}) {
  const [name, setName] = useState(instance.name);
  const [url, setUrl] = useState(instance.url);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testError, setTestError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleTest(e: React.MouseEvent) {
    e.preventDefault();
    setTestStatus("testing");
    setTestError("");
    try {
      // If user entered a new API key, test with that; otherwise test stored creds
      const body = apiKey.trim()
        ? { url: url.trim(), apiKey: apiKey.trim() }
        : {};
      const res = await fetch(`/api/instances/${instance.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setTestStatus("ok");
      } else {
        setTestStatus("fail");
        setTestError(data.error ?? "Connection failed");
      }
    } catch {
      setTestStatus("fail");
      setTestError("Network error — check the URL");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const body: Record<string, string> = { name: name.trim(), url: url.trim() };
      if (apiKey.trim()) body.apiKey = apiKey.trim();
      const res = await fetch(`/api/instances/${instance.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Failed to update instance");
        setSaving(false);
        return;
      }
      onUpdated(data.instance);
    } catch {
      setSaveError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-elevated animate-fade-in">
        <div className="flex items-start justify-between p-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Edit Instance</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{instance.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {saveError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {saveError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Instance name</Label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saving}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-url">n8n instance URL</Label>
            <input
              id="edit-url"
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setTestStatus("idle"); }}
              required
              disabled={saving}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-key">API key <span className="text-muted-foreground font-normal">(leave blank to keep current)</span></Label>
            <div className="relative">
              <input
                id="edit-key"
                type={showKey ? "text" : "password"}
                placeholder={`Current: ••••${instance.api_key_hint}`}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setTestStatus("idle"); }}
                disabled={saving}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testStatus === "testing" || saving}
              className="gap-1.5"
            >
              {testStatus === "testing" ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing&hellip;</>
              ) : (
                <>Test connection</>
              )}
            </Button>
            {testStatus === "ok" && (
              <span className="flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 className="w-4 h-4" /> Connected
              </span>
            )}
            {testStatus === "fail" && (
              <span className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" /> {testError}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <Button type="submit" disabled={!name.trim() || saving} className="gap-1.5">
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving&hellip;</>
              ) : (
                "Save changes"
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Instance card ────────────────────────────────────────────────────────────

function InstanceCard({
  instance,
  onDisconnect,
  onSync,
  onEdit,
}: {
  instance: N8nInstance;
  onDisconnect: (id: string) => void;
  onSync: (id: string, lastSyncedAt: string) => void;
  onEdit: (id: string) => void;
}) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ workflows: number; executions: number } | null>(null);
  const [syncError, setSyncError] = useState("");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testError, setTestError] = useState("");

  const lastSynced = instance.last_synced_at
    ? formatDistanceToNow(parseISO(instance.last_synced_at), {
        addSuffix: true,
      })
    : "Never";

  async function handleTestConnection() {
    setTestStatus("testing");
    setTestError("");
    try {
      const res = await fetch(`/api/instances/${instance.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        setTestStatus("ok");
        setTimeout(() => setTestStatus("idle"), 4000);
      } else {
        setTestStatus("fail");
        setTestError(data.error ?? "Connection failed");
      }
    } catch {
      setTestStatus("fail");
      setTestError("Network error");
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError("");
    try {
      const res = await fetch(`/api/instances/${instance.id}/sync`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        onSync(instance.id, data.last_synced_at);
        setSyncResult({ workflows: data.workflowsUpserted ?? 0, executions: data.executionsUpserted ?? 0 });
        setTimeout(() => setSyncResult(null), 8000);
      } else {
        setSyncError(data.error ?? "Sync failed");
      }
    } catch {
      setSyncError("Network error during sync");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (
      !confirm(
        `Disconnect "${instance.name}"? This will remove the instance from FlowWatch.`,
      )
    )
      return;
    setDisconnecting(true);
    try {
      const res = await fetch(`/api/instances/${instance.id}`, {
        method: "DELETE",
      });
      if (res.ok) onDisconnect(instance.id);
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              instance.is_active ? "bg-accent" : "bg-muted",
            )}
          >
            <Server
              className={cn(
                "w-5 h-5",
                instance.is_active ? "text-primary" : "text-muted-foreground",
              )}
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground leading-snug">
              {instance.name}
            </h2>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {instance.url}
            </p>
          </div>
        </div>
        <Badge
          variant={instance.is_active ? "success" : "destructive"}
          className="shrink-0 mt-0.5"
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              instance.is_active
                ? "bg-success animate-pulse-dot"
                : "bg-destructive",
            )}
          />
          {instance.is_active ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <div className="px-5">
        <TabBar />
      </div>

      <div className="px-5 pb-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-background p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Workflow className="w-3.5 h-3.5" /> Workflows
            </div>
            <span className="text-xl font-bold text-foreground">—</span>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="w-3.5 h-3.5" /> Executions
            </div>
            <span className="text-xl font-bold text-foreground">—</span>
            <span className="text-[10px] text-muted-foreground -mt-0.5">
              today
            </span>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5" /> Success
            </div>
            <span className="text-xl font-bold text-success">—</span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Last synced{" "}
            <span className="font-medium text-foreground">{lastSynced}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 shrink-0" />
            API Key:{" "}
            <span className="font-mono text-foreground">
              {instance.api_key_hint}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span className="text-success font-medium">Connected</span>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus === "testing"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {testStatus === "testing" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : testStatus === "ok" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            ) : testStatus === "fail" ? (
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
            ) : (
              <Activity className="w-3.5 h-3.5" />
            )}
            {testStatus === "testing"
              ? "Testing…"
              : testStatus === "ok"
                ? "Connected"
                : testStatus === "fail"
                  ? testError || "Failed"
                  : "Test Connection"}
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
              syncError
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : syncResult
                  ? "border-success/30 bg-success/5 text-success"
                  : "border-border bg-background text-foreground hover:bg-secondary",
            )}
          >
            {syncing ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing…</>
            ) : syncError ? (
              <><AlertCircle className="w-3.5 h-3.5" /> {syncError}</>
            ) : syncResult ? (
              <><CheckCircle2 className="w-3.5 h-3.5" /> {syncResult.workflows} workflows · {syncResult.executions} executions</>
            ) : (
              <><RefreshCw className="w-3.5 h-3.5" /> Sync Now</>
            )}
          </button>
          <button
            type="button"
            onClick={() => onEdit(instance.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors ml-auto disabled:opacity-50"
          >
            {disconnecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Unplug className="w-3.5 h-3.5" />
            )}
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add CTA card ─────────────────────────────────────────────────────────────

function AddInstanceCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border-2 border-dashed border-border bg-card/50 p-8 flex flex-col items-center justify-center gap-3 text-center hover:border-primary/40 hover:bg-accent/30 transition-all"
    >
      <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center">
        <Plus className="w-5 h-5 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">
          Connect a new n8n instance
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Start monitoring your workflows by connecting a new n8n instance
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium">
        <Plus className="w-4 h-4" /> Add Instance
      </span>
    </button>
  );
}

// ─── Root client component ────────────────────────────────────────────────────

export function InstancesClient({
  initialInstances,
}: {
  initialInstances: N8nInstance[];
}) {
  const [instances, setInstances] = useState<N8nInstance[]>(initialInstances);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingInstance = editingId
    ? instances.find((i) => i.id === editingId) ?? null
    : null;

  function handleAdded(inst: N8nInstance) {
    setInstances((prev) => [...prev, inst]);
    setShowAddModal(false);
  }

  function handleUpdated(updated: N8nInstance) {
    setInstances((prev) =>
      prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)),
    );
    setEditingId(null);
  }

  function handleDisconnected(id: string) {
    setInstances((prev) => prev.filter((i) => i.id !== id));
  }

  function handleSync(id: string, lastSyncedAt: string) {
    setInstances((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, last_synced_at: lastSyncedAt } : i,
      ),
    );
  }

  const connectedCount = instances.filter((i) => i.is_active).length;

  return (
    <>
      {showAddModal && (
        <AddInstanceModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleAdded}
        />
      )}
      {editingInstance && (
        <EditInstanceModal
          instance={editingInstance}
          onClose={() => setEditingId(null)}
          onUpdated={handleUpdated}
        />
      )}

      <div className="flex-1 p-4 md:p-6 space-y-5 animate-fade-in">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm shadow-card">
              <span className="font-semibold text-foreground">
                {instances.length}
              </span>
              <span className="text-muted-foreground">
                Instance{instances.length !== 1 ? "s" : ""}
              </span>
            </div>
            {connectedCount > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-4 py-1.5 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
                <span className="font-semibold text-success">
                  {connectedCount}
                </span>
                <span className="text-success/70">Connected</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-card-hover"
          >
            <Plus className="w-4 h-4" /> Add Instance
          </button>
        </div>

        {/* Instance cards */}
        {instances.length > 0 && (
          <div className="flex flex-col gap-4 animate-slide-in">
            {instances.map((inst) => (
              <InstanceCard
                key={inst.id}
                instance={inst}
                onDisconnect={handleDisconnected}
                onSync={handleSync}
                onEdit={setEditingId}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <AddInstanceCard onClick={() => setShowAddModal(true)} />
      </div>
    </>
  );
}
