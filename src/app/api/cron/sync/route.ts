import { NextRequest, NextResponse } from "next/server";
import { syncAllInstances } from "@/lib/sync";
import { logger } from "@/lib/logger";

// GET /api/cron/sync — called by cron-job.org every 5 minutes
// Requires: Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  // In production, cron-job.org sends the CRON_SECRET in the Authorization header.
  // In development, skip the check so the local sync-worker script can call freely.
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    logger.info("Cron sync started", { category: "cron" });
    const results = await syncAllInstances();
    const succeeded = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    for (const r of results) {
      if (r.ok) {
        logger.info("Cron sync: instance synced", {
          category: "cron",
          instanceId: r.instanceId,
          workflowsUpserted: r.workflowsUpserted,
          executionsUpserted: r.executionsUpserted,
        });
      } else {
        logger.error("Cron sync: instance failed", {
          category: "cron",
          instanceId: r.instanceId,
          err: new Error(r.error ?? "Sync failed"),
        });
      }
    }

    logger.info("Cron sync complete", { category: "cron", succeeded, failed });
    return NextResponse.json({ ok: true, synced: succeeded, failed, results });
  } catch (err) {
    logger.error("Cron sync unhandled error", { category: "cron", err });
    return NextResponse.json({ error: err instanceof Error ? err.message : "Sync failed" }, { status: 500 });
  }
}
