"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  Zap,
  Building2,
  Rocket,
  Star,
  X,
  CreditCard,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { formatDistanceToNow } from "date-fns";
import type { PlanLimits, PlanId } from "@/lib/plans";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null!,
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillingStatus {
  plan: PlanId;
  planStatus: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  hasSubscription: boolean;
  usage: { instances: number; members: number };
  limits: PlanLimits;
}

interface PlanDef {
  id: PlanId;
  name: string;
  price: number | null;
  description: string;
  color: string;
  badge: string | null;
  features: string[];
}

const PLANS: PlanDef[] = [
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
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function BillingClient({ initial }: { initial: BillingStatus }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billing, setBilling] = React.useState(initial);
  const [checkoutClientSecret, setCheckoutClientSecret] = React.useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = React.useState<PlanId | null>(null);
  const [portalLoading, setPortalLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [justUpgraded, setJustUpgraded] = React.useState(
    searchParams.get("checkout") === "success",
  );

  // Remove ?checkout=success from URL without reloading
  React.useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("checkout");
      router.replace("/dashboard/billing" + (params.toString() ? `?${params}` : ""));
      // Re-fetch billing status so the new plan shows immediately
      fetch("/api/billing/status")
        .then((r) => r.json())
        .then((d) => {
          if (!d.error) setBilling(d as BillingStatus);
        })
        .catch(() => {});
    }
  }, []);

  async function handleUpgrade(planId: PlanId) {
    setError(null);
    setCheckoutLoading(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start checkout");
        return;
      }
      setCheckoutClientSecret(data.clientSecret);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setError(null);
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to open portal");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  function closeCheckout() {
    setCheckoutClientSecret(null);
    setError(null);
  }

  const { plan, planStatus, currentPeriodEnd, hasSubscription, usage, limits } = billing;

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 animate-fade-in max-w-5xl">

      {/* Success banner */}
      {justUpgraded && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Subscription activated!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your plan has been upgraded. It may take a moment to reflect.
            </p>
          </div>
          <button
            onClick={() => setJustUpgraded(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="flex-1 text-sm text-foreground">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Current plan banner */}
      <CurrentPlanBanner
        plan={plan}
        planStatus={planStatus}
        currentPeriodEnd={currentPeriodEnd}
        hasSubscription={hasSubscription}
        onManage={handlePortal}
        portalLoading={portalLoading}
      />

      {/* Usage */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Current usage</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <UsageCard
            label="Instances"
            used={usage.instances}
            limit={limits.instances}
            unit="instance"
          />
          <UsageCard
            label="Team members"
            used={usage.members}
            limit={limits.members ?? 999}
            unit="member"
            isUnlimited={limits.members === null}
          />
          <UsageCard
            label="History retention"
            used={limits.retentionDays}
            limit={limits.retentionDays}
            unit="days"
            isFlat
          />
        </div>
      </div>

      {/* Plans */}
      <div id="plans">
        <h3 className="text-sm font-semibold text-foreground mb-3">Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              currentPlan={plan}
              hasSubscription={hasSubscription}
              loading={checkoutLoading === p.id}
              onUpgrade={handleUpgrade}
              onManage={handlePortal}
              portalLoading={portalLoading}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Payments powered by Stripe. Cancel anytime. All prices in AUD.
        </p>
      </div>

      {/* Enterprise */}
      <div className="rounded-xl border border-border bg-card shadow-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Building2 className="w-8 h-8 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground">Enterprise</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Custom instance limits, SSO, white-label, audit logs, SLA, and
            dedicated support. Contact us for pricing.
          </p>
        </div>
        <a
          href="mailto:hello@flowmonix.com"
          className="inline-flex items-center gap-1.5 border border-border bg-background hover:bg-secondary rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors shrink-0"
        >
          Contact sales
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Embedded Checkout Modal */}
      {checkoutClientSecret && (
        <CheckoutModal
          clientSecret={checkoutClientSecret}
          onClose={closeCheckout}
        />
      )}
    </div>
  );
}

// ─── Current plan banner ──────────────────────────────────────────────────────

