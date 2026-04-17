import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { getPlanLimits } from "@/lib/plans";
import { logger } from "@/lib/logger";

// GET /api/billing/status
// Returns org plan, status, usage, and limits for the billing page.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.orgId === "org_demo") {
    return NextResponse.json({
      plan: "free",
      planStatus: "active",
      currentPeriodEnd: null,
      stripeCustomerId: null,
      hasSubscription: false,
      usage: { instances: 1, members: 3 },
      limits: getPlanLimits("free"),
    });
  }

  const db = getServerDb();

  try {
    const [orgResult, instanceResult, memberResult] = await Promise.all([
      db.from("organizations")
        .select("plan, plan_status, current_period_end, stripe_customer_id, stripe_subscription_id")
        .eq("id", session.orgId)
        .single(),
      db.from("n8n_instances")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .eq("is_active", true),
      db.from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId),
    ]);

    const org = orgResult.data;
    const plan = org?.plan ?? "free";

    return NextResponse.json({
      plan,
      planStatus: org?.plan_status ?? "active",
      currentPeriodEnd: org?.current_period_end ?? null,
      stripeCustomerId: org?.stripe_customer_id ?? null,
      hasSubscription: !!org?.stripe_subscription_id,
      usage: {
        instances: instanceResult.count ?? 0,
        members: memberResult.count ?? 0,
      },
      limits: getPlanLimits(plan),
    });
  } catch (err) {
    logger.error("Failed to fetch billing status", { category: "billing", orgId: session.orgId, err });
    return NextResponse.json({ error: "Failed to load billing status" }, { status: 500 });
  }
}
