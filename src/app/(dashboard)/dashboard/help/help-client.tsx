"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Server,
  Workflow,
  ListChecks,
  AlertTriangle,
  Bell,
  Users,
  CreditCard,
  Shield,
  Sparkles,
  Globe,
  BarChart3,
  ScrollText,
  Zap,
  HelpCircle,
  Loader2,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

// --- Types ---

interface Article {
  id: string;
  title: string;
  body: string;
  tags?: string[];
}

interface Section {
  id: string;
  icon: React.ElementType;
  label: string;
  articles: Article[];
}

// --- Content data ---

const SECTIONS: Section[] = [
  {
    id: "getting-started",
    icon: Zap,
    label: "Getting Started",
    articles: [
      {
        id: "gs-connect",
        title: "How to connect your n8n instance",
        tags: ["connect", "instance", "api key", "setup"],
        body: "Go to Instances in the sidebar and click Add Instance. You need three things: a name for the instance, the base URL of your n8n install (e.g. https://n8n.yourcompany.com), and an API key from n8n.\n\nTo get your n8n API key: open n8n, go to Settings, then API, and create a new key. Copy it and paste it into FlowMonix. It is encrypted immediately using AES-256-GCM.\n\nAfter saving, click Test Connection to confirm credentials work, then Sync Now to pull in your workflows and recent executions.",
      },
      {
        id: "gs-demo",
        title: "Trying the demo without signing up",
        tags: ["demo", "trial", "test"],
        body: "On the login page, enter demo@flowmonix.com and use PIN 123456. This gives you a full tour of the product with realistic mock data - no sign-up or n8n instance required.\n\nDemo mode is read-only. Changes you make (alerts, instances, etc.) are not saved.",
      },
      {
        id: "gs-first-sync",
        title: "What happens during the first sync",
        tags: ["sync", "first time", "workflows", "executions"],
        body: "When you click Sync Now on an instance, FlowMonix fetches all your workflows and the most recent executions from n8n. For any failed executions, it also pulls the full error details in parallel.\n\nAfter the initial sync, FlowMonix automatically re-syncs every 5 minutes in the background. You will see the Last synced timestamp update on the Instances page.",
      },
    ],
  },
  {
    id: "instances",
    icon: Server,
    label: "Instances",
    articles: [
      {
        id: "inst-manage",
        title: "Adding, editing, and removing instances",
        tags: ["instance", "add", "edit", "remove", "disconnect"],
        body: "Add: Go to Instances and click Add Instance. Enter a name, your n8n base URL, and API key.\n\nEdit: Click the Edit button on any instance card to update the name, URL, or API key. Re-entering the API key re-encrypts it with the current encryption key.\n\nRemove: Click Disconnect. You will be asked to confirm before anything is deleted.",
      },
      {
        id: "inst-limits",
        title: "Instance limits per plan",
        tags: ["plan", "limit", "instances", "upgrade"],
        body: "Free plan: 1 instance.\nPro plan ($29/mo): up to 5 instances.\nTeam plan ($99/mo): up to 10 instances.\n\nIf you try to add an instance beyond your plan limit, you will see a prompt to upgrade. Instance limits are enforced server-side.",
      },
      {
        id: "inst-health",
        title: "What the instance health indicator means",
        tags: ["health", "status", "sync", "active"],
        body: "The green dot next to an instance name means it synced successfully within the last 15 minutes.\n\nIf the dot is grey, the instance has not synced recently - either the sync is failing (check System Logs) or the cron has not run yet after you connected it.\n\nThe Last synced timestamp on the Instances page tells you exactly when the most recent successful sync happened.",
      },
    ],
  },
  {
    id: "workflows",
    icon: Workflow,
    label: "Workflows",
    articles: [
      {
        id: "wf-list",
        title: "Browsing and filtering workflows",
        tags: ["workflow", "filter", "search", "list"],
        body: "The Workflows page lists every workflow across all connected instances. Use the instance selector in the top bar to filter to a specific instance.\n\nEach workflow shows its active/inactive status, success rate, last execution time, and total execution count.",
      },
      {
        id: "wf-detail",
        title: "Viewing a workflow's execution history",
        tags: ["workflow", "history", "executions", "detail"],
        body: "Click on any workflow to open its detail page. You will see a full execution history for that workflow - status, duration, trigger type, and when it finished.\n\nClick any execution row to expand it inline and see what happened without leaving the page.",
      },
    ],
  },
  {
    id: "executions",
    icon: ListChecks,
    label: "Executions",
    articles: [
      {
        id: "exec-inline",
        title: "Using the inline execution panel",
        tags: ["execution", "inline", "expand", "detail", "panel"],
        body: "Click any row in the Executions list to expand an inline panel - no page navigation needed.\n\nFor failed executions: the panel lazy-loads the node timeline showing the 2 nodes before the failure and the failed node itself, plus an Analyze with AI button.\n\nFor successful executions: the panel shows duration, trigger type, and finish time. Click View full execution for the complete node-by-node breakdown.",
      },
      {
        id: "exec-detail",
        title: "Reading the full execution detail page",
        tags: ["execution", "node", "error", "detail", "timeline"],
        body: "The full execution detail page shows:\n\nError card (for failures): error type, the node that failed, node type, the error message, additional error description, and the input data that was passed to the failed node.\n\nNode timeline: every node that ran, with its type, duration, and output item count.\n\nThis is the most complete view of what happened in an execution.",
      },
      {
        id: "exec-retry",
        title: "Retrying a failed execution",
        tags: ["retry", "execution", "re-run"],
        body: "On the execution detail page, click Retry on the error card to re-run the execution in n8n. You can also retry from an incident card if the incident has a linked execution.\n\nRetry calls the n8n retry endpoint directly. The result will appear in your next sync (within 5 minutes) or you can trigger a manual sync from the Instances page.",
      },
    ],
  },
  {
    id: "incidents",
    icon: AlertTriangle,
    label: "Incidents",
    articles: [
      {
        id: "inc-what",
        title: "What is an incident and how are they created",
        tags: ["incident", "create", "auto", "grouping"],
        body: "An incident is a grouped cluster of related failures. FlowMonix creates incidents two ways:\n\n1. When an alert rule fires - the alert engine opens or updates an incident linked to that alert.\n\n2. Automatically during sync - if multiple executions fail with the same error signature within a 15-minute window, they are grouped into one incident instead of flooding you with individual failures.\n\nThis means one noisy workflow will not generate 50 separate incidents.",
      },
      {
        id: "inc-lifecycle",
        title: "Incident lifecycle: open, investigating, resolved",
        tags: ["incident", "status", "resolve", "lifecycle"],
        body: "Open: a new incident, not yet acknowledged.\nInvestigating: someone has looked at it and is working on it.\nResolved: the issue is fixed.\n\nFlowMonix also auto-resolves incidents after 30 minutes of no new failures with that error signature - you do not have to manually close every incident.",
      },
      {
        id: "inc-frequency",
        title: "What does the frequency label mean",
        tags: ["incident", "frequency", "failures", "count"],
        body: "Each incident card shows a label like 5 failures in 12 min. This tells you how many executions failed with this exact error pattern in the detection window.\n\nA high frequency like 23 failures in 4 min usually means a scheduled workflow is running frequently and hitting a persistent error - worth investigating immediately.",
      },
    ],
  },
  {
    id: "alerts",
    icon: Bell,
    label: "Alerts",
    articles: [
      {
        id: "alert-create",
        title: "Creating an alert rule",
        tags: ["alert", "create", "rule", "threshold"],
        body: "Go to Alerts and click New Alert. Configure:\n\nWorkflow: which workflow to watch (or all workflows on an instance).\nThreshold: how many failures within how many minutes trigger the alert.\nCooldown: how long to wait before firing the same alert again.\nChannel: Email, Slack, or a custom webhook URL.\n\nAlerts require owner or admin role - viewers cannot create or modify alerts.",
      },
      {
        id: "alert-slack",
        title: "Setting up Slack alerts",
        tags: ["slack", "alert", "webhook", "notification"],
        body: "Slack alerts are available on Pro and Team plans.\n\nTo set one up: in Slack, go to your workspace settings, then Apps, then Incoming Webhooks, and create a new webhook for a channel. Copy the webhook URL and paste it into the alert Slack channel field.\n\nFlowMonix sends Block Kit formatted messages to Slack including the workflow name, instance, error summary, and a link to the execution.",
      },
      {
        id: "alert-cooldown",
        title: "Alert cooldown - why am I not getting notified every time",
        tags: ["alert", "cooldown", "notification", "silence"],
        body: "When an alert fires, FlowMonix records the timestamp and will not fire that alert again until the cooldown period passes.\n\nThis prevents alert fatigue. If a workflow is failing every minute, you do not want 60 emails per hour - you want one alert, investigate, fix it.\n\nIf you want to be alerted on every failure with no cooldown, set the cooldown to 0 minutes.",
      },
    ],
  },
  {
    id: "ai",
    icon: Sparkles,
    label: "AI Debugging",
    articles: [
      {
        id: "ai-how",
        title: "How AI debugging works",
        tags: ["ai", "debug", "explain", "error"],
        body: "Click Analyze with AI on any failed execution or incident. FlowMonix sends the error message, error type, failed node name, and node type to an AI model.\n\nThe response is cached per unique error signature - so the second time you see the same error on any workflow, the explanation loads instantly without making another API call.",
      },
      {
        id: "ai-tiers",
        title: "Free vs Pro AI responses",
        tags: ["ai", "free", "pro", "upgrade", "structured"],
        body: "Free plan: general explanation of what the error means and likely causes.\n\nPro and Team plans: structured response with three sections - Root Cause (exactly what went wrong), Fix Steps (numbered action items), and Prevention (how to avoid it in future).",
      },
    ],
  },
  {
    id: "team",
    icon: Users,
    label: "Team & Roles",
    articles: [
      {
        id: "team-invite",
        title: "Inviting a team member",
        tags: ["invite", "team", "member", "add"],
        body: "Go to Settings, then Team, then Invite Member. Enter their email and choose a role (Admin or Viewer). They will receive an invite email with a link valid for 7 days.\n\nThe invite link takes them through a short PIN verification - they do not need an existing FlowMonix account. After verifying, they land directly in your workspace.",
      },
      {
        id: "team-roles",
        title: "What each role can do",
        tags: ["role", "owner", "admin", "viewer", "permissions"],
        body: "Owner: full access including billing and status page settings. Only one owner per workspace.\n\nAdmin: can manage instances, create/edit/delete alerts, invite and remove members. Cannot access billing.\n\nViewer: read-only access. Can view all data, retry executions, and use AI debugging. Cannot create alerts, manage instances, or invite people.\n\nOnly owners and admins can change member roles.",
      },
      {
        id: "team-remove",
        title: "Removing a team member",
        tags: ["remove", "member", "team", "kick"],
        body: "Go to Settings, then Team and click the remove button next to the member. You will be asked to confirm. The member will lose access to the workspace immediately on next page load.",
      },
    ],
  },
  {
    id: "status-page",
    icon: Globe,
    label: "Status Page",
    articles: [
      {
        id: "sp-setup",
        title: "Setting up your public status page",
        tags: ["status page", "public", "slug", "setup"],
        body: "Go to Settings, then Status Page. Toggle it on and choose a slug (e.g. your company name). Your page will be available at flowmonix.com/status/your-slug with no login required.\n\nThe status page shows instance health derived from last sync time, and the number of open incidents. It auto-refreshes every 60 seconds.\n\nStatus page management is owner-only.",
      },
      {
        id: "sp-health",
        title: "How instance health is calculated on the status page",
        tags: ["status page", "health", "operational", "degraded"],
        body: "Health is based on how long since the last successful sync:\n\nOperational: synced within the last 15 minutes.\nDegraded: synced 15 to 60 minutes ago.\nIssue: last sync was more than 60 minutes ago.\nUnknown: instance has never synced.\n\nThis reflects whether FlowMonix can reach your n8n instance, not whether your workflows are succeeding.",
      },
    ],
  },
  {
    id: "billing",
    icon: CreditCard,
    label: "Billing",
    articles: [
      {
        id: "bill-upgrade",
        title: "Upgrading your plan",
        tags: ["upgrade", "billing", "pro", "team", "stripe"],
        body: "Go to Billing in the sidebar. Click Upgrade on the plan you want. Payment is handled by Stripe - you enter your card details in a secure form embedded directly in the page.\n\nOnly the workspace owner can manage billing.",
      },
      {
        id: "bill-manage",
        title: "Updating payment details or cancelling",
        tags: ["billing", "cancel", "payment", "manage"],
        body: "Go to Billing and click Manage Subscription. This opens the Stripe Customer Portal where you can update your payment method, view invoices, or cancel your subscription.\n\nIf you cancel, your plan stays active until the end of the current billing period. After that, you are moved to the Free plan.",
      },
      {
        id: "bill-limits",
        title: "What happens when you hit a plan limit",
        tags: ["limit", "plan", "instances", "blocked"],
        body: "If you try to add more instances than your plan allows, you will see a prompt to upgrade. The action is blocked at the API level.\n\nData retention limits are enforced by a daily cleanup job. Executions older than your plan retention window are automatically deleted.",
      },
    ],
  },
  {
    id: "security",
    icon: Shield,
    label: "Security & Privacy",
    articles: [
      {
        id: "sec-keys",
        title: "How FlowMonix stores your n8n API keys",
        tags: ["security", "api key", "encryption", "privacy"],
        body: "Your n8n API keys are encrypted with AES-256-GCM before being stored in the database. The encryption key is never stored in the database - it lives as an environment variable on the server.\n\nIf you ever suspect a key is compromised, go to Instances, click Edit, and re-enter a new API key. This re-encrypts it immediately.",
      },
      {
        id: "sec-auth",
        title: "How authentication works",
        tags: ["auth", "pin", "login", "session", "security"],
        body: "FlowMonix uses PIN-based authentication - no passwords to manage or leak. When you log in, we send a 6-digit code to your email. Enter it and you are in. Sessions last 7 days.\n\nThere are no passwords in the database - only hashed PINs that expire after use.",
      },
      {
        id: "sec-data",
        title: "What data FlowMonix stores",
        tags: ["data", "privacy", "store", "retain"],
        body: "FlowMonix stores: workflow names, IDs, and active/inactive status; execution metadata including status, duration, trigger, start and end times, error messages; full error details for failed executions including failed node, error type, error description, and input data to the failed node.\n\nFlowMonix does NOT store your workflow logic, your n8n credentials (other than the API key, encrypted), or data that flows through successful executions.\n\nData is retained per your plan (7, 30, or 90 days) and deleted automatically after that.",
      },
    ],
  },
  {
    id: "logs",
    icon: ScrollText,
    label: "Logs",
    articles: [
      {
        id: "log-activity",
        title: "Activity log - what actions are tracked",
        tags: ["activity", "log", "audit", "trail"],
        body: "The Activity log records every significant action taken in your workspace: connecting and disconnecting instances, inviting and removing members, creating and deleting alerts, billing events, and more.\n\nEach entry shows who did it, what they did, and when. Available to owners and admins only.",
      },
      {
        id: "log-system",
        title: "System errors log",
        tags: ["system", "log", "error", "sync", "debug"],
        body: "The System Errors tab shows internal application errors such as sync failures, alert delivery errors, or DB write failures. These are useful if you are investigating why a sync did not complete or why an alert did not fire.\n\nAvailable to owners and admins only.",
      },
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    label: "Analytics",
    articles: [
      {
        id: "ana-overview",
        title: "What the analytics page shows",
        tags: ["analytics", "chart", "success rate", "volume"],
        body: "The Analytics page shows execution volume over time as a chart, broken down by success and failure. Use it to spot trends - like a spike in failures after a deployment, or a drop in execution volume suggesting a workflow stopped triggering.\n\nFilter by instance using the instance selector in the top bar.",
      },
    ],
  },
];

// --- Search helpers ---

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/\W/g, " ");
}

