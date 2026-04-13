import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

// GET /api/org/members — list org members with user info
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ members: [] });

  const db = getServerDb();
  // Use FK hint to disambiguate: organization_members has two FKs to users
  // (user_id and invited_by). PostgREST requires an explicit hint to know which to join.
  const { data, error } = await db
    .from("organization_members")
    .select("id, role, created_at, users!user_id(id, name, email)")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });

  const members = (data ?? []).map((row: any) => ({
    id: row.id,
    role: row.role,
    created_at: row.created_at,
    user_id: row.users?.id,
    name: row.users?.name ?? "Unknown",
    email: row.users?.email ?? "",
  }));

  return NextResponse.json({ members });
}