function CurrentPlanBanner({
  plan,
  planStatus,
  currentPeriodEnd,
  hasSubscription,
  onManage,
  portalLoading,
}: {
  plan: PlanId;
  planStatus: string;
  currentPeriodEnd: string | null;
  hasSubscription: boolean;
  onManage: () => void;
  portalLoading: boolean;
}) {
  const planName = plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Team";

  const statusBadge = (() => {
    if (planStatus === "active" || planStatus === "trialing")
      return { label: "Active", className: "bg-success/10 border-success/20 text-success" };
    if (planStatus === "canceling")
      return { label: "Canceling", className: "bg-warning/10 border-warning/20 text-warning" };
    if (planStatus === "past_due")
      return { label: "Past due", className: "bg-destructive/10 border-destructive/20 text-destructive" };
    if (planStatus === "canceled")
      return { label: "Canceled", className: "bg-muted border-border text-muted-foreground" };
    return { label: "Active", className: "bg-success/10 border-success/20 text-success" };
  })();

  const PlanIcon: LucideIcon = plan === "team" ? Building2 : plan === "pro" ? Zap : Rocket;

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
        <PlanIcon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base font-bold text-foreground">{planName} Plan</h2>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>
        {plan === "free" ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            Upgrade to unlock more instances, longer history, Slack alerts, and AI debugging.
          </p>
        ) : currentPeriodEnd ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            {planStatus === "canceling"
              ? `Cancels ${formatDistanceToNow(new Date(currentPeriodEnd), { addSuffix: true })}`
              : `Renews ${formatDistanceToNow(new Date(currentPeriodEnd), { addSuffix: true })}`}
          </p>
        ) : null}
      </div>
      {hasSubscription ? (
        <button
          onClick={onManage}
          disabled={portalLoading}
          className="inline-flex items-center gap-1.5 border border-border bg-background hover:bg-secondary rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors shrink-0 disabled:opacity-60"
        >
          <CreditCard className="w-3.5 h-3.5" />
          {portalLoading ? "Opening…" : "Manage subscription"}
        </button>
      ) : (
        <a
          href="#plans"
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors shrink-0"
        >
          View plans
        </a>
      )}
    </div>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  currentPlan,
  hasSubscription,
  loading,
  onUpgrade,
  onManage,
  portalLoading,
}: {
  plan: PlanDef;
  currentPlan: PlanId;
  hasSubscription: boolean;
  loading: boolean;
  onUpgrade: (p: PlanId) => void;
  onManage: () => void;
  portalLoading: boolean;
}) {
  const isCurrent = plan.id === currentPlan;
  const isDowngrade =
    (currentPlan === "team" && plan.id === "pro") ||
    (currentPlan === "pro" && plan.id === "free") ||
    (currentPlan === "team" && plan.id === "free");

  const ctaLabel = (() => {
    if (isCurrent) return "Current plan";
    if (plan.id === "free") return "Downgrade to Free";
    if (isDowngrade) return "Downgrade";
    return `Upgrade to ${plan.name}`;
  })();

  function handleClick() {
    if (isCurrent) return;
    if (plan.id === "free" || isDowngrade) {
      // Downgrade via portal
      onManage();
      return;
    }
    onUpgrade(plan.id);
  }

  return (
    <div
      className={`rounded-xl border-2 bg-card shadow-card p-5 flex flex-col relative ${plan.color} ${plan.id === "pro" ? "shadow-elevated" : ""}`}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold whitespace-nowrap">
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
            <span className="text-3xl font-black text-foreground">
              ${plan.price}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </span>
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
        disabled={isCurrent || loading || (isDowngrade && portalLoading)}
        onClick={handleClick}
        className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-default ${
          isCurrent
            ? "border border-border bg-secondary text-muted-foreground cursor-default"
            : plan.id === "pro" && !isDowngrade
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : plan.id === "team" && !isDowngrade
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "border border-border bg-background text-foreground hover:bg-secondary"
        }`}
      >
        {loading ? "Starting…" : ctaLabel}
      </button>
    </div>
  );
}

// ─── Usage card ───────────────────────────────────────────────────────────────

function UsageCard({
  label,
  used,
  limit,
  unit,
  isFlat,
  isUnlimited,
}: {
  label: string;
  used: number;
  limit: number;
  unit: string;
  isFlat?: boolean;
  isUnlimited?: boolean;
}) {
  const pct = isFlat || isUnlimited ? 100 : Math.min(Math.round((used / limit) * 100), 100);
  const isNearLimit = !isUnlimited && !isFlat && pct >= 80;

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-4">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <p className="text-2xl font-bold text-foreground tabular-nums mb-1">
        {used}{" "}
        <span className="text-sm font-normal text-muted-foreground">
          / {isUnlimited ? "∞" : `${limit} ${unit}${limit !== 1 ? "s" : ""}`}
        </span>
      </p>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isNearLimit ? "bg-warning" : "bg-primary"}`}
          style={{ width: `${isUnlimited ? 30 : pct}%` }}
        />
      </div>
      {isNearLimit && (
        <p className="text-[11px] text-warning mt-1">Near limit — consider upgrading</p>
      )}
    </div>
  );
}

// ─── Checkout modal ───────────────────────────────────────────────────────────

function CheckoutModal({
  clientSecret,
  onClose,
}: {
  clientSecret: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-elevated overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Complete your upgrade
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Embedded Checkout */}
        <div className="max-h-[75vh] overflow-y-auto">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}
