import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getServerDb();
  const { data: adminUser } = await db
    .from("users")
    .select("is_super_admin")
    .eq("id", session.userId)
    .single();
  if (!adminUser?.is_super_admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") === "system" ? "system" : "activity";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "25", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  if (type === "activity") {
    const { data, count, error } = await db
      .from("activity_logs")
      .select(
        "id, user_email, user_name, action, resource_type, resource_id, ip, created_at",
        { count: "exact" }
      )
      .eq("org_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error)
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });

    return NextResponse.json({ logs: data ?? [], total: count ?? 0 });
  }

  const { data, count, error } = await db
    .from("app_logs")
    .select("id, level, category, message, created_at", { count: "exact" })
    .eq("org_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });

  return NextResponse.json({ logs: data ?? [], total: count ?? 0 });
}
