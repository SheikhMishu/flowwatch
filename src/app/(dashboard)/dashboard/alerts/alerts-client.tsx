"use client";

import React, { useState } from "react";
import {
  Mail, Globe, MessageSquare, Pencil, Trash2, Plus, BellRing,
  X, Loader2, CheckCircle2, AlertCircle, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Alert } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ChannelIcon({ channel }: { channel: Alert["channel"] }) {
  if (channel === "slack") return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-accent">
      <MessageSquare className="w-3.5 h-3.5 text-primary" />
    </span>
  );
  if (channel === "email") return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-warning/10">
      <Mail className="w-3.5 h-3.5 text-warning" />
    </span>
  );
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-muted">
      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
    </span>
  );
}

function channelLabel(channel: Alert["channel"]) {
  return channel.charAt(0).toUpperCase() + channel.slice(1);
}

function destinationPlaceholder(channel: Alert["channel"]) {
  if (channel === "email") return "you@example.com";
  if (channel === "slack") return "https://hooks.slack.com/services/…";
  return "https://your-endpoint.com/webhook";
}

// ─── Alert Modal ─────────────────────────────────────────────────────────────

type ModalMode = "create" | "edit";

interface AlertFormState {
  name: string;
  channel: Alert["channel"];
  destination: string;
  threshold_count: number;
  threshold_minutes: number;
  cooldown_minutes: number;
}

const defaultForm: AlertFormState = {
  name: "",
  channel: "email",
  destination: "",
  threshold_count: 1,
  threshold_minutes: 5,
  cooldown_minutes: 60,
};

