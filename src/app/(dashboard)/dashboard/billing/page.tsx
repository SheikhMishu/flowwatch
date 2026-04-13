import React from "react";
import { Check, Zap, Building2, Rocket, ArrowRight, Star } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { Header } from "@/components/layout/header";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: null,
    description: "For individuals getting started",
    color: "border-border",
    badge: null,
    features: [
      "1 n8n instance",
      "7-day execution history",
      "Basic failure alerts (email)",
      "Workflow health dashboard",
      "Up to 2 team members",
    ],
    limits: { instances: 1, retention: "7 days", members: 2 },
    cta: "Current plan",
    ctaVariant: "outline" as const,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    description: "For teams running production workflows",
    color: "border-primary",
    badge: "Most popular",
    features: [
      "Up to 5 n8n instances",
      "30-day execution history",
      "Email + Slack alerts",
      "AI error debugging",
      "Up to 10 team members",
      "Priority support",
    ],
    limits: { instances: 5, retention: "30 days", members: 10 },
    cta: "Upgrade to Pro",
    ctaVariant: "primary" as const,
  },
  {
    id: "team",
    name: "Team",
    price: 99,
    description: "For agencies managing multiple clients",
    color: "border-border",
    badge: null,
    features: [
      "Up to 10 n8n instances",
      "90-day execution history",
      "All alert channels",
      "Unlimited AI debugging",
      "Unlimited team members",
      "On-call rotation",
      "Weekly digest reports",
      "Dedicated support",
    ],
    limits: { instances: 10, retention: "90 days", members: "Unlimited" },
    cta: "Upgrade to Team",
    ctaVariant: "outline" as const,
  },
];

async function getUsage(orgId: string) {
  const db = getServerDb();
  const [{ count: instanceCount }, { count: memberCount }] = await Promise.all([
    db.from("n8n_instances").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("is_active", true),
    db.from("organization_members").select("id", { count: "exact", head: true }).eq("org_id", orgId),
  ]);
  return { instances: instanceCount ?? 0, members: memberCount ?? 0 };
}

export default async function BillingPage() {
  const session = await getSession();
  const isDemo = !session || session.orgId === "org_demo";

  const usage = isDemo
    ? { instances: 1, members: 3 }
    : await getUsage(session!.orgId).catch(() => ({ instances: 0, members: 1 }));

  const currentPlan = "free"; // TODO: read from organizations.plan when Stripe is wired

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Billing" />
      <div className="flex-1 p-4 md:p-6 space-y-6 animate-fade-in max-w-5xl">

        {/* Current plan banner */}
        <div className="rounded-xl border border-border bg-card shadow-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-foreground">Free Plan</h2>
              <span className="inline-flex items-center rounded-full bg-success/10 border border-success/20 px-2.5 py-0.5 text-xs font-semibold text-success">Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">You are on the Free plan. Upgrade to unlock more instances, longer history, and Slack alerts.</p>
          </div>
          <a
            href="#plans"
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors shrink-0"
          >
            View plans <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Usage */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Current usage</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <UsageCard label="Instances" used={usage.instances} limit={1} unit="instance" />
            <UsageCard label="Team members" used={usage.members} limit={2} unit="member" />
            <UsageCard label="History retention" used={7} limit={7} unit="days" isFlat />
          </div>
        </div>

        {/* Plans */}
        <div id="plans">
          <h3 className="text-sm font-semibold text-foreground mb-3">Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border-2 bg-card shadow-card p-5 flex flex-col relative ${plan.color} ${plan.id === "pro" ? "shadow-elevated" : ""}`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold">
                      <Star className="w-3 h-3" /> {plan.badge}
                    </span>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      {plan.id === "free" && <Rocket className="w-4 h-4 text-muted-foreground" />}
                      {plan.id === "pro" && <Zap className="w-4 h-4 text-primary" />}
                      {plan.id === "team" && <Building2 className="w-4 h-4 text-muted-foreground" />}
                      <h4 className="text-base font-bold text-foreground">{plan.name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                    <div className="mt-3">
                      {plan.price ? (
                        <span className="text-3xl font-black text-foreground">${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                      ) : (
                        <span className="text-3xl font-black text-foreground">Free</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={isCurrent}
                    className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isCurrent
                        ? "border border-border bg-secondary text-muted-foreground cursor-default"
                        : plan.id === "pro"
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border bg-background text-foreground hover:bg-secondary"
                    }`}
                  >
                    {isCurrent ? "Current plan" : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">Payments powered by Stripe. Cancel anytime. All prices in USD.</p>
        </div>

        {/* Enterprise */}
        <div className="rounded-xl border border-border bg-card shadow-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Building2 className="w-8 h-8 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground">Enterprise</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Custom instance limits, SSO, white-label, audit logs, SLA, and dedicated support. Contact us for pricing.</p>
          </div>
          <a
            href="mailto:hello@flowwatch.app"
            className="inline-flex items-center gap-1.5 border border-border bg-background hover:bg-secondary rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors shrink-0"
          >
            Contact sales
          </a>
        </div>

      </div>
    </div>
  );
}

function UsageCard({ label, used, limit, unit, isFlat }: { label: string; used: number; limit: number; unit: string; isFlat?: boolean }) {
  const pct = isFlat ? 100 : Math.min(Math.round((used / limit) * 100), 100);
  const isNearLimit = pct >= 80;
  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-4">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <p className="text-2xl font-bold text-foreground tabular-nums mb-1">
        {used} <span className="text-sm font-normal text-muted-foreground">/ {limit} {unit}{limit !== 1 ? "s" : ""}</span>
      </p>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isNearLimit ? "bg-warning" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isNearLimit && !isFlat && (
        <p className="text-[11px] text-warning mt-1">Near limit — consider upgrading</p>
      )}
    </div>
  );
}
