import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

export interface ActivityLog {
  id: string;
  org_id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.orgId === "org_demo") {
    return NextResponse.json({ logs: [], total: 0 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const action = searchParams.get("action");

  const db = getServerDb();

  let query = db
    .from("activity_logs")
    .select("*", { count: "exact" })
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (action && action !== "all") {
    query = query.like("action", `${action}.%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[GET /api/logs/activity]", error.message);
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [], total: count ?? 0 });
}