function AlertModal({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: ModalMode;
  initial?: Alert;
  onClose: () => void;
  onSaved: (alert: Alert) => void;
}) {
  const [form, setForm] = useState<AlertFormState>(
    initial
      ? {
          name: initial.name,
          channel: initial.channel,
          destination: initial.destination,
          threshold_count: initial.threshold_count,
          threshold_minutes: initial.threshold_minutes,
          cooldown_minutes: initial.cooldown_minutes,
        }
      : defaultForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof AlertFormState>(key: K, value: AlertFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.destination.trim()) return;
    setSaving(true);
    setError("");
    try {
      const url = mode === "edit" && initial ? `/api/alerts/${initial.id}` : "/api/alerts";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      onSaved(data.alert);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  const channels: Alert["channel"][] = ["email", "slack", "webhook"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-elevated animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {mode === "create" ? "Create Alert Rule" : "Edit Alert Rule"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get notified when workflows fail
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
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="alert-name">Alert name</Label>
            <input
              id="alert-name"
              type="text"
              placeholder="Production failures"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              disabled={saving}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-50"
            />
          </div>

          {/* Channel */}
          <div className="space-y-1.5">
            <Label>Notification channel</Label>
            <div className="grid grid-cols-3 gap-2">
              {channels.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  disabled={saving}
                  onClick={() => set("channel", ch)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors capitalize",
                    form.channel === ch
                      ? "border-primary bg-accent text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-1.5">
            <Label htmlFor="alert-dest">
              {form.channel === "email" ? "Email address" : form.channel === "slack" ? "Slack webhook URL" : "Webhook URL"}
            </Label>
            <input
              id="alert-dest"
              type={form.channel === "email" ? "email" : "url"}
              placeholder={destinationPlaceholder(form.channel)}
              value={form.destination}
              onChange={(e) => set("destination", e.target.value)}
              required
              disabled={saving}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-50"
            />
          </div>

          {/* Thresholds */}
          <div className="space-y-1.5">
            <Label>Trigger condition</Label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span>Alert if</span>
              <input
                type="number"
                min={1}
                max={100}
                value={form.threshold_count}
                onChange={(e) => set("threshold_count", parseInt(e.target.value) || 1)}
                disabled={saving}
                className="w-14 rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <span>failure{form.threshold_count !== 1 ? "s" : ""} within</span>
              <input
                type="number"
                min={1}
                max={1440}
                value={form.threshold_minutes}
                onChange={(e) => set("threshold_minutes", parseInt(e.target.value) || 1)}
                disabled={saving}
                className="w-16 rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <span>min</span>
            </div>
          </div>

          {/* Cooldown */}
          <div className="space-y-1.5">
            <Label htmlFor="alert-cooldown">Cooldown (minutes)</Label>
            <p className="text-[11px] text-muted-foreground -mt-0.5">Don&apos;t re-alert for this many minutes after firing</p>
            <input
              id="alert-cooldown"
              type="number"
              min={1}
              max={10080}
              value={form.cooldown_minutes}
              onChange={(e) => set("cooldown_minutes", parseInt(e.target.value) || 60)}
              disabled={saving}
              className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <Button type="submit" disabled={!form.name.trim() || !form.destination.trim() || saving} className="gap-1.5">
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : mode === "create" ? (
                <><CheckCircle2 className="w-4 h-4" /> Create Alert</>
              ) : (
                "Save Changes"
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

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  onEdit,
  onDelete,
  onToggle,
}: {
  alert: Alert;
  onEdit: (a: Alert) => void;
  onDelete: (id: string) => void;
  onToggle: (a: Alert) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete alert "${alert.name}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/alerts/${alert.id}`, { method: "DELETE" });
      if (res.ok) onDelete(alert.id);
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    try {
      const res = await fetch(`/api/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !alert.is_active }),
      });
      const data = await res.json();
      if (res.ok) onToggle(data.alert);
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-card p-5 flex flex-col sm:flex-row sm:items-start gap-4 transition-all", !alert.is_active && "opacity-60")}>
      <div className="shrink-0 pt-0.5">
        <ChannelIcon channel={alert.channel} />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-snug truncate">{alert.name}</h3>
            <button
              type="button"
              onClick={handleToggle}
              disabled={toggling}
              className="shrink-0"
            >
              <Badge variant={alert.is_active ? "success" : "secondary"} className="cursor-pointer hover:opacity-80 transition-opacity">
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", alert.is_active ? "bg-success animate-pulse-dot" : "bg-muted-foreground")} />
                {alert.is_active ? "Active" : "Inactive"}
              </Badge>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(alert)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Delete
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{channelLabel(alert.channel)}</span>
          <span className="text-border">·</span>
          <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 text-foreground truncate">{alert.destination}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
            <BellRing className="w-3 h-3 mr-1 shrink-0" />
            ≥{alert.threshold_count} failure{alert.threshold_count !== 1 ? "s" : ""} in {alert.threshold_minutes}min
          </span>
          <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
            {alert.cooldown_minutes}min cooldown
          </span>
          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs", alert.workflow_id ? "border-primary/20 bg-accent text-primary" : "border-border bg-muted text-muted-foreground")}>
            {alert.workflow_id ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 shrink-0" />Specific workflow</>
            ) : "All workflows"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Root client component ────────────────────────────────────────────────────

export function AlertsClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; alert: Alert } | null>(null);

  function handleSaved(alert: Alert) {
    setAlerts((prev) => {
      const idx = prev.findIndex((a) => a.id === alert.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = alert;
        return next;
      }
      return [alert, ...prev];
    });
    setModal(null);
  }

  function handleDeleted(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  function handleToggled(updated: Alert) {
    setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  const activeCount = alerts.filter((a) => a.is_active).length;
  const inactiveCount = alerts.length - activeCount;

  return (
    <>
      {modal && (
        <AlertModal
          mode={modal.mode}
          initial={modal.mode === "edit" ? modal.alert : undefined}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="flex-1 p-4 md:p-6 space-y-5 animate-fade-in">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm shadow-card">
              <span className="font-semibold text-foreground">{alerts.length}</span>
              <span className="text-muted-foreground">Total</span>
            </div>
            {alerts.length > 0 && (
              <>
                <div className="flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-4 py-1.5 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
                  <span className="font-semibold text-success">{activeCount}</span>
                  <span className="text-success/70">Active</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <span className="font-semibold text-muted-foreground">{inactiveCount}</span>
                  <span className="text-muted-foreground">Inactive</span>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setModal({ mode: "create" })}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-card-hover"
          >
            <Plus className="w-4 h-4" /> Create Alert
          </button>
        </div>

        {/* Alert cards */}
        {alerts.length > 0 ? (
          <div className="flex flex-col gap-3 animate-slide-in">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onEdit={(a) => setModal({ mode: "edit", alert: a })}
                onDelete={handleDeleted}
                onToggle={handleToggled}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <BellRing className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No alerts configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                Get notified when workflows fail by creating your first alert.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModal({ mode: "create" })}
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors mt-2"
            >
              <Plus className="w-4 h-4" /> Create Alert
            </button>
          </div>
        )}
      </div>
    </>
  );
}
