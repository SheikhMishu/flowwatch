import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { getPlanLimits } from "@/lib/plans";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";

// GET /api/alerts — list org's alert rules
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ alerts: [] });

  const db = getServerDb();
  const { data, error } = await db
    .from("alerts")
    .select("*")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  return NextResponse.json({ alerts: data ?? [] });
}

// POST /api/alerts — create alert rule
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ error: "Not available in demo" }, { status: 403 });
  if (session.role === "viewer") return NextResponse.json({ error: "Viewers cannot create alerts" }, { status: 403 });

  const body = await req.json();
  const { name, channel, destination, threshold_count, threshold_minutes, cooldown_minutes, workflow_id, instance_id } = body;

  if (!name?.trim() || !channel || !destination?.trim()) {
    return NextResponse.json({ error: "Name, channel, and destination are required" }, { status: 400 });
  }
  if (!["email", "slack", "webhook"].includes(channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  const db = getServerDb();

  // Enforce plan alert-rule limit and channel restrictions
  const [{ data: orgData }, { count: alertCount }] = await Promise.all([
    db.from("organizations").select("plan").eq("id", session.orgId).single(),
    db.from("alerts").select("id", { count: "exact", head: true }).eq("org_id", session.orgId).eq("is_active", true),
  ]);
  const plan = orgData?.plan ?? "free";
  const limits = getPlanLimits(plan);

  if (limits.alertRules !== null && (alertCount ?? 0) >= limits.alertRules) {
    return NextResponse.json(
      {
        error: `Your ${plan} plan allows up to ${limits.alertRules} alert rule${limits.alertRules !== 1 ? "s" : ""}. Upgrade to add more.`,
        limitReached: true,
        currentPlan: plan,
      },
      { status: 403 }
    );
  }
  if (channel === "slack" && !limits.slackAlerts) {
    return NextResponse.json(
      { error: "Slack alerts require a Pro or Team plan.", limitReached: true, currentPlan: plan },
      { status: 403 }
    );
  }
  const { data, error } = await db
    .from("alerts")
    .insert({
      org_id: session.orgId,
      instance_id: instance_id ?? null,
      workflow_id: workflow_id ?? null,
      name: name.trim(),
      channel,
      destination: destination.trim(),
      threshold_count: threshold_count ?? 1,
      threshold_minutes: threshold_minutes ?? 5,
      cooldown_minutes: cooldown_minutes ?? 60,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to create alert", { category: "alert-engine", orgId: session.orgId, err: error });
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }

  logger.info("Alert created", { category: "alert-engine", orgId: session.orgId, alertId: data.id, alertName: name });
  logActivity(session, "alert.created", {
    resourceType: "alert",
    resourceId: data.id,
    metadata: { name, channel },
  });
  return NextResponse.json({ alert: data }, { status: 201 });
}
