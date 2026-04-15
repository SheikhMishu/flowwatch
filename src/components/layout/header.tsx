"use client";

import React from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Sun,
  Moon,
  Bell,
  ChevronDown,
  Check,
  Settings,
  LogOut,
  Server,
  AlertCircle,
  CheckCheck,
  LayoutGrid,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AutoRefreshToggle } from "@/components/dashboard/auto-refresh-toggle";
import { cn } from "@/lib/utils";
import type { N8nInstance } from "@/types";
import type { AppNotification } from "@/app/api/notifications/route";

interface SessionUser {
  userId: string;
  email: string;
  name: string;
  orgId: string;
  orgName: string;
  role: string;
}

export function Header({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [instanceOpen, setInstanceOpen] = React.useState(false);
  const [userOpen, setUserOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [instances, setInstances] = React.useState<N8nInstance[]>([]);
  const [selectedInstance, setSelectedInstance] =
    React.useState<N8nInstance | null>(null);
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [notifications, setNotifications] = React.useState<AppNotification[]>(
    [],
  );
  const [readIds, setReadIds] = React.useState<Set<string>>(new Set());
  const [notifsLoading, setNotifsLoading] = React.useState(false);

  // Background notification fetch — updates the badge without opening the panel
  const fetchNotifications = React.useCallback(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications ?? []))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});

    fetch("/api/instances")
      .then((r) => r.json())
      .then((d) => {
        const list: N8nInstance[] = d.instances ?? [];
        setInstances(list);
        // URL param takes precedence; fall back to last-used instance from localStorage
        const urlInstanceId = searchParams.get("instance");
        let resolvedId = urlInstanceId;
        if (!resolvedId) {
          try {
            resolvedId = localStorage.getItem("fw_selected_instance");
          } catch {}
        }
        const match = resolvedId ? list.find((i) => i.id === resolvedId) : null;
        setSelectedInstance(match ?? null);
        // If we restored from localStorage and the URL doesn't have the param yet, push it
        if (!urlInstanceId && match) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("instance", match.id);
          router.replace(pathname + "?" + params.toString());
        }
      })
      .catch(() => {});

    // Load read IDs from localStorage
    try {
      const stored = localStorage.getItem("fw_read_notifs");
      if (stored) setReadIds(new Set(JSON.parse(stored)));
    } catch {}

    // Initial badge fetch + 60s polling
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  function selectInstance(inst: N8nInstance | null) {
    setSelectedInstance(inst);
    setInstanceOpen(false);
    try {
      if (inst) {
        localStorage.setItem("fw_selected_instance", inst.id);
      } else {
        localStorage.removeItem("fw_selected_instance");
      }
    } catch {}
    const params = new URLSearchParams(searchParams.toString());
    if (inst) {
      params.set("instance", inst.id);
    } else {
      params.delete("instance");
    }
    const qs = params.toString();
    router.push(pathname + (qs ? `?${qs}` : ""));
  }

  function openNotifs() {
    setNotifOpen(true);
    setInstanceOpen(false);
    setUserOpen(false);
    // Panel always shows current notifications; do a fresh fetch only on first open
    // (polling keeps them up-to-date afterwards)
    if (notifications.length === 0) {
      setNotifsLoading(true);
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => setNotifications(d.notifications ?? []))
        .catch(() => {})
        .finally(() => setNotifsLoading(false));
    }
  }

  function markAllRead() {
    const allIds = notifications.map((n) => n.id);
    const next = new Set([...readIds, ...allIds]);
    setReadIds(next);
    try {
      localStorage.setItem("fw_read_notifs", JSON.stringify([...next]));
    } catch {}
  }

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 md:px-6 gap-3 shrink-0 sticky top-0 z-30">
      {/* Page title */}
      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="text-sm font-semibold text-foreground truncate">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Instance selector */}
        <div className="relative">
          <button
            onClick={() => {
              setInstanceOpen(!instanceOpen);
              setUserOpen(false);
              setNotifOpen(false);
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-border bg-background px-2 sm:px-3 py-1.5 text-sm transition-colors hover:bg-secondary",
              instanceOpen && "ring-2 ring-ring",
            )}
          >
            {selectedInstance ? (
              <>
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    selectedInstance.is_active
                      ? "bg-success animate-pulse-dot"
                      : "bg-muted-foreground",
                  )}
                />
                <span className="hidden sm:inline font-medium text-foreground">
                  {selectedInstance.name}
                </span>
              </>
            ) : instances.length === 0 ? (
              <>
                <Server className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden sm:inline text-muted-foreground">
                  No instances
                </span>
              </>
            ) : (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden sm:inline text-muted-foreground">
                  All instances
                </span>
              </>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {instanceOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-border bg-popover shadow-elevated z-50 py-1 animate-fade-in">
              {instances.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <Server className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No instances connected
                  </p>
                </div>
              ) : (
                <>
                  {/* All instances option */}
                  <button
                    onClick={() => selectInstance(null)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 font-medium text-foreground">
                      All instances
                    </span>
                    {!selectedInstance && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </button>
                  <div className="border-t border-border my-1" />
                  {instances.map((inst) => (
                    <button
                      key={inst.id}
                      onClick={() => selectInstance(inst)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          inst.is_active ? "bg-success" : "bg-muted-foreground",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{inst.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {inst.url}
                        </div>
                      </div>
                      {selectedInstance?.id === inst.id && (
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </>
              )}
              <div className="border-t border-border mt-1 pt-1 px-2">
                <button
                  onClick={() => {
                    router.push("/dashboard/instances");
                    setInstanceOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded"
                >
                  {instances.length === 0
                    ? "+ Connect instance"
                    : "Manage instances"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Auto-refresh toggle */}
        <AutoRefreshToggle />

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            onClick={openNotifs}
            className="relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center px-0.5 leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-80 rounded-xl border border-border bg-popover shadow-elevated z-50 animate-fade-in flex flex-col max-h-[420px]">
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <span className="text-sm font-semibold text-foreground">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Panel body */}
              <div className="overflow-y-auto flex-1">
                {notifsLoading ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading…
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
                    <Bell className="w-6 h-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No recent failures
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isRead = readIds.has(n.id);
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          "px-4 py-3 border-b border-border last:border-0 flex items-start gap-3 transition-colors",
                          isRead ? "opacity-50" : "bg-destructive/5",
                        )}
                      >
                        <AlertCircle
                          className={cn(
                            "w-4 h-4 shrink-0 mt-0.5",
                            isRead
                              ? "text-muted-foreground"
                              : "text-destructive",
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {n.workflow_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {n.instance_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatDistanceToNow(parseISO(n.started_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-destructive shrink-0 mt-1" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark mode */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="w-4 h-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Avatar + user menu */}
        <div className="relative">
          <button
            onClick={() => {
              setUserOpen((v) => !v);
              setInstanceOpen(false);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-secondary transition-colors"
          >
            <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <span className="hidden md:block text-sm font-medium text-foreground">
              {user?.name?.split(" ")[0] ?? "…"}
            </span>
            <ChevronDown className="hidden md:block w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-border bg-popover shadow-elevated z-50 py-1 animate-fade-in">
              {user && (
                <>
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-sm font-medium text-foreground">
                      {user.name}.
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {user.orgName} · {user.role}
                    </p>
                  </div>
                </>
              )}
              <button
                onClick={() => {
                  router.push("/dashboard/settings");
                  setUserOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                Settings
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backdrops */}
      {instanceOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setInstanceOpen(false)}
        />
      )}
      {userOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserOpen(false)}
        />
      )}
      {notifOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setNotifOpen(false)}
        />
      )}
    </header>
  );
}
