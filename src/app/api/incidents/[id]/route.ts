import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ error: "Demo mode" }, { status: 403 });
  if (session.role === "viewer") return NextResponse.json({ error: "Viewers cannot update incidents" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { status } = body as { status?: string };

  if (!status || !["open", "investigating", "resolved"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = getServerDb();

  // Fetch current status so we can log the transition
  const { data: existing } = await db
    .from("incidents")
    .select("status")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .single();
  const oldStatus = existing?.status ?? "unknown";

  const update: Record<string, unknown> = { status };
  if (status === "resolved") update.resolved_at = new Date().toISOString();

  const { data, error } = await db
    .from("incidents")
    .update(update)
    .eq("id", id)
    .eq("org_id", session.orgId)
    .select()
    .single();

  if (error) {
    logger.error("Failed to update incident status", { category: "incident", orgId: session.orgId, incidentId: id, err: error });
    return NextResponse.json({ error: "Failed to update incident" }, { status: 500 });
  }

  logger.info("Incident status changed", { category: "incident", orgId: session.orgId, incidentId: id, from: oldStatus, to: status });
  logActivity(session, "incident.status_changed", {
    resourceType: "incident",
    resourceId: id,
    metadata: { from: oldStatus, to: status },
  });

  return NextResponse.json({ incident: data });
}
