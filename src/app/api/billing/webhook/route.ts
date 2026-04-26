import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/db";
import { getStripe, planFromPriceId } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import type Stripe from "stripe";

// POST /api/billing/webhook
// Stripe sends events here. Auth is via Stripe signature, NOT JWT.
// This route is whitelisted in middleware.ts.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET not set", { category: "billing" });
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    logger.warn("Stripe webhook signature verification failed", { category: "billing", err });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getServerDb();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        if (cs.mode !== "subscription" || !cs.subscription || !cs.customer) break;

        const orgId = cs.metadata?.org_id;
        const plan = cs.metadata?.plan;
        if (!orgId || !plan) break;

        // Fetch subscription to get period end (v22: period is on items)
        const sub = await getStripe().subscriptions.retrieve(cs.subscription as string);
        const periodEndTs = sub.items.data[0]?.current_period_end;
        const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null;

        await db.from("organizations").update({
          plan,
          plan_status: sub.status,
          stripe_customer_id: cs.customer as string,
          stripe_subscription_id: cs.subscription as string,
          current_period_end: periodEnd,
        }).eq("id", orgId);

        logger.info("Subscription activated via checkout", {
          category: "billing",
          orgId,
          plan,
          subId: cs.subscription,
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        // Determine plan from price ID
        const priceId = sub.items.data[0]?.price?.id;
        const plan = priceId ? (planFromPriceId(priceId) ?? "free") : "free";
        const periodEndTs = sub.items.data[0]?.current_period_end;
        const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null;

        // Handle cancellation at period end — status stays "active" until then
        const planStatus = sub.cancel_at_period_end ? "canceling" : sub.status;

        await db.from("organizations").update({
          plan: sub.status === "canceled" ? "free" : plan,
          plan_status: planStatus,
          stripe_subscription_id: sub.id,
          current_period_end: periodEnd,
        }).eq("stripe_customer_id", customerId);

        logger.info("Subscription updated", {
          category: "billing",
          customerId,
          plan,
          status: sub.status,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        await db.from("organizations").update({
          plan: "free",
          plan_status: "canceled",
          stripe_subscription_id: null,
          current_period_end: null,
        }).eq("stripe_customer_id", customerId);

        logger.info("Subscription deleted — org downgraded to free", {
          category: "billing",
          customerId,
          subId: sub.id,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await db.from("organizations").update({
          plan_status: "past_due",
        }).eq("stripe_customer_id", customerId);

        logger.warn("Invoice payment failed", { category: "billing", customerId });
        break;
      }

      default:
        // Unhandled event — not an error, just ignore
        break;
    }
  } catch (err) {
    logger.error("Webhook handler error", { category: "billing", eventType: event.type, err });
    // Return 500 so Stripe retries on transient failures (DB down, etc.).
    // All DB writes are idempotent so duplicate delivery is safe.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
