import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";

async function getAlertForOrg(id: string, orgId: string) {
  const db = getServerDb();
  const { data } = await db
    .from("alerts")
    .select("id")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();
  return data;
}

// PATCH /api/alerts/[id] — update alert rule
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "viewer") return NextResponse.json({ error: "Viewers cannot edit alerts" }, { status: 403 });

  const { id } = await params;
  const existing = await getAlertForOrg(id, session.orgId);
  if (!existing) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

  const body = await req.json();
  const allowed = ["name", "channel", "destination", "threshold_count", "threshold_minutes", "cooldown_minutes", "workflow_id", "instance_id", "is_active", "snoozed_until"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (updates.name) updates.name = (updates.name as string).trim();
  if (updates.destination) updates.destination = (updates.destination as string).trim();
  if (updates.channel && !["email", "slack", "webhook"].includes(updates.channel as string)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  const db = getServerDb();
  const { data, error } = await db
    .from("alerts")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to update alert", { category: "alert-engine", orgId: session.orgId, alertId: id, err: error });
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }

  logger.info("Alert updated", { category: "alert-engine", orgId: session.orgId, alertId: id });
  logActivity(session, "alert.updated", {
    resourceType: "alert",
    resourceId: id,
    metadata: { updatedFields: Object.keys(updates) },
  });
  return NextResponse.json({ alert: data });
}

// DELETE /api/alerts/[id] — delete alert rule
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "viewer") return NextResponse.json({ error: "Viewers cannot delete alerts" }, { status: 403 });

  const { id } = await params;
  const existing = await getAlertForOrg(id, session.orgId);
  if (!existing) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

  const db = getServerDb();
  const { error } = await db.from("alerts").delete().eq("id", id);
  if (error) {
    logger.error("Failed to delete alert", { category: "alert-engine", orgId: session.orgId, alertId: id, err: error });
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }

  logger.info("Alert deleted", { category: "alert-engine", orgId: session.orgId, alertId: id });
  logActivity(session, "alert.deleted", {
    resourceType: "alert",
    resourceId: id,
  });

  return NextResponse.json({ ok: true });
}
