"use client";

import React, { useState } from "react";
import {
  User,
  Bell,
  Shield,
  AlertTriangle,
  Monitor,
  Download,
  Trash2,
  Camera,
  Key,
  Smartphone,
  Users,
  Mail,
  X,
  Check,
  Loader2,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Inline iOS-style Toggle ─────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={cn(
        "relative inline-flex w-10 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shrink-0",
        on ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        className="block w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 absolute top-1"
        style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

// ─── Shared input style ───────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-shadow";

// ─── Section card wrapper ─────────────────────────────────────────────────────

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-card p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

// ─── 1. Profile Section ───────────────────────────────────────────────────────

function ProfileSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Load session data on mount
  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name ?? "");
          setEmail(data.user.email ?? "");
          setIsDemo(data.user.orgId === "org_demo");
        }
      })
      .catch(() => {/* ignore */});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setErrorMsg("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to save profile");
        setStatus("error");
        return;
      }
      setName(data.user.name);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  const initials = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <Card>
      <SectionHeader
        icon={User}
        title="Profile"
        description="Manage your personal information"
      />

      {/* Avatar row */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md">
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Profile photo</p>
          <p className="text-xs text-muted-foreground mb-2">
            JPG, PNG or GIF. Max 2MB.
          </p>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled>
            <Camera className="w-3.5 h-3.5" />
            Change photo
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Full name</Label>
            <input
              id="profile-name"
              type="text"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={loading || isDemo}
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email address</Label>
            <input
              id="profile-email"
              type="email"
              className={cn(inputClass, "opacity-60 cursor-not-allowed")}
              value={email}
              readOnly
              placeholder="you@example.com"
              title="Email cannot be changed"
            />
          </div>
        </div>

        {status === "error" && (
          <p className="text-xs text-destructive">{errorMsg}</p>
        )}

        {isDemo && (
          <p className="text-xs text-muted-foreground">Profile editing is disabled in demo mode.</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          {status === "success" && (
            <span className="flex items-center gap-1 text-xs text-success">
              <Check className="w-3.5 h-3.5" />
              Profile saved
            </span>
          )}
          <Button
            type="submit"
            size="sm"
            className="min-w-[120px]"
            disabled={loading || isDemo || !name.trim()}
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving&hellip;</>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ─── 2. Notifications Section ─────────────────────────────────────────────────

type NotifKey =
  | "emailAlerts"
  | "slackNotifications"
  | "weeklyDigest"
  | "incidentEscalations";

const NOTIF_ROWS: {
  key: NotifKey;
  label: string;
  description: string;
  default: boolean;
}[] = [
  {
    key: "emailAlerts",
    label: "Email alerts",
    description: "Receive alert notifications via email",
    default: true,
  },
  {
    key: "slackNotifications",
    label: "Slack notifications",
    description: "Send alerts to your configured Slack channel",
    default: true,
  },
  {
    key: "weeklyDigest",
    label: "Weekly digest",
    description: "Summary of workflow performance every Monday",
    default: false,
  },
  {
    key: "incidentEscalations",
    label: "Incident escalations",
    description: "Notify when an incident goes unresolved for 1h",
    default: true,
  },
];

function NotificationsSection() {
  const [prefs, setPrefs] = useState<Record<NotifKey, boolean>>({
    emailAlerts: true,
    slackNotifications: true,
    weeklyDigest: false,
    incidentEscalations: true,
  });

  function toggle(key: NotifKey) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <Card>
      <SectionHeader
        icon={Bell}
        title="Notifications"
        description="Choose how and when you receive alerts"
      />

      <div className="space-y-1">
        {NOTIF_ROWS.map((row, idx) => (
          <React.Fragment key={row.key}>
            {idx > 0 && <Separator className="my-1" />}
            <div className="flex items-center justify-between py-3 gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {row.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {row.description}
                </p>
              </div>
              <Toggle on={prefs[row.key]} onToggle={() => toggle(row.key)} />
            </div>
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
}

// ─── 3. Security Section ──────────────────────────────────────────────────────

const MOCK_SESSIONS = [
  {
    id: "s1",
    label: "Chrome on macOS",
    location: "New York, US",
    lastActive: "just now",
    current: true,
  },
  {
    id: "s2",
    label: "Firefox on Windows",
    location: "San Francisco, US",
    lastActive: "2 hours ago",
    current: false,
  },
];

function SecuritySection() {
  const [pwSaved, setPwSaved] = useState(false);

  function handlePwSave(e: React.FormEvent) {
    e.preventDefault();
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2000);
  }

  return (
    <Card>
      <SectionHeader
        icon={Shield}
        title="Security"
        description="Manage your password, sessions, and two-factor authentication"
      />

      {/* Change Password */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Change Password
          </h3>
        </div>

        <form onSubmit={handlePwSave} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="current-pw">Current password</Label>
            <input
              id="current-pw"
              type="password"
              className={inputClass}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-pw">New password</Label>
              <input
                id="new-pw"
                type="password"
                className={inputClass}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw">Confirm password</Label>
              <input
                id="confirm-pw"
                type="password"
                className={inputClass}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" size="sm" className="min-w-[130px]">
              {pwSaved ? "Saved!" : "Save Password"}
            </Button>
          </div>
        </form>
      </div>

      <Separator className="my-5" />

      {/* Active Sessions */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Active Sessions
          </h3>
        </div>

        <div className="space-y-2">
          {MOCK_SESSIONS.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {session.label}
                    </p>
                    {session.current && (
                      <span className="shrink-0 inline-flex items-center rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.location} · Last active: {session.lastActive}
                  </p>
                </div>
              </div>
              {!session.current && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-destructive hover:text-destructive hover:border-destructive/50"
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-5" />

      {/* 2FA */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Smartphone className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Two-Factor Authentication
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4 ml-6">
          Add an extra layer of security to your account by requiring a one-time
          code in addition to your password.
        </p>
        <div className="ml-6 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Disabled
          </span>
          <Button type="button" variant="outline" size="sm">
            Enable 2FA
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── 3b. Team Section ─────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = { owner: "Owner", admin: "Admin", viewer: "Viewer" };
const ROLE_COLORS: Record<string, string> = {
  owner: "bg-primary/10 text-primary",
  admin: "bg-warning/15 text-warning",
  viewer: "bg-muted text-muted-foreground",
};

interface Member { id: string; name: string; email: string; role: string; user_id: string; }

function memberInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function TeamSection() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "viewer">("viewer");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "success" | "error">("idle");
  const [inviteError, setInviteError] = useState("");

  React.useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) {
        setCurrentUserId(d.user.userId);
        setCurrentRole(d.user.role);
        setIsDemo(d.user.orgId === "org_demo");
      }
    }).catch(() => {});
    fetch("/api/org/members").then((r) => r.json()).then((d) => {
      if (d.members) setMembers(d.members);
    }).catch(() => {});
  }, []);

  const canManage = currentRole === "owner" || currentRole === "admin";

  async function handleRoleChange(memberId: string, newRole: string) {
    setLoadingId(memberId);
    try {
      const res = await fetch(`/api/org/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Remove ${name} from the workspace?`)) return;
    setLoadingId(memberId);
    try {
      const res = await fetch(`/api/org/members/${memberId}`, { method: "DELETE" });
      if (res.ok) setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } finally {
      setLoadingId(null);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteStatus("idle");
    setInviteError("");
    try {
      const res = await fetch("/api/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) { setInviteError(data.error || "Failed to send invitation"); setInviteStatus("error"); return; }
      setInviteStatus("success");
      setInviteEmail("");
      setTimeout(() => { setShowInvite(false); setInviteStatus("idle"); }, 2000);
    } catch {
      setInviteError("Something went wrong. Please try again.");
      setInviteStatus("error");
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <Card>
      <SectionHeader icon={Users} title="Team" description="Manage members and invite teammates to your workspace" />

      <div className="space-y-1 mb-5">
        {members.length === 0 && !isDemo && (
          <p className="text-sm text-muted-foreground py-2">Loading members…</p>
        )}
        {isDemo && (
          <p className="text-xs text-muted-foreground mb-3">Team management is disabled in demo mode.</p>
        )}
        {members.map((member, idx) => {
          const isSelf = member.user_id === currentUserId;
          const isOwner = member.role === "owner";
          const busy = loadingId === member.id;
          return (
            <React.Fragment key={member.id}>
              {idx > 0 && <Separator className="my-1" />}
              <div className="flex items-center gap-3 py-2.5">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {memberInitials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.name} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>

                {/* Role — dropdown for non-owners when current user can manage */}
                {canManage && !isOwner && !isSelf ? (
                  <select
                    value={member.role}
                    disabled={busy}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className="text-xs border border-border rounded-md bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 cursor-pointer"
                  >
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <span className={cn("shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", ROLE_COLORS[member.role])}>
                    {ROLE_LABELS[member.role]}
                  </span>
                )}

                {/* Remove button */}
                {canManage && !isOwner && !isSelf && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleRemove(member.id, member.name)}
                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                    title="Remove member"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Invite form */}
      {!isDemo && (!showInvite ? (
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setShowInvite(true)}>
          <Mail className="w-3.5 h-3.5" /> Invite teammate
        </Button>
      ) : (
        <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3 animate-fade-in">
          <p className="text-sm font-medium text-foreground">Send invitation</p>
          {inviteStatus === "success" ? (
            <div className="flex items-center gap-2 text-sm text-success"><Check className="w-4 h-4" /> Invitation sent!</div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-3">
              {inviteStatus === "error" && <p className="text-xs text-destructive">{inviteError}</p>}
              <div className="flex gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="invite-email" className="text-xs">Email</Label>
                  <input id="invite-email" type="email" required placeholder="teammate@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className={cn(inputClass, "h-9 text-sm")} disabled={inviteLoading} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-role" className="text-xs">Role</Label>
                  <select id="invite-role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "admin" | "viewer")} disabled={inviteLoading} className={cn(inputClass, "h-9 text-sm pr-2 cursor-pointer")}>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={inviteLoading || !inviteEmail.trim()} className="gap-1.5">
                  {inviteLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</> : <>Send invite</>}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setShowInvite(false); setInviteEmail(""); setInviteStatus("idle"); }} disabled={inviteLoading}>Cancel</Button>
              </div>
            </form>
          )}
        </div>
      ))}
    </Card>
  );
}

// ─── 4. Status Page Section ───────────────────────────────────────────────────

function StatusPageSection() {
  const [slug, setSlug] = React.useState("");
  const [enabled, setEnabled] = React.useState(false);
  const [isOwner, setIsOwner] = React.useState(false);
  const [isDemo, setIsDemo] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowmonix.com";

  React.useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) {
        setIsOwner(d.user.role === "owner");
        setIsDemo(d.user.orgId === "org_demo");
      }
    }).catch(() => {});

    setLoading(true);
    fetch("/api/org/status-page").then((r) => r.json()).then((d) => {
      setSlug(d.slug ?? "");
      setEnabled(d.status_page_enabled ?? false);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus("idle");
    setErrorMsg("");
    try {
      const res = await fetch("/api/org/status-page", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug.trim(), status_page_enabled: enabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to save");
        setStatus("error");
        return;
      }
      setSlug(data.slug ?? "");
      setEnabled(data.status_page_enabled);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  const publicUrl = slug ? `${appUrl}/status/${slug}` : null;
  const canEdit = isOwner && !isDemo;

  return (
    <Card>
      <SectionHeader
        icon={Globe}
        title="Public Status Page"
        description="Share a public URL with clients showing your instance health and open incidents"
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading…
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">

          {/* Enable toggle */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Enable status page</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Make your status page publicly accessible
              </p>
            </div>
            <Toggle on={enabled} onToggle={() => canEdit && setEnabled((v) => !v)} />
          </div>

          {/* Slug input */}
          <div className="space-y-1.5">
            <Label htmlFor="status-slug">Page URL slug</Label>
            <div className="flex items-center gap-0 rounded-lg border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring">
              <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r border-input shrink-0 select-none">
                /status/
              </span>
              <input
                id="status-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="your-org-name"
                disabled={!canEdit || saving}
                maxLength={48}
                className="flex-1 bg-background px-3 py-2 text-sm text-foreground focus:outline-none placeholder:text-muted-foreground disabled:opacity-60"
              />
            </div>
            <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only. Min 3 characters.</p>
          </div>

          {/* Preview link */}
          {publicUrl && enabled && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {publicUrl}
            </a>
          )}

          {/* Not owner notice */}
          {!isOwner && !isDemo && (
            <p className="text-xs text-muted-foreground">Only the workspace owner can manage the status page.</p>
          )}
          {isDemo && (
            <p className="text-xs text-muted-foreground">Status page is not available in demo mode.</p>
          )}

          {status === "error" && (
            <p className="text-xs text-destructive">{errorMsg}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            {status === "success" && (
              <span className="flex items-center gap-1 text-xs text-success">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
            <Button
              type="submit"
              size="sm"
              className="min-w-[120px]"
              disabled={!canEdit || saving || slug.trim().length < 3}
            >
              {saving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

// ─── 5. Danger Zone ───────────────────────────────────────────────────────────

function DangerZoneSection() {
  return (
    <Card className="border-destructive/30">
      <SectionHeader
        icon={AlertTriangle}
        title="Danger Zone"
        description="Irreversible actions — proceed with caution"
      />

      {/* Export Data */}
      <div className="flex items-start justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Export Data</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Download a full archive of your workflows, executions, and account
            data in JSON format.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </div>

      <Separator className="my-1" />

      {/* Delete Account */}
      <div className="flex items-start justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Delete Account</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="shrink-0 gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Account
        </Button>
      </div>
    </Card>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export function SettingsForms() {
  return (
    <>
      <ProfileSection />
      <NotificationsSection />
      <TeamSection />
      <StatusPageSection />
      <SecuritySection />
      <DangerZoneSection />
    </>
  );
}
