import React from "react";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { getPlanLimits } from "@/lib/plans";
import { Header } from "@/components/layout/header";
import { BillingClient } from "./billing-client";
import type { PlanId } from "@/lib/plans";

async function getBillingStatus(orgId: string) {
  const db = getServerDb();
  const [orgResult, instanceResult, memberResult] = await Promise.all([
    db.from("organizations")
      .select("plan, plan_status, current_period_end, stripe_customer_id, stripe_subscription_id")
      .eq("id", orgId)
      .single(),
    db.from("n8n_instances")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("is_active", true),
    db.from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId),
  ]);

  if (orgResult.error) throw orgResult.error;
  const org = orgResult.data;
  const plan = (org?.plan ?? "free") as PlanId;

  return {
    plan,
    planStatus: (org?.plan_status ?? "active") as string,
    currentPeriodEnd: org?.current_period_end ?? null,
    stripeCustomerId: org?.stripe_customer_id ?? null,
    hasSubscription: !!org?.stripe_subscription_id,
    usage: {
      instances: instanceResult.count ?? 0,
      members: memberResult.count ?? 0,
    },
    limits: getPlanLimits(plan),
  };
}

export default async function BillingPage() {
  const session = await getSession();
  const isDemo = !session || session.orgId === "org_demo";

  const billing = isDemo
    ? {
        plan: "free" as PlanId,
        planStatus: "active",
        currentPeriodEnd: null,
        stripeCustomerId: null,
        hasSubscription: false,
        usage: { instances: 1, members: 3 },
        limits: getPlanLimits("free"),
      }
    : await getBillingStatus(session!.orgId).catch(() => ({
        plan: "free" as PlanId,
        planStatus: "active",
        currentPeriodEnd: null,
        stripeCustomerId: null,
        hasSubscription: false,
        usage: { instances: 0, members: 1 },
        limits: getPlanLimits("free"),
      }));

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Billing" />
      <BillingClient initial={billing} />
    </div>
  );
}
