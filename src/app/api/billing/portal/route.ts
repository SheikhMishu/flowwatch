import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

// POST /api/billing/portal
// Creates a Stripe Customer Portal session and returns { url }
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ error: "Not available in demo" }, { status: 403 });
  if (session.role !== "owner") return NextResponse.json({ error: "Only the owner can manage billing" }, { status: 403 });

  const db = getServerDb();
  const { data: org } = await db
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", session.orgId)
    .single();

  if (!org?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account found. Please subscribe first." }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${baseUrl}/dashboard/billing`,
    });

    logger.info("Portal session created", {
      category: "billing",
      orgId: session.orgId,
      userId: session.userId,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    logger.error("Failed to create portal session", { category: "billing", orgId: session.orgId, err });
    return NextResponse.json({ error: "Failed to open billing portal. Please try again." }, { status: 500 });
  }
}
