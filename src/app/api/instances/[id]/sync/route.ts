import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { syncInstance } from "@/lib/sync";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";

// POST /api/instances/[id]/sync — test connection + full data sync
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ error: "Not available in demo" }, { status: 403 });

  const { id } = await params;
  logger.info("Manual instance sync started", { category: "sync", orgId: session.orgId, instanceId: id });
  const result = await syncInstance(id, session.orgId);

  if (!result.ok) {
    logger.error("Manual instance sync failed", { category: "sync", orgId: session.orgId, instanceId: id, error: result.error });
    logActivity(session, "instance.synced", {
      resourceType: "instance",
      resourceId: id,
      metadata: { ok: false, error: result.error },
    });
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  logger.info("Manual instance sync complete", {
    category: "sync",
    orgId: session.orgId,
    instanceId: id,
    workflowsUpserted: result.workflowsUpserted,
    executionsUpserted: result.executionsUpserted,
  });
  logActivity(session, "instance.synced", {
    resourceType: "instance",
    resourceId: id,
    metadata: { ok: true, workflowsUpserted: result.workflowsUpserted, executionsUpserted: result.executionsUpserted },
  });

  // Return last_synced_at + counts so the UI can show what was synced
  const { getServerDb } = await import("@/lib/db");
  const db = getServerDb();
  const { data: inst } = await db
    .from("n8n_instances")
    .select("last_synced_at")
    .eq("id", id)
    .single();

  return NextResponse.json({
    ok: true,
    last_synced_at: inst?.last_synced_at ?? new Date().toISOString(),
    workflowsUpserted: result.workflowsUpserted,
    executionsUpserted: result.executionsUpserted,
  });
}