function scoreArticle(article: Article, query: string): number {
  const q = normalizeText(query);
  const words = q.split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const titleN = normalizeText(article.title);
  const bodyN = normalizeText(article.body);
  const tagsN = (article.tags ?? []).map(normalizeText).join(" ");
  let total = 0;
  for (const w of words) {
    if (titleN.includes(w)) total += 3;
    if (tagsN.includes(w)) total += 2;
    if (bodyN.includes(w)) total += 1;
  }
  return total;
}

function highlightText(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-foreground rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

// --- ArticleView ---

function ArticleView({ article, query }: { article: Article; query: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length > 1) {
      setOpen(scoreArticle(article, query) > 0);
    } else {
      setOpen(false);
    }
  }, [query, article]);

  const paragraphs = article.body.split("\n\n");

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-secondary/60 transition-colors"
      >
        <span className="text-sm font-medium text-foreground">{article.title}</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2.5 border-t border-border bg-background/40">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed pt-3">
              {highlightText(p, query)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// --- SectionView ---

function SectionView({
  section,
  query,
  defaultOpen,
}: {
  section: Section;
  query: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const Icon = section.icon;

  const visibleArticles = useMemo(() => {
    if (!query.trim()) return section.articles;
    return section.articles.filter((a) => scoreArticle(a, query) > 0);
  }, [query, section.articles]);

  useEffect(() => {
    if (query.trim().length > 1) {
      setOpen(visibleArticles.length > 0);
    } else {
      setOpen(defaultOpen ?? false);
    }
  }, [query, visibleArticles.length, defaultOpen]);

  if (query.trim().length > 1 && visibleArticles.length === 0) return null;

  const articleCount = visibleArticles.length;
  const countLabel = articleCount === 1 ? "1 article" : articleCount + " articles";

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-secondary/40 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="flex-1 text-sm font-semibold text-foreground">{section.label}</span>
        <span className="text-xs text-muted-foreground mr-2">{countLabel}</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-2 border-t border-border pt-4">
          {visibleArticles.map((a) => (
            <ArticleView key={a.id} article={a} query={query} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Contact form ---

const CONTACT_SUBJECTS = [
  "General inquiry",
  "Technical support",
  "Billing / subscription",
  "Feature request",
  "Bug report",
  "Other",
];

function ContactForm({ userEmail }: { userEmail: string }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !message) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setError("Network error — please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-4">
        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-5 h-5 text-success" />
        </div>
        <p className="text-sm font-medium text-foreground">Message sent!</p>
        <p className="text-xs text-muted-foreground mt-1">
          We&apos;ll reply to <span className="font-medium">{userEmail}</span> within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-4">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Subject</label>
        <select
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow appearance-none cursor-pointer"
        >
          <option value="" disabled>Select a topic...</option>
          {CONTACT_SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Message</label>
        <textarea
          required
          rows={4}
          placeholder="Describe your question or issue..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send message"
        )}
      </button>
    </form>
  );
}

// --- Main export ---

export function HelpClient({ userEmail }: { userEmail: string }) {
  const [query, setQuery] = useState("");

  const totalArticles = SECTIONS.reduce((n, s) => n + s.articles.length, 0);

  const hasResults = useMemo(() => {
    if (!query.trim()) return true;
    return SECTIONS.some((s) => s.articles.some((a) => scoreArticle(a, query) > 0));
  }, [query]);

  return (
    <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full space-y-6">

      <div className="rounded-xl border border-border bg-card shadow-card p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Documentation</h2>
            <p className="text-xs text-muted-foreground">{totalArticles} articles across {SECTIONS.length} topics</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder='Search e.g. "retry execution", "invite member", "slack alerts"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-16 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!hasResults && (
        <div className="text-center py-12 text-muted-foreground space-y-2">
          <Search className="w-8 h-8 mx-auto opacity-40" />
          <p className="text-sm">No articles found for &ldquo;{query}&rdquo;</p>
          <button onClick={() => setQuery("")} className="text-xs text-primary hover:underline">
            Clear search
          </button>
        </div>
      )}

      {hasResults && (
        <div className="space-y-3">
          {SECTIONS.map((section, i) => (
            <SectionView
              key={section.id}
              section={section}
              query={query}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-card p-5">
        <div className="flex items-start gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Contact support</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We reply within one business day.
              {userEmail && (
                <> Reply goes to <span className="font-medium">{userEmail}</span>.</>
              )}
            </p>
          </div>
        </div>
        <ContactForm userEmail={userEmail} />
      </div>

    </div>
  );
}
