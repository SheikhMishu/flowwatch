import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { mockIncidents } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.orgId === "org_demo") {
    return NextResponse.json({ incidents: mockIncidents });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const instanceId = searchParams.get("instance");

  const db = getServerDb();
  let query = db
    .from("incidents")
    .select("*")
    .eq("org_id", session.orgId)
    .order("last_seen_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (instanceId) query = query.eq("instance_id", instanceId);

  const { data, error } = await query;
  if (error) {
    console.error("[GET /api/incidents]", error.message);
    return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
  }

  return NextResponse.json({ incidents: data ?? [] });
}
