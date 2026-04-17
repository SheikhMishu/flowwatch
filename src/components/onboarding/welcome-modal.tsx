"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Zap,
} from "lucide-react";
import { FlowMonixMark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type TestStatus = "idle" | "testing" | "ok" | "fail";

export function WelcomeModal({
  userName,
  onDismiss,
}: {
  userName: string;
  onDismiss: (connected: boolean) => void;
}) {
  const firstName = userName.split(" ")[0];

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testError, setTestError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [connected, setConnected] = useState(false);

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
      setConnected(true);
    } catch {
      setSaveError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const canSubmit = name.trim() && url.trim() && apiKey.trim() && !saving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-elevated"
        style={{ animation: "welcomeIn 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-5 text-center border-b border-border">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shrink-0">
            <FlowMonixMark className="w-7 h-7" />
          </div>
          <div>
            {connected ? (
              <>
                <h2 className="text-lg font-bold text-foreground">You&apos;re live, {firstName}!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  FlowMonix is now watching your workflows.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-foreground">Welcome, {firstName}!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your first n8n instance to start monitoring.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Connected success state */}
        {connected ? (
          <div className="px-6 py-6 flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-success" />
            </div>
            <div className="w-full grid grid-cols-3 gap-3 text-center">
              {[
                { icon: Zap, label: "Sync active" },
                { icon: AlertCircle, label: "Alerts ready" },
                { icon: CheckCircle2, label: "Incidents tracked" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-xl border border-border bg-muted/30 p-3 flex flex-col items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-[11px] text-muted-foreground leading-tight">{label}</span>
                </div>
              ))}
            </div>
            <Button className="w-full gap-2" onClick={() => onDismiss(true)}>
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {saveError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {saveError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="wm-name">Instance name</Label>
              <input
                id="wm-name"
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
              <Label htmlFor="wm-url">n8n instance URL</Label>
              <input
                id="wm-url"
                type="url"
                placeholder="https://n8n.yourdomain.com"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setTestStatus("idle"); }}
                required
                disabled={saving}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wm-key">API key</Label>
              <div className="relative">
                <input
                  id="wm-key"
                  type={showKey ? "text" : "password"}
                  placeholder="n8n_api_••••••••"
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setTestStatus("idle"); }}
                  required
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
              <p className="text-[11px] text-muted-foreground">
                n8n → Settings → API → Create an API key
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={!url.trim() || !apiKey.trim() || testStatus === "testing" || saving}
                className="gap-1.5"
              >
                {testStatus === "testing" ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing…</>
                ) : (
                  "Test connection"
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

            <div className="flex flex-col gap-2 pt-1 border-t border-border">
              <Button type="submit" disabled={!canSubmit} className="w-full gap-2">
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                ) : (
                  <>Connect instance <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
              <button
                type="button"
                onClick={() => onDismiss(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Skip for now — I&apos;ll do this later
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
