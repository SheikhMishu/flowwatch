import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { syncInstance } from "@/lib/sync";

// POST /api/instances/[id]/sync — test connection + full data sync
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ error: "Not available in demo" }, { status: 403 });

  const { id } = await params;
  const result = await syncInstance(id, session.orgId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  // Return last_synced_at so the UI can update the "Last synced" display
  const { getServerDb } = await import("@/lib/db");
  const db = getServerDb();
  const { data: inst } = await db
    .from("n8n_instances")
    .select("last_synced_at")
    .eq("id", id)
    .single();

  return NextResponse.json({ ok: true, last_synced_at: inst?.last_synced_at ?? new Date().toISOString() });
}
