import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { getStripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";

// POST /api/billing/checkout
// Creates a Stripe Embedded Checkout session and returns { clientSecret }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ error: "Not available in demo" }, { status: 403 });
  if (session.role !== "owner") return NextResponse.json({ error: "Only the owner can manage billing" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const plan: string = body?.plan ?? "";
  if (plan !== "pro" && plan !== "team") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) {
    logger.error("Stripe price ID not configured", { category: "billing", orgId: session.orgId, plan });
    return NextResponse.json({ error: "Billing not configured. Contact support." }, { status: 500 });
  }

  const db = getServerDb();
  const { data: org } = await db
    .from("organizations")
    .select("plan, stripe_customer_id, stripe_subscription_id")
    .eq("id", session.orgId)
    .single();

  // If already on an active paid plan, they should use the portal instead
  if (org?.stripe_subscription_id && (org?.plan === "pro" || org?.plan === "team")) {
    return NextResponse.json({ error: "You already have an active subscription. Use the portal to manage it." }, { status: 409 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.flowmonix.com";

  try {
    const checkoutSession = await getStripe().checkout.sessions.create({
      ui_mode: "embedded",
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      metadata: { org_id: session.orgId, plan },
      return_url: `${baseUrl}/dashboard/billing?checkout=success`,
      ...(org?.stripe_customer_id
        ? { customer: org.stripe_customer_id }
        : { customer_email: session.email }),
    });

    logger.info("Checkout session created", {
      category: "billing",
      orgId: session.orgId,
      userId: session.userId,
      plan,
      sessionId: checkoutSession.id,
    });

    logActivity(session, "billing.checkout_started", {
      resourceType: "organization",
      resourceId: session.orgId,
      metadata: { plan },
    });

    return NextResponse.json({ clientSecret: checkoutSession.client_secret });
  } catch (err) {
    logger.error("Failed to create checkout session", { category: "billing", orgId: session.orgId, plan, err });
    return NextResponse.json({ error: "Failed to start checkout. Please try again." }, { status: 500 });
  }
}
