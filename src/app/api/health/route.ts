import { NextResponse } from "next/server";
import { getServerDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const startedAt = Date.now();

export async function GET() {
  const db = getServerDb();

  // Lightweight DB ping — count 0 rows from organizations
  const { error } = await db
    .from("organizations")
    .select("id", { count: "exact", head: true })
    .limit(1);

  const dbOk = !error;

  const body = {
    status: dbOk ? "ok" : "degraded",
    db: dbOk ? "ok" : "error",
    uptime_s: Math.floor((Date.now() - startedAt) / 1000),
    version: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown",
    ts: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
