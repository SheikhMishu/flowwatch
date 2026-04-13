import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

// DELETE /api/instances/[id] — disconnect (soft delete via is_active=false, or hard delete)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "viewer") return NextResponse.json({ error: "Viewers cannot remove instances" }, { status: 403 });

  const { id } = await params;
  const db = getServerDb();

  // Verify instance belongs to this org
  const { data: instance } = await db
    .from("n8n_instances")
    .select("id")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .single();

  if (!instance) return NextResponse.json({ error: "Instance not found" }, { status: 404 });

  const { error } = await db.from("n8n_instances").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to remove instance" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
