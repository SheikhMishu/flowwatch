import { NextRequest, NextResponse } from "next/server";
import { runRetention } from "@/lib/retention";
import { logger } from "@/lib/logger";

// GET /api/cron/retention — delete synced_executions beyond each org's plan retention window
// Called by cron-job.org (or Vercel Cron) once per day
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    logger.info("Retention cron started", { category: "retention" });
    const results = await runRetention();

    const totalDeleted = results.reduce((sum, r) => sum + r.deleted, 0);
    const succeeded = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    for (const r of results) {
      if (r.ok && r.deleted > 0) {
        logger.info("Retention: pruned executions", {
          category: "retention",
          orgId: r.orgId,
          plan: r.plan,
          retentionDays: r.retentionDays,
          deleted: r.deleted,
        });
      } else if (!r.ok) {
        logger.error("Retention: org failed", {
          category: "retention",
          orgId: r.orgId,
          err: new Error(r.error ?? "Unknown"),
        });
      }
    }

    logger.info("Retention cron complete", {
      category: "retention",
      totalDeleted,
      succeeded,
      failed,
    });

    return NextResponse.json({ ok: true, totalDeleted, succeeded, failed, results });
  } catch (err) {
    logger.error("Retention cron unhandled error", { category: "retention", err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Retention failed" },
      { status: 500 }
    );
  }
}
