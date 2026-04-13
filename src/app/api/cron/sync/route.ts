import { NextRequest, NextResponse } from "next/server";
import { syncAllInstances } from "@/lib/sync";

// GET /api/cron/sync — Vercel Cron, runs every 5 minutes
// Vercel sets Authorization: Bearer <CRON_SECRET> automatically
export async function GET(req: NextRequest) {
  // In production, Vercel injects CRON_SECRET automatically.
  // In development, skip the check so a local worker script can call freely.
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const results = await syncAllInstances();
    const succeeded = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    console.log(`[cron/sync] ${succeeded} synced, ${failed} failed`);

    return NextResponse.json({ ok: true, synced: succeeded, failed, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    console.error("[cron/sync] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
