import { notFound } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
} from "lucide-react";
import { FlowMonixMark } from "@/components/brand/mark";
import { AutoRefresh } from "./_components/auto-refresh";

export const dynamic = "force-dynamic";

interface InstanceStatus {
  name: string;
  status: "operational" | "degraded" | "issue" | "unknown";
  last_synced_at: string | null;
}

interface StatusData {
  org: { name: string; slug: string };
  instances: InstanceStatus[];
  open_incidents: number;
  checked_at: string;
}

async function getStatusData(slug: string): Promise<StatusData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/status/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Never synced";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

const STATUS_CONFIG = {
  operational: {
    label: "Operational",
    Icon: CheckCircle2,
    dot: "bg-success animate-pulse-dot",
    badge: "bg-success/15 text-success border-success/25",
    iconColor: "text-success",
  },
  degraded: {
    label: "Degraded",
    Icon: AlertTriangle,
    dot: "bg-warning",
    badge: "bg-warning/15 text-warning border-warning/25",
    iconColor: "text-warning",
  },
  issue: {
    label: "Issue Detected",
    Icon: XCircle,
    dot: "bg-destructive",
    badge: "bg-destructive/15 text-destructive border-destructive/25",
    iconColor: "text-destructive",
  },
  unknown: {
    label: "Not Synced",
    Icon: Clock,
    dot: "bg-muted-foreground/40",
    badge: "bg-muted text-muted-foreground border-border",
    iconColor: "text-muted-foreground",
  },
};

function overallStatus(
  instances: InstanceStatus[],
  openIncidents: number,
): "operational" | "degraded" | "issue" | "unknown" {
  if (instances.length === 0) return "unknown";
  if (openIncidents > 0 || instances.some((i) => i.status === "issue"))
    return "issue";
  if (instances.some((i) => i.status === "degraded")) return "degraded";
  if (instances.every((i) => i.status === "unknown")) return "unknown";
  return "operational";
}

const OVERALL_BANNER = {
  operational: {
    text: "All systems operational",
    sub: "Everything is running smoothly.",
    bg: "bg-success/10 border-success/20",
    textColor: "text-success",
  },
  degraded: {
    text: "Some systems degraded",
    sub: "We are aware and investigating.",
    bg: "bg-warning/10 border-warning/20",
    textColor: "text-warning",
  },
  issue: {
    text: "Active incident",
    sub: "We are actively investigating the issue.",
    bg: "bg-destructive/10 border-destructive/20",
    textColor: "text-destructive",
  },
  unknown: {
    text: "Status unknown",
    sub: "Awaiting first sync from connected instances.",
    bg: "bg-muted border-border",
    textColor: "text-muted-foreground",
  },
};

export default async function StatusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getStatusData(slug);
  if (!data) notFound();

  const { org, instances, open_incidents, checked_at } = data;
  const overall = overallStatus(instances, open_incidents);
  const banner = OVERALL_BANNER[overall];
  const overallCfg = STATUS_CONFIG[overall];
  const OverallIcon = overallCfg.Icon;

  return (
    // Force dark mode so the page uses dark design tokens regardless of system preference
    <div className="dark">
      <div className="min-h-screen bg-background text-foreground antialiased">
        <AutoRefresh />

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="border-b border-border">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <FlowMonixMark className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                {org.name}
              </span>
              <span className="text-muted-foreground/40 text-sm mx-0.5">/</span>
              <span className="text-sm text-muted-foreground">Status</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="w-3.5 h-3.5" />
              <span>
                Updated {formatTime(checked_at)} | refreshes every 60s
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-10 space-y-6 animate-fade-in">
          {/* ── Overall status banner ───────────────────────────── */}
          <div
            className={`rounded-xl border px-5 py-5 flex items-center gap-4 ${banner.bg}`}
          >
            <div className="shrink-0">
              <OverallIcon className={`w-8 h-8 ${overallCfg.iconColor}`} />
            </div>
            <div>
              <p className={`text-lg font-semibold ${banner.textColor}`}>
                {banner.text}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {banner.sub}
              </p>
            </div>
          </div>

          {/* ── Instances ──────────────────────────────────────── */}
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Instances
              </p>
            </div>

            {instances.length === 0 ? (
              <div className="px-5 py-6 text-sm text-muted-foreground">
                No instances configured.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {instances.map((inst) => {
                  const cfg = STATUS_CONFIG[inst.status];
                  const Icon = cfg.Icon;
                  return (
                    <div
                      key={inst.name}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`}
                        />
                        <span className="text-sm font-medium text-foreground truncate">
                          {inst.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {formatRelative(inst.last_synced_at)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.badge}`}
                        >
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Active incidents notice ─────────────────────────── */}
          {open_incidents > 0 && (
            <div className="rounded-xl border border-destructive/25 bg-destructive/8 px-5 py-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  {open_incidents} Active Incident
                  {open_incidents !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Our team is investigating. This page refreshes automatically.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="border-t border-border mt-16">
          <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground/50">Powered by</span>
            <a
              href="https://flowmonix.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 group"
            >
              <div className="w-4 h-4 rounded gradient-primary flex items-center justify-center">
                <FlowMonixMark className="w-2.5 h-2.5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                FlowMonix
              </span>
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
